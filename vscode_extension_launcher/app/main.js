const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ExtensionManager = require('./extension_manager');
const ContextLoader = require('./context_loader');

// Get the base path (parent of app directory)
const basePath = path.join(__dirname, '..');

// Initialize managers
const extensionManager = new ExtensionManager(basePath);
const contextLoader = new ContextLoader(basePath);

let mainWindow;

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, '../renderer/icon.png'),
    title: 'VS Code Extension Launcher - Skynet Edition'
  });

  // Load the renderer HTML
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Log when window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    extensionManager.log('Application window loaded');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle events
app.whenReady().then(() => {
  extensionManager.log('=== VS Code Extension Launcher Started ===');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  extensionManager.log('=== VS Code Extension Launcher Stopped ===');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

/**
 * Get all extensions
 */
ipcMain.handle('get-extensions', async () => {
  try {
    const extensions = extensionManager.getExtensions();
    return { success: true, data: extensions };
  } catch (error) {
    extensionManager.log(`ERROR in get-extensions: ${error.message}`);
    return { success: false, error: error.message };
  }
});

/**
 * Get extension by ID
 */
ipcMain.handle('get-extension', async (event, extensionId) => {
  try {
    const extension = extensionManager.getExtensionById(extensionId);
    if (!extension) {
      return { success: false, error: 'Extension not found' };
    }
    return { success: true, data: extension };
  } catch (error) {
    extensionManager.log(`ERROR in get-extension: ${error.message}`);
    return { success: false, error: error.message };
  }
});

/**
 * Load context for an extension
 */
ipcMain.handle('get-context', async (event, extensionId) => {
  try {
    const extension = extensionManager.getExtensionById(extensionId);
    if (!extension) {
      return { success: false, error: 'Extension not found' };
    }

    const context = contextLoader.loadContextForExtension(extension);
    const summary = contextLoader.getContextSummary(context);

    return {
      success: true,
      data: {
        context: context,
        summary: summary
      }
    };
  } catch (error) {
    extensionManager.log(`ERROR in get-context: ${error.message}`);
    return { success: false, error: error.message };
  }
});

/**
 * Launch an extension
 */
ipcMain.handle('launch-extension', async (event, extensionId) => {
  try {
    const extension = extensionManager.getExtensionById(extensionId);
    if (!extension) {
      return { success: false, error: 'Extension not found' };
    }

    // Load context
    const context = contextLoader.loadContextForExtension(extension);

    // Launch the extension
    const result = await extensionManager.launchExtension(extensionId, context);

    return { success: true, data: result };
  } catch (error) {
    extensionManager.log(`ERROR in launch-extension: ${error.message}`);
    return { success: false, error: error.message };
  }
});

/**
 * Check if VS Code is installed
 */
ipcMain.handle('check-vscode', async () => {
  try {
    const isInstalled = await extensionManager.checkVSCodeInstalled();
    return { success: true, data: { installed: isInstalled } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Get recent logs
 */
ipcMain.handle('get-logs', async (event, lines = 100) => {
  try {
    const logs = extensionManager.getLogs(lines);
    return { success: true, data: logs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Clear logs
 */
ipcMain.handle('clear-logs', async () => {
  try {
    extensionManager.clearLogs();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Validate a context
 */
ipcMain.handle('validate-context', async (event, extensionId) => {
  try {
    const extension = extensionManager.getExtensionById(extensionId);
    if (!extension) {
      return { success: false, error: 'Extension not found' };
    }

    const context = contextLoader.loadContextForExtension(extension);
    const validation = contextLoader.validateContext(context);

    return { success: true, data: validation };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  extensionManager.log(`UNCAUGHT EXCEPTION: ${error.message}`);
  extensionManager.log(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  extensionManager.log(`UNHANDLED REJECTION at: ${promise}, reason: ${reason}`);
});
