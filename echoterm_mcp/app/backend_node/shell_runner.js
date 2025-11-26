const { spawn } = require('child_process');
const path = require('path');

// Default shell configuration
const DEFAULT_SHELL = process.platform === 'win32' ? 'powershell.exe' : 'bash';
const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Execute a shell command
 * @param {string} command - Command to execute
 * @param {object} options - Execution options
 * @returns {Promise<object>} - Execution result
 */
async function execute(command, options = {}) {
  const startTime = Date.now();

  const {
    shell = DEFAULT_SHELL,
    timeout = DEFAULT_TIMEOUT,
    cwd = process.cwd(),
    env = process.env
  } = options;

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    // Spawn process
    const childProcess = spawn(shell, ['-Command', command], {
      cwd,
      env,
      windowsHide: true,
      shell: false
    });

    // Collect stdout
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle exit
    childProcess.on('exit', (code) => {
      const duration = Date.now() - startTime;

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: code !== null ? code : 1,
        duration
      });
    });

    // Handle error
    childProcess.on('error', (error) => {
      const duration = Date.now() - startTime;

      reject({
        stdout: stdout.trim(),
        stderr: error.message,
        exitCode: 1,
        duration
      });
    });

    // Timeout
    const timeoutId = setTimeout(() => {
      childProcess.kill('SIGTERM');

      setTimeout(() => {
        if (!childProcess.killed) {
          childProcess.kill('SIGKILL');
        }
      }, 5000);

      const duration = Date.now() - startTime;

      reject({
        stdout: stdout.trim(),
        stderr: `Command timed out after ${timeout}ms`,
        exitCode: 124,
        duration
      });
    }, timeout);

    // Clear timeout on exit
    childProcess.on('exit', () => {
      clearTimeout(timeoutId);
    });
  });
}

/**
 * Detect shell type
 * @returns {string} - Shell type (powershell, cmd, bash, zsh, etc.)
 */
function detectShell() {
  if (process.platform === 'win32') {
    // Check if PowerShell is available
    return 'powershell.exe';
  } else if (process.platform === 'darwin' || process.platform === 'linux') {
    // Unix-like systems
    return process.env.SHELL || 'bash';
  }

  return DEFAULT_SHELL;
}

/**
 * Check if a command is safe
 * @param {string} command - Command to check
 * @returns {object} - Safety info
 */
function checkSafety(command) {
  const dangerousPatterns = [
    /rm\s+-rf\s+\//i,
    /del\s+\/s\s+\/q/i,
    /format\s+[a-z]:/i,
    /mkfs/i,
    /dd\s+if=/i,
    /:(){ :|:& };:/i, // Fork bomb
  ];

  const complexPatterns = [
    /\|/,
    /&&/,
    /;/,
    />/,
    /<</,
    /\$/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(command)) {
      return {
        level: 'danger',
        message: 'This command may be destructive'
      };
    }
  }

  for (const pattern of complexPatterns) {
    if (pattern.test(command)) {
      return {
        level: 'complex',
        message: 'This command uses advanced features'
      };
    }
  }

  return {
    level: 'safe',
    message: 'This command appears safe'
  };
}

module.exports = {
  execute,
  detectShell,
  checkSafety
};
