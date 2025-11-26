const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('shellAPI', {
  run: (command) => ipcRenderer.invoke('shell:run', command)
});

contextBridge.exposeInMainWorld('iaAPI', {
  suggest: (text, context) => ipcRenderer.invoke('ia:suggest', text, context)
});

contextBridge.exposeInMainWorld('aliasAPI', {
  resolve: (text) => ipcRenderer.invoke('alias:resolve', text),
  list: () => ipcRenderer.invoke('alias:list'),
  save: (alias) => ipcRenderer.invoke('alias:save', alias),
  delete: (natural) => ipcRenderer.invoke('alias:delete', natural)
});

contextBridge.exposeInMainWorld('historyAPI', {
  list: (filters) => ipcRenderer.invoke('history:list', filters)
});

contextBridge.exposeInMainWorld('memoryAPI', {
  getSession: () => ipcRenderer.invoke('memory:session'),
  getLongTerm: () => ipcRenderer.invoke('memory:longterm'),
  update: (data) => ipcRenderer.invoke('memory:update', data)
});

contextBridge.exposeInMainWorld('sessionAPI', {
  getSummary: () => ipcRenderer.invoke('session:summary')
});

console.log('EchoTerm MCP - Preload script loaded');
