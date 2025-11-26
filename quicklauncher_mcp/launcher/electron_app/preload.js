const { contextBridge, ipcRenderer } = require('electron');

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Search
    search: (query) => ipcRenderer.invoke('search', query),

    // AI Prompt
    aiPrompt: (prompt) => ipcRenderer.invoke('ai-prompt', prompt),

    // Execute action
    executeAction: (action) => ipcRenderer.invoke('execute-action', action),

    // Load plugins
    loadPlugins: () => ipcRenderer.invoke('load-plugins'),

    // Rebuild index
    rebuildIndex: () => ipcRenderer.invoke('rebuild-index'),

    // Window controls
    hideWindow: () => ipcRenderer.send('hide-window'),
    showWindow: () => ipcRenderer.send('show-window'),

    // Listen for window events
    onWindowHidden: (callback) => {
        ipcRenderer.on('window-hidden', callback);
    }
});

console.log('QuickLauncher preload script loaded');
