import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import logger from '../utils/logger.js';

const RUNS_DIR = path.resolve(process.cwd(), '../runs');

/**
 * Create a snapshot of a code execution run
 */
export async function createRunSnapshot(data) {
  const {
    runId,
    code,
    language,
    filename,
    stdout,
    stderr,
    exitCode,
    duration
  } = data;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(RUNS_DIR, `${timestamp}_${runId}`);

  try {
    // Create run directory
    await fs.ensureDir(runDir);

    // Create code snapshot
    const codeDir = path.join(runDir, 'code_snapshot');
    await fs.ensureDir(codeDir);
    await fs.writeFile(path.join(codeDir, filename), code);

    // Save stdout
    if (stdout) {
      await fs.writeFile(path.join(runDir, 'stdout.log'), stdout);
    }

    // Save stderr
    if (stderr) {
      await fs.writeFile(path.join(runDir, 'stderr.log'), stderr);
    }

    // Create metadata
    const metadata = {
      runId,
      timestamp: new Date().toISOString(),
      language,
      filename,
      exitCode,
      duration,
      success: exitCode === 0,
      hasStdout: !!stdout,
      hasStderr: !!stderr
    };

    await fs.writeFile(
      path.join(runDir, 'metadata.yaml'),
      yaml.stringify(metadata)
    );

    // Create container info
    const containerInfo = {
      image: 'devbox-sandbox:latest',
      workdir: '/workspace',
      user: 'devbox',
      memory: '512MB',
      cpu: '50%'
    };

    await fs.writeFile(
      path.join(runDir, 'container_info.json'),
      JSON.stringify(containerInfo, null, 2)
    );

    // Initialize fix attempts log
    await fs.writeFile(
      path.join(runDir, 'fixed_attempts.json'),
      JSON.stringify({ attempts: [] }, null, 2)
    );

    logger.info(`Created run snapshot: ${runDir}`);

    return {
      runId,
      snapshotPath: runDir,
      metadata
    };

  } catch (error) {
    logger.error('Failed to create run snapshot:', error);
    throw error;
  }
}

/**
 * Add fix attempt to run snapshot
 */
export async function addFixAttempt(runId, attemptData) {
  try {
    // Find run directory
    const runDir = await findRunDirectory(runId);
    if (!runDir) {
      throw new Error(`Run ${runId} not found`);
    }

    const fixAttemptsPath = path.join(runDir, 'fixed_attempts.json');
    const fixAttempts = await fs.readJson(fixAttemptsPath);

    fixAttempts.attempts.push({
      ...attemptData,
      timestamp: new Date().toISOString()
    });

    await fs.writeFile(fixAttemptsPath, JSON.stringify(fixAttempts, null, 2));

    logger.info(`Added fix attempt to run ${runId}`);

  } catch (error) {
    logger.error('Failed to add fix attempt:', error);
    throw error;
  }
}

/**
 * Get run history (list of all runs)
 */
export async function getRunHistory(limit = 50) {
  try {
    await fs.ensureDir(RUNS_DIR);

    const dirs = await fs.readdir(RUNS_DIR);

    // Sort by timestamp (newest first)
    dirs.sort().reverse();

    const history = [];

    for (const dir of dirs.slice(0, limit)) {
      const metadataPath = path.join(RUNS_DIR, dir, 'metadata.yaml');

      if (await fs.pathExists(metadataPath)) {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = yaml.parse(metadataContent);

        history.push({
          ...metadata,
          directory: dir
        });
      }
    }

    return history;

  } catch (error) {
    logger.error('Failed to get run history:', error);
    throw error;
  }
}

/**
 * Get details of a specific run
 */
export async function getRunDetails(runId) {
  try {
    const runDir = await findRunDirectory(runId);
    if (!runDir) {
      return null;
    }

    // Load metadata
    const metadataPath = path.join(runDir, 'metadata.yaml');
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = yaml.parse(metadataContent);

    // Load stdout
    const stdoutPath = path.join(runDir, 'stdout.log');
    const stdout = await fs.pathExists(stdoutPath)
      ? await fs.readFile(stdoutPath, 'utf-8')
      : '';

    // Load stderr
    const stderrPath = path.join(runDir, 'stderr.log');
    const stderr = await fs.pathExists(stderrPath)
      ? await fs.readFile(stderrPath, 'utf-8')
      : '';

    // Load fix attempts
    const fixAttemptsPath = path.join(runDir, 'fixed_attempts.json');
    const fixAttempts = await fs.pathExists(fixAttemptsPath)
      ? await fs.readJson(fixAttemptsPath)
      : { attempts: [] };

    // Load code
    const codeDir = path.join(runDir, 'code_snapshot');
    const codeFiles = await fs.readdir(codeDir);
    const code = {};

    for (const file of codeFiles) {
      code[file] = await fs.readFile(path.join(codeDir, file), 'utf-8');
    }

    return {
      ...metadata,
      stdout,
      stderr,
      fixAttempts: fixAttempts.attempts,
      code,
      directory: path.basename(runDir)
    };

  } catch (error) {
    logger.error('Failed to get run details:', error);
    throw error;
  }
}

/**
 * Find run directory by runId
 */
async function findRunDirectory(runId) {
  try {
    const dirs = await fs.readdir(RUNS_DIR);

    for (const dir of dirs) {
      if (dir.includes(runId)) {
        return path.join(RUNS_DIR, dir);
      }
    }

    return null;

  } catch (error) {
    logger.error('Failed to find run directory:', error);
    return null;
  }
}

/**
 * Clean old run snapshots
 * @param {number} daysToKeep - Number of days to keep (default: 30)
 */
export async function cleanOldRuns(daysToKeep = 30) {
  try {
    await fs.ensureDir(RUNS_DIR);

    const dirs = await fs.readdir(RUNS_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    for (const dir of dirs) {
      const metadataPath = path.join(RUNS_DIR, dir, 'metadata.yaml');

      if (await fs.pathExists(metadataPath)) {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadata = yaml.parse(metadataContent);

        const runDate = new Date(metadata.timestamp);

        if (runDate < cutoffDate) {
          await fs.remove(path.join(RUNS_DIR, dir));
          deletedCount++;
          logger.info(`Deleted old run: ${dir}`);
        }
      }
    }

    logger.info(`Cleaned ${deletedCount} old runs`);
    return deletedCount;

  } catch (error) {
    logger.error('Failed to clean old runs:', error);
    throw error;
  }
}

/**
 * Export run as archive
 */
export async function exportRun(runId, outputPath) {
  try {
    const runDir = await findRunDirectory(runId);
    if (!runDir) {
      throw new Error(`Run ${runId} not found`);
    }

    // TODO: Implement archiving with tar or zip
    logger.info(`Exporting run ${runId} to ${outputPath}`);

    return {
      success: true,
      outputPath
    };

  } catch (error) {
    logger.error('Failed to export run:', error);
    throw error;
  }
}
