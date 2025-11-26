/**
 * NoteVault — Electron Main Process
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const axios = require('axios');

const BACKEND_URL = 'http://localhost:5050';
const MCP_URL = 'http://localhost:3000';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#1a1a1a',
    title: 'NoteVault'
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Dev tools (comment in production)
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers

// Vault operations
ipcMain.handle('vault:unlock', async (event, password) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/vault/unlock`, { password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to unlock vault');
  }
});

ipcMain.handle('vault:lock', async () => {
  const response = await axios.post(`${BACKEND_URL}/api/vault/lock`);
  return response.data;
});

// Note operations
ipcMain.handle('notes:getAll', async () => {
  const response = await axios.get(`${BACKEND_URL}/api/notes`);
  return response.data;
});

ipcMain.handle('notes:create', async (event, noteData) => {
  const response = await axios.post(`${BACKEND_URL}/api/notes`, noteData);
  return response.data;
});

ipcMain.handle('notes:get', async (event, noteId) => {
  const response = await axios.get(`${BACKEND_URL}/api/notes/${noteId}`);
  return response.data;
});

ipcMain.handle('notes:update', async (event, noteId, updates) => {
  const response = await axios.put(`${BACKEND_URL}/api/notes/${noteId}`, updates);
  return response.data;
});

ipcMain.handle('notes:delete', async (event, noteId) => {
  const response = await axios.delete(`${BACKEND_URL}/api/notes/${noteId}`);
  return response.data;
});

ipcMain.handle('notes:search', async (event, query) => {
  const response = await axios.post(`${BACKEND_URL}/api/search`, query);
  return response.data;
});

// AI operations
ipcMain.handle('ai:summarize', async (event, noteId, format) => {
  const response = await axios.post(`${BACKEND_URL}/api/ai/summarize`, { note_id: noteId, format });
  return response.data;
});

ipcMain.handle('ai:classify', async (event, noteId) => {
  const response = await axios.post(`${BACKEND_URL}/api/ai/classify`, { note_id: noteId });
  return response.data;
});

// File operations
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Notion Files', extensions: ['json', 'md'] }
    ]
  });
  return result.filePaths[0];
});

console.log('🟣 NoteVault Electron App Ready');
