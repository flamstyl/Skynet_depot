const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = {
    BACKEND_URL: 'http://localhost:8765',
    HOTKEY: 'Alt+Space',
    WINDOW_WIDTH: 700,
    WINDOW_HEIGHT: 500
};

let mainWindow = null;

// Create the launcher window
function createWindow() {
    mainWindow = new BrowserWindow({
        width: CONFIG.WINDOW_WIDTH,
        height: CONFIG.WINDOW_HEIGHT,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    // Center window on screen
    mainWindow.center();

    // Hide window when it loses focus
    mainWindow.on('blur', () => {
        if (!mainWindow.webContents.isDevToolsOpened()) {
            hideWindow();
        }
    });

    // Dev tools in dev mode
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

// Show window
function showWindow() {
    if (mainWindow) {
        mainWindow.center();
        mainWindow.show();
        mainWindow.focus();
    }
}

// Hide window
function hideWindow() {
    if (mainWindow) {
        mainWindow.hide();
        mainWindow.webContents.send('window-hidden');
    }
}

// Toggle window visibility
function toggleWindow() {
    if (mainWindow.isVisible()) {
        hideWindow();
    } else {
        showWindow();
    }
}

// Register global hotkey
function registerHotkey() {
    const ret = globalShortcut.register(CONFIG.HOTKEY, () => {
        toggleWindow();
    });

    if (!ret) {
        console.error('Global hotkey registration failed');
    }
}

// App ready
app.whenReady().then(() => {
    createWindow();
    registerHotkey();

    // Check backend connection
    checkBackendConnection();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Cleanup before quit
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// Check backend connection
async function checkBackendConnection() {
    try {
        await axios.get(`${CONFIG.BACKEND_URL}/health`);
        console.log('Backend connected');
    } catch (error) {
        console.error('Backend not reachable. Make sure Python server is running on port 8765');
    }
}

// IPC Handlers

// Search request
ipcMain.handle('search', async (event, query) => {
    try {
        const response = await axios.post(`${CONFIG.BACKEND_URL}/search`, { query });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Search error:', error);
        return { success: false, error: error.message };
    }
});

// AI prompt request
ipcMain.handle('ai-prompt', async (event, prompt) => {
    try {
        const response = await axios.post(`${CONFIG.BACKEND_URL}/ai`, {
            prompt,
            mode: 'contextual'
        });
        return { success: true, data: response.data };
    } catch (error) {
        console.error('AI prompt error:', error);
        return { success: false, error: error.message };
    }
});

// Execute action
ipcMain.handle('execute-action', async (event, action) => {
    try {
        const response = await axios.post(`${CONFIG.BACKEND_URL}/action`, action);

        // Hide window after action execution
        if (response.data.status === 'success') {
            setTimeout(() => hideWindow(), 100);
        }

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Action execution error:', error);
        return { success: false, error: error.message };
    }
});

// Load plugins
ipcMain.handle('load-plugins', async (event) => {
    try {
        const response = await axios.get(`${CONFIG.BACKEND_URL}/plugins`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Plugin load error:', error);
        return { success: false, error: error.message };
    }
});

// Rebuild index
ipcMain.handle('rebuild-index', async (event) => {
    try {
        const response = await axios.post(`${CONFIG.BACKEND_URL}/index/rebuild`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('Index rebuild error:', error);
        return { success: false, error: error.message };
    }
});

// Hide window request from renderer
ipcMain.on('hide-window', () => {
    hideWindow();
});

// Show window request from renderer
ipcMain.on('show-window', () => {
    showWindow();
});

console.log(`QuickLauncher MCP started. Press ${CONFIG.HOTKEY} to activate.`);
