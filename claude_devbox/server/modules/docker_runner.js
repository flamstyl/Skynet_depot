import Docker from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import logger from '../utils/logger.js';
import { createRunSnapshot } from './logging.js';
import { wss } from '../index.js';

const docker = new Docker();
let currentContainer = null;

const WORKSPACE_DIR = path.resolve(process.cwd(), '../workspace');
const SANDBOX_IMAGE = 'devbox-sandbox:latest';

/**
 * Initialize Docker and verify sandbox image
 */
export async function initDocker() {
  try {
    // Check Docker connectivity
    await docker.ping();
    logger.info('Docker daemon connected');

    // Check if sandbox image exists
    const images = await docker.listImages();
    const hasImage = images.some(img =>
      img.RepoTags && img.RepoTags.includes(SANDBOX_IMAGE)
    );

    if (!hasImage) {
      logger.warn(`Sandbox image ${SANDBOX_IMAGE} not found. Please build it first.`);
      logger.info('Run: docker build -t devbox-sandbox:latest ./docker');
    } else {
      logger.info(`Sandbox image ${SANDBOX_IMAGE} ready`);
    }

    // Ensure workspace directories exist
    await fs.ensureDir(path.join(WORKSPACE_DIR, 'input'));
    await fs.ensureDir(path.join(WORKSPACE_DIR, 'output'));
    logger.info('Workspace directories ready');

    return true;
  } catch (error) {
    logger.error('Docker initialization failed:', error);
    throw error;
  }
}

/**
 * Execute code in Docker sandbox
 * @param {Object} options - Execution options
 * @param {string} options.code - Code to execute
 * @param {string} options.language - Programming language
 * @param {string} options.filename - Optional filename
 * @param {boolean} options.autoFix - Enable auto-fix on error
 * @param {boolean} options.isCommand - Execute as shell command
 * @returns {Object} Execution result
 */
export async function runCode(options) {
  const {
    code,
    language = 'python',
    filename,
    autoFix = false,
    isCommand = false
  } = options;

  const runId = uuidv4();
  const startTime = Date.now();

  logger.info(`[${runId}] Starting execution (${language})`);
  broadcastWS({ type: 'status', status: 'running', runId });

  try {
    // Prepare input file
    const ext = getExtension(language);
    const inputFilename = filename || `main.${ext}`;
    const inputPath = path.join(WORKSPACE_DIR, 'input', inputFilename);

    if (!isCommand) {
      await fs.writeFile(inputPath, code);
      broadcastWS({ type: 'docker_log', message: `Created ${inputFilename}` });
    }

    // Create container
    const container = await createContainer(language, inputFilename, isCommand ? code : null);
    currentContainer = container;

    broadcastWS({ type: 'docker_log', message: 'Container created, starting...' });

    // Start container
    await container.start();
    broadcastWS({ type: 'docker_log', message: 'Container started' });

    // Stream logs
    const logStream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true
    });

    let stdout = '';
    let stderr = '';

    // Parse Docker multiplexed stream
    logStream.on('data', (chunk) => {
      const header = chunk[0];
      const data = chunk.slice(8).toString();

      if (header === 1) {
        // stdout
        stdout += data;
        broadcastWS({ type: 'stdout', message: data });
      } else if (header === 2) {
        // stderr
        stderr += data;
        broadcastWS({ type: 'stderr', message: data });
      }
    });

    // Wait for container to exit
    const result = await container.wait();
    const exitCode = result.StatusCode;

    const duration = Date.now() - startTime;

    logger.info(`[${runId}] Execution completed (exit code: ${exitCode}, ${duration}ms)`);

    // Clean up container
    await container.remove();
    currentContainer = null;

    // Create snapshot
    const snapshot = await createRunSnapshot({
      runId,
      code,
      language,
      filename: inputFilename,
      stdout,
      stderr,
      exitCode,
      duration
    });

    broadcastWS({
      type: 'execution_complete',
      runId,
      exitCode,
      stderr,
      duration
    });

    // Check if auto-fix is needed
    if (autoFix && exitCode !== 0 && stderr) {
      broadcastWS({ type: 'docker_log', message: 'Auto-fix triggered...' });
      // TODO: Trigger auto-fix loop
    }

    return {
      success: exitCode === 0,
      runId,
      exitCode,
      stdout,
      stderr,
      duration,
      snapshot
    };

  } catch (error) {
    logger.error(`[${runId}] Execution failed:`, error);

    broadcastWS({
      type: 'execution_complete',
      runId,
      exitCode: -1,
      stderr: error.message,
      duration: Date.now() - startTime
    });

    // Clean up on error
    if (currentContainer) {
      try {
        await currentContainer.remove({ force: true });
      } catch (cleanupError) {
        logger.error('Container cleanup failed:', cleanupError);
      }
      currentContainer = null;
    }

    throw error;
  }
}

