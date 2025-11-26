const { contextBridge, ipcRenderer } = require('electron');

/**
 * MCP Forge Preload Script
 * Exposes safe APIs to the renderer process
 */

contextBridge.exposeInMainWorld('mcpForge', {
  // Canvas operations
  openCanvas: (agentData) => ipcRenderer.invoke('open-canvas', agentData),

  // File operations
  saveAgent: (agentData) => ipcRenderer.invoke('save-agent', agentData),
  loadAgent: () => ipcRenderer.invoke('load-agent'),
  exportAgent: (format, agentData) => ipcRenderer.invoke('export-agent', { format, agentData }),

  // AI operations
  validateAgentAI: (agentData) => ipcRenderer.invoke('validate-agent-ai', agentData),
  dryRunAgent: (agentData, testInput) => ipcRenderer.invoke('dry-run-agent', { agentData, testInput }),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),

  // Event listeners
  onLoadAgent: (callback) => ipcRenderer.on('load-agent', (event, data) => callback(data)),
  onAgentUpdated: (callback) => ipcRenderer.on('agent-updated', (event, data) => callback(data))
});

console.log('🔌 MCP Forge Preload - API Bridge Ready');
