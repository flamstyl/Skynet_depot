const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ExtensionManager {
  constructor(basePath) {
    this.basePath = basePath;
    this.extensionsFile = path.join(basePath, 'data', 'extensions.json');
    this.logsDir = path.join(basePath, 'logs');
    this.logFile = path.join(this.logsDir, 'launcher.log');

    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Load all extensions from extensions.json
   * @returns {Array} Array of extension objects
   */
  getExtensions() {
    try {
      const data = fs.readFileSync(this.extensionsFile, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.extensions || [];
    } catch (error) {
      this.log(`ERROR: Failed to load extensions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get a single extension by ID
   * @param {string} id - Extension ID
   * @returns {Object|null} Extension object or null
   */
  getExtensionById(id) {
    const extensions = this.getExtensions();
    return extensions.find(ext => ext.id === id) || null;
  }

  /**
   * Launch a VS Code extension
   * @param {string} extensionId - Extension ID
   * @param {Object} context - Context data to pass
   * @returns {Promise<Object>} Launch result
   */
  async launchExtension(extensionId, context = null) {
    const extension = this.getExtensionById(extensionId);

    if (!extension) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    if (!extension.enabled) {
      throw new Error(`Extension is disabled: ${extensionId}`);
    }

    this.log(`Launching extension: ${extension.name} (${extension.vscode_id})`);
    this.log(`Agent: ${extension.agent}`);

    if (context) {
      this.log(`Context loaded: ${JSON.stringify(context, null, 2)}`);
    }

    try {
      // Prepare the VS Code launch command
      let command = 'code';

      // If context contains a workspace path, open it
      if (context && context.workspace_path) {
        command += ` "${context.workspace_path}"`;
      }

      // If context contains files to open, add them
      if (context && context.files && context.files.length > 0) {
        context.files.forEach(file => {
          command += ` "${file}"`;
        });
      }

      this.log(`Executing command: ${command}`);

      // Execute the command
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('Debugger attached')) {
        this.log(`STDERR: ${stderr}`);
      }

      if (stdout) {
        this.log(`STDOUT: ${stdout}`);
      }

      this.log(`✓ Extension launched successfully: ${extension.name}`);

      return {
        success: true,
        extension: extension,
        message: `Extension ${extension.name} launched successfully`
      };

    } catch (error) {
      this.log(`ERROR: Failed to launch extension: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if VS Code is installed
   * @returns {Promise<boolean>} True if VS Code is installed
   */
  async checkVSCodeInstalled() {
    try {
      await execAsync('code --version');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Log a message to the log file
   * @param {string} message - Message to log
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    try {
      fs.appendFileSync(this.logFile, logEntry);
      console.log(logEntry.trim());
    } catch (error) {
      console.error(`Failed to write log: ${error.message}`);
    }
  }

  /**
   * Clear the log file
   */
  clearLogs() {
    try {
      fs.writeFileSync(this.logFile, '');
      this.log('Logs cleared');
    } catch (error) {
      console.error(`Failed to clear logs: ${error.message}`);
    }
  }

  /**
   * Get recent log entries
   * @param {number} lines - Number of lines to retrieve
   * @returns {string} Log content
   */
  getLogs(lines = 100) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return '';
      }

      const content = fs.readFileSync(this.logFile, 'utf-8');
      const logLines = content.split('\n').filter(line => line.trim());
      return logLines.slice(-lines).join('\n');
    } catch (error) {
      return `Error reading logs: ${error.message}`;
    }
  }
}

module.exports = ExtensionManager;
