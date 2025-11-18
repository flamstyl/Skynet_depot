const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * ipcRenderer without exposing the entire object
 */
contextBridge.exposeInMainWorld('api', {
  /**
   * Get all extensions
   * @returns {Promise<Object>} Response with extensions array
   */
  getExtensions: () => {
    return ipcRenderer.invoke('get-extensions');
  },

  /**
   * Get a single extension by ID
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Response with extension object
   */
  getExtension: (extensionId) => {
    return ipcRenderer.invoke('get-extension', extensionId);
  },

  /**
   * Load context for an extension
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Response with context data
   */
  getContext: (extensionId) => {
    return ipcRenderer.invoke('get-context', extensionId);
  },

  /**
   * Launch an extension with its context
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Response with launch result
   */
  launchExtension: (extensionId) => {
    return ipcRenderer.invoke('launch-extension', extensionId);
  },

  /**
   * Check if VS Code is installed
   * @returns {Promise<Object>} Response with installation status
   */
  checkVSCode: () => {
    return ipcRenderer.invoke('check-vscode');
  },

  /**
   * Get recent logs
   * @param {number} lines - Number of lines to retrieve
   * @returns {Promise<Object>} Response with log content
   */
  getLogs: (lines = 100) => {
    return ipcRenderer.invoke('get-logs', lines);
  },

  /**
   * Clear the log file
   * @returns {Promise<Object>} Response with success status
   */
  clearLogs: () => {
    return ipcRenderer.invoke('clear-logs');
  },

  /**
   * Validate context for an extension
   * @param {string} extensionId - Extension ID
   * @returns {Promise<Object>} Response with validation result
   */
  validateContext: (extensionId) => {
    return ipcRenderer.invoke('validate-context', extensionId);
  }
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
