import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger.js';

const execAsync = promisify(exec);

const VM_CONFIG_DIR = path.resolve(process.cwd(), '../vms');
const WORKSPACE_DIR = path.resolve(process.cwd(), '../workspace');

/**
 * Test code in a VM (Linux or Windows)
 * @param {Object} options - Test options
 * @param {string} options.code - Code to test
 * @param {string} options.os - OS type ('linux' or 'windows')
 * @param {string} options.language - Programming language
 * @returns {Object} Test result
 */
export async function testInVM(options) {
  const { code, os, language } = options;

  logger.info(`Testing code in ${os} VM`);

  if (os === 'linux') {
    return await testInLinuxVM(code, language);
  } else if (os === 'windows') {
    return await testInWindowsVM(code, language);
  } else {
    throw new Error(`Unsupported OS: ${os}`);
  }
}

/**
 * Test code in Linux VM (QEMU)
 */
async function testInLinuxVM(code, language) {
  const startTime = Date.now();

  try {
    logger.info('Starting Linux VM test...');

    // Check if Linux VM is running
    const vmStatus = await checkLinuxVMStatus();

    if (!vmStatus.running) {
      logger.info('Linux VM not running, starting...');
      await startLinuxVM();
    }

    // Copy code to VM
    const filename = `test.${getExtension(language)}`;
    const localPath = path.join(WORKSPACE_DIR, 'input', filename);
    await fs.writeFile(localPath, code);

    // Use SCP to copy file to VM
    const vmUser = 'devbox';
    const vmHost = 'localhost';
    const vmPort = 2222; // SSH port forwarded from QEMU
    const vmPath = `/home/${vmUser}/test/${filename}`;

    logger.info('Copying code to Linux VM...');
    await execAsync(`scp -P ${vmPort} ${localPath} ${vmUser}@${vmHost}:${vmPath}`);

    // Execute code in VM via SSH
    const runCommand = getLinuxRunCommand(language, filename);
    logger.info(`Executing in Linux VM: ${runCommand}`);

    const { stdout, stderr } = await execAsync(
      `ssh -p ${vmPort} ${vmUser}@${vmHost} '${runCommand}'`
    );

    const duration = Date.now() - startTime;

    logger.info(`Linux VM test completed in ${duration}ms`);

    return {
      success: !stderr,
      os: 'linux',
      stdout,
      stderr,
      duration
    };

  } catch (error) {
    logger.error('Linux VM test failed:', error);

    return {
      success: false,
      os: 'linux',
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Test code in Windows VM (VirtualBox)
 */
async function testInWindowsVM(code, language) {
  const startTime = Date.now();

  try {
    logger.info('Starting Windows VM test...');

    // Check if Windows VM is running
    const vmStatus = await checkWindowsVMStatus();

    if (!vmStatus.running) {
      logger.info('Windows VM not running, starting...');
      await startWindowsVM();
    }

    // Copy code to VM
    const filename = `test.${getExtension(language)}`;
    const localPath = path.join(WORKSPACE_DIR, 'input', filename);
    await fs.writeFile(localPath, code);

    // Use VirtualBox shared folder or copy file
    const vmName = 'DevBox-Windows';

    logger.info('Copying code to Windows VM...');

    // Execute code in VM via PowerShell remoting
    const runCommand = getWindowsRunCommand(language, filename);
    logger.info(`Executing in Windows VM: ${runCommand}`);

    const { stdout, stderr } = await execAsync(
      `VBoxManage guestcontrol ${vmName} run --exe "powershell.exe" --username devbox --password devbox -- -Command "${runCommand}"`
    );

    const duration = Date.now() - startTime;

    logger.info(`Windows VM test completed in ${duration}ms`);

    return {
      success: !stderr,
      os: 'windows',
      stdout,
      stderr,
      duration
    };

  } catch (error) {
    logger.error('Windows VM test failed:', error);

    return {
      success: false,
      os: 'windows',
      error: error.message,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Check Linux VM status
 */
async function checkLinuxVMStatus() {
  try {
    // Try to SSH to check if VM is running
    await execAsync('ssh -p 2222 -o ConnectTimeout=5 devbox@localhost "echo alive"');
    return { running: true };
  } catch (error) {
    return { running: false };
  }
}

/**
 * Start Linux VM (QEMU)
 */
async function startLinuxVM() {
  try {
    const vmScript = path.join(VM_CONFIG_DIR, 'qemu_launcher.sh');

    if (!await fs.pathExists(vmScript)) {
      throw new Error('QEMU launcher script not found');
    }

    logger.info('Starting Linux VM with QEMU...');

    // Start VM in background
    exec(`bash ${vmScript} &`, (error) => {
      if (error) {
        logger.error('Failed to start Linux VM:', error);
      }
    });

    // Wait for VM to be ready (check SSH)
    let retries = 30;
    while (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const status = await checkLinuxVMStatus();
      if (status.running) {
        logger.info('Linux VM ready');
        return;
      }

      retries--;
    }

    throw new Error('Linux VM failed to start within timeout');

  } catch (error) {
    logger.error('Failed to start Linux VM:', error);
    throw error;
  }
}

/**
 * Check Windows VM status
 */
async function checkWindowsVMStatus() {
  try {
    const { stdout } = await execAsync('VBoxManage list runningvms');
    const isRunning = stdout.includes('DevBox-Windows');
    return { running: isRunning };
  } catch (error) {
    return { running: false };
  }
}

/**
 * Start Windows VM (VirtualBox)
 */
async function startWindowsVM() {
  try {
    logger.info('Starting Windows VM with VirtualBox...');

    await execAsync('VBoxManage startvm DevBox-Windows --type headless');

    // Wait for VM to be ready
    let retries = 30;
    while (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const status = await checkWindowsVMStatus();
      if (status.running) {
        logger.info('Windows VM ready');
        return;
      }

      retries--;
    }

    throw new Error('Windows VM failed to start within timeout');

  } catch (error) {
    logger.error('Failed to start Windows VM:', error);
    throw error;
  }
}

/**
 * Get Linux run command for language
 */
function getLinuxRunCommand(language, filename) {
  const commands = {
    'python': `python3 /home/devbox/test/${filename}`,
    'javascript': `node /home/devbox/test/${filename}`,
    'rust': `rustc /home/devbox/test/${filename} -o /home/devbox/test/program && /home/devbox/test/program`,
    'go': `go run /home/devbox/test/${filename}`,
    'java': `javac /home/devbox/test/${filename} && java -cp /home/devbox/test ${filename.replace('.java', '')}`,
    'cpp': `g++ /home/devbox/test/${filename} -o /home/devbox/test/program && /home/devbox/test/program`,
    'c': `gcc /home/devbox/test/${filename} -o /home/devbox/test/program && /home/devbox/test/program`,
    'shell': `bash /home/devbox/test/${filename}`
  };

  return commands[language] || `cat /home/devbox/test/${filename}`;
}

/**
 * Get Windows run command for language
 */
function getWindowsRunCommand(language, filename) {
  const commands = {
    'python': `python C:\\workspace\\${filename}`,
    'javascript': `node C:\\workspace\\${filename}`,
    'csharp': `dotnet run --project C:\\workspace`,
    'powershell': `powershell -File C:\\workspace\\${filename}`
  };

  return commands[language] || `type C:\\workspace\\${filename}`;
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
    'shell': 'sh',
    'powershell': 'ps1'
  };

  return extensions[language] || 'txt';
}

/**
 * Stop Linux VM
 */
export async function stopLinuxVM() {
  try {
    logger.info('Stopping Linux VM...');
    await execAsync('ssh -p 2222 devbox@localhost "sudo poweroff"');
    logger.info('Linux VM stopped');
  } catch (error) {
    logger.error('Failed to stop Linux VM:', error);
    throw error;
  }
}

/**
 * Stop Windows VM
 */
export async function stopWindowsVM() {
  try {
    logger.info('Stopping Windows VM...');
    await execAsync('VBoxManage controlvm DevBox-Windows poweroff');
    logger.info('Windows VM stopped');
  } catch (error) {
    logger.error('Failed to stop Windows VM:', error);
    throw error;
  }
}

/**
 * Get VM status for both Linux and Windows
 */
export async function getVMStatus() {
  const linux = await checkLinuxVMStatus();
  const windows = await checkWindowsVMStatus();

  return {
    linux,
    windows
  };
}