/**
 * Create Docker container for execution
 */
async function createContainer(language, filename, command) {
  const cmd = command || getRunCommand(language, filename);

  const container = await docker.createContainer({
    Image: SANDBOX_IMAGE,
    Cmd: ['sh', '-c', cmd],
    WorkingDir: '/workspace',
    HostConfig: {
      Binds: [
        `${WORKSPACE_DIR}/input:/workspace/input:ro`,
        `${WORKSPACE_DIR}/output:/workspace/output:rw`
      ],
      Memory: 512 * 1024 * 1024, // 512 MB
      MemorySwap: 512 * 1024 * 1024,
      CpuQuota: 50000, // 50% of one CPU
      NetworkMode: 'bridge', // Internet enabled
      AutoRemove: false
    },
    User: 'devbox',
    Tty: false,
    AttachStdin: false,
    AttachStdout: true,
    AttachStderr: true
  });

  return container;
}

/**
 * Get run command based on language
 */
function getRunCommand(language, filename) {
  const commands = {
    'python': `python3 /workspace/input/${filename}`,
    'javascript': `node /workspace/input/${filename}`,
    'typescript': `ts-node /workspace/input/${filename}`,
    'rust': `rustc /workspace/input/${filename} -o /workspace/output/program && /workspace/output/program`,
    'go': `go run /workspace/input/${filename}`,
    'java': `javac /workspace/input/${filename} && java -cp /workspace/input ${filename.replace('.java', '')}`,
    'cpp': `g++ /workspace/input/${filename} -o /workspace/output/program && /workspace/output/program`,
    'c': `gcc /workspace/input/${filename} -o /workspace/output/program && /workspace/output/program`,
    'csharp': `dotnet run --project /workspace/input`,
    'ruby': `ruby /workspace/input/${filename}`,
    'php': `php /workspace/input/${filename}`,
    'shell': `bash /workspace/input/${filename}`
  };

  return commands[language] || `cat /workspace/input/${filename}`;
}

/**
 * Get file extension for language
 */
function getExtension(language) {
  const extensions = {
    'python': 'py',
    'javascript': 'js',
    'typescript': 'ts',
    'rust': 'rs',
    'go': 'go',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'cs',
    'ruby': 'rb',
    'php': 'php',
    'shell': 'sh'
  };

  return extensions[language] || 'txt';
}

/**
 * Stop current execution
 */
export async function stopExecution() {
  if (currentContainer) {
    logger.info('Stopping current container...');
    try {
      await currentContainer.stop({ t: 5 });
      await currentContainer.remove();
      currentContainer = null;
      broadcastWS({ type: 'docker_log', message: 'Execution stopped by user' });
      logger.info('Container stopped');
    } catch (error) {
      logger.error('Failed to stop container:', error);
      throw error;
    }
  } else {
    logger.warn('No container running');
  }
}

/**
 * Broadcast message to all WebSocket clients
 */
function broadcastWS(data) {
  if (wss && wss.clients) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(data));
      }
    });
  }
}
