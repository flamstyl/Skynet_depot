const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

// Backend Node.js server URL
const BACKEND_URL = 'http://localhost:3737';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ========== IPC HANDLERS ==========

// Shell execution
ipcMain.handle('shell:run', async (event, command) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/shell/run`, { command });
    return response.data;
  } catch (error) {
    console.error('Shell execution error:', error);
    return {
      success: false,
      error: error.message,
      stdout: '',
      stderr: error.response?.data?.stderr || error.message,
      exitCode: 1
    };
  }
});

// IA suggestion
ipcMain.handle('ia:suggest', async (event, text, context = {}) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/ia/suggest`, {
      text,
      context
    });
    return response.data;
  } catch (error) {
    console.error('IA suggestion error:', error);
    return {
      success: false,
      error: error.message,
      suggestions: []
    };
  }
});

// Alias resolution
ipcMain.handle('alias:resolve', async (event, text) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/alias/resolve`, { text });
    return response.data;
  } catch (error) {
    console.error('Alias resolution error:', error);
    return {
      success: false,
      error: error.message,
      command: null
    };
  }
});

// Alias list
ipcMain.handle('alias:list', async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/alias/list`);
    return response.data;
  } catch (error) {
    console.error('Alias list error:', error);
    return {
      success: false,
      error: error.message,
      aliases: []
    };
  }
});

// Alias save
ipcMain.handle('alias:save', async (event, alias) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/alias/save`, alias);
    return response.data;
  } catch (error) {
    console.error('Alias save error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Alias delete
ipcMain.handle('alias:delete', async (event, natural) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/alias/delete`, { natural });
    return response.data;
  } catch (error) {
    console.error('Alias delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// History
ipcMain.handle('history:list', async (event, filters = {}) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/history/list`, {
      params: filters
    });
    return response.data;
  } catch (error) {
    console.error('History list error:', error);
    return {
      success: false,
      error: error.message,
      history: []
    };
  }
});

// Memory - session
ipcMain.handle('memory:session', async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/memory/session`);
    return response.data;
  } catch (error) {
    console.error('Memory session error:', error);
    return {
      success: false,
      error: error.message,
      memory: null
    };
  }
});

// Memory - long term
ipcMain.handle('memory:longterm', async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/memory/longterm`);
    return response.data;
  } catch (error) {
    console.error('Memory longterm error:', error);
    return {
      success: false,
      error: error.message,
      memory: null
    };
  }
});

// Memory - update
ipcMain.handle('memory:update', async (event, data) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/memory/update`, data);
    return response.data;
  } catch (error) {
    console.error('Memory update error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Session summary
ipcMain.handle('session:summary', async () => {
  try {
    const response = await axios.post(`${BACKEND_URL}/session/summary`);
    return response.data;
  } catch (error) {
    console.error('Session summary error:', error);
    return {
      success: false,
      error: error.message,
      summary: ''
    };
  }
});

console.log('EchoTerm MCP - Electron main process started');
