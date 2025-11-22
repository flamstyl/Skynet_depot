/**
 * Main process - Skynet Control Panel
 * Gestion sécurisée de l'application Electron
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Services
import { DockerService } from './services/docker.js';
import { MCPService } from './services/mcp.js';
import { N8nService } from './services/n8n.js';
import { OracleService } from './services/oracle.js';

let mainWindow: BrowserWindow | null = null;

// Initialisation des services
const dockerService = new DockerService();
const mcpService = new MCPService();
const n8nService = new N8nService();
const oracleService = new OracleService();

/**
 * Création de la fenêtre principale
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Skynet Control Panel',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });

  // Charger l'app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Configuration des handlers IPC
 */
function setupIpcHandlers() {
  // Docker handlers
  ipcMain.handle('docker:listContainers', async () => {
    return await dockerService.listContainers();
  });

  ipcMain.handle('docker:startContainer', async (_, id: string) => {
    return await dockerService.startContainer(id);
  });

  ipcMain.handle('docker:stopContainer', async (_, id: string) => {
    return await dockerService.stopContainer(id);
  });

  ipcMain.handle('docker:containerStats', async (_, id: string) => {
    return await dockerService.getStats(id);
  });

  ipcMain.handle('docker:containerLogs', async (_, id: string) => {
    return await dockerService.getLogs(id);
  });

  // MCP handlers
  ipcMain.handle('mcp:listServers', async () => {
    return await mcpService.listServers();
  });

  ipcMain.handle('mcp:getServerStatus', async (_, name: string) => {
    return await mcpService.getServerStatus(name);
  });

  // n8n handlers
  ipcMain.handle('n8n:listWorkflows', async () => {
    return await n8nService.listWorkflows();
  });

  ipcMain.handle('n8n:executeWorkflow', async (_, id: string) => {
    return await n8nService.executeWorkflow(id);
  });

  // Oracle Cloud handlers
  ipcMain.handle('oracle:listInstances', async () => {
    return await oracleService.listInstances();
  });

  ipcMain.handle('oracle:startInstance', async (_, id: string) => {
    return await oracleService.startInstance(id);
  });

  ipcMain.handle('oracle:stopInstance', async (_, id: string) => {
    return await oracleService.stopInstance(id);
  });

  // System info
  ipcMain.handle('system:getInfo', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      appVersion: app.getVersion()
    };
  });
}

/**
 * Lifecycle Electron
 */
app.whenReady().then(() => {
  setupIpcHandlers();
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
