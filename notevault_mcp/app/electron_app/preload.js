/**
 * NoteVault — Electron Preload
 * Secure bridge between renderer and main process
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Vault
  unlockVault: (password) => ipcRenderer.invoke('vault:unlock', password),
  lockVault: () => ipcRenderer.invoke('vault:lock'),

  // Notes
  getAllNotes: () => ipcRenderer.invoke('notes:getAll'),
  createNote: (noteData) => ipcRenderer.invoke('notes:create', noteData),
  getNote: (noteId) => ipcRenderer.invoke('notes:get', noteId),
  updateNote: (noteId, updates) => ipcRenderer.invoke('notes:update', noteId, updates),
  deleteNote: (noteId) => ipcRenderer.invoke('notes:delete', noteId),
  searchNotes: (query) => ipcRenderer.invoke('notes:search', query),

  // AI
  aiSummarize: (noteId, format) => ipcRenderer.invoke('ai:summarize', noteId, format),
  aiClassify: (noteId) => ipcRenderer.invoke('ai:classify', noteId),

  // File dialogs
  openFile: () => ipcRenderer.invoke('dialog:openFile')
});
