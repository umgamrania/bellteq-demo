const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// safe electron APIs without exposing full node or electron internals.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});

