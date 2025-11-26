const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let canvasWindow;

// Backend server URL (adjust based on environment)
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Create the main application window
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Development tools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Create the canvas editor window
 */
function createCanvasWindow() {
  canvasWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset',
    frame: false,
    show: false
  });

  canvasWindow.loadFile(path.join(__dirname, 'src', 'canvas.html'));

  canvasWindow.once('ready-to-show', () => {
    canvasWindow.show();
  });

  if (process.argv.includes('--dev')) {
    canvasWindow.webContents.openDevTools();
  }

  canvasWindow.on('closed', () => {
    canvasWindow = null;
  });
}

/**
 * Application lifecycle
 */
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * IPC Handlers
 */

// Open canvas editor
ipcMain.handle('open-canvas', async (event, agentData) => {
  if (!canvasWindow) {
    createCanvasWindow();
  } else {
    canvasWindow.focus();
  }

  // Send agent data to canvas if provided
  if (agentData) {
    canvasWindow.webContents.once('did-finish-load', () => {
      canvasWindow.webContents.send('load-agent', agentData);
    });
  }

  return { success: true };
});

// Save agent project
ipcMain.handle('save-agent', async (event, agentData) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Agent Project',
      defaultPath: `agent_${Date.now()}.json`,
      filters: [
        { name: 'Agent Project', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(agentData, null, 2));
      return { success: true, path: filePath };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Save error:', error);
    return { success: false, error: error.message };
  }
});

// Load agent project
ipcMain.handle('load-agent', async () => {
  try {
    const { filePaths } = await dialog.showOpenDialog({
      title: 'Load Agent Project',
      filters: [
        { name: 'Agent Project', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (filePaths && filePaths.length > 0) {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      const agentData = JSON.parse(content);
      return { success: true, data: agentData, path: filePaths[0] };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Load error:', error);
    return { success: false, error: error.message };
  }
});

// Export agent (YAML/JSON)
ipcMain.handle('export-agent', async (event, { format, agentData }) => {
  try {
    const extension = format === 'yaml' ? 'yaml' : 'json';
    const { filePath } = await dialog.showSaveDialog({
      title: `Export Agent as ${format.toUpperCase()}`,
      defaultPath: `${agentData.metadata?.name || 'agent'}.${extension}`,
      filters: [
        { name: format.toUpperCase(), extensions: [extension] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (filePath) {
      // Forward to backend for processing
      const axios = require('axios');
      const response = await axios.post(`${BACKEND_URL}/api/export/${format}`, {
        agentData
      });

      fs.writeFileSync(filePath, response.data.content);
      return { success: true, path: filePath };
    }

    return { success: false, cancelled: true };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: error.message };
  }
});

// Validate agent with AI
ipcMain.handle('validate-agent-ai', async (event, agentData) => {
  try {
    const axios = require('axios');
    const response = await axios.post(`${BACKEND_URL}/api/validate/ai`, {
      agentData
    });

    return { success: true, validation: response.data };
  } catch (error) {
    console.error('AI Validation error:', error);
    return { success: false, error: error.message };
  }
});

// Run dry-run simulation
ipcMain.handle('dry-run-agent', async (event, { agentData, testInput }) => {
  try {
    const axios = require('axios');
    const response = await axios.post(`${BACKEND_URL}/api/dry-run`, {
      agentData,
      testInput
    });

    return { success: true, results: response.data };
  } catch (error) {
    console.error('Dry-run error:', error);
    return { success: false, error: error.message };
  }
});

// Window controls
ipcMain.handle('window-minimize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.minimize();
});

ipcMain.handle('window-maximize', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window?.isMaximized()) {
    window.unmaximize();
  } else {
    window?.maximize();
  }
});

ipcMain.handle('window-close', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.close();
});

console.log('🔥 MCP Forge - Skynet Agent Builder');
console.log('Backend URL:', BACKEND_URL);
