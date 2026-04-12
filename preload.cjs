const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (offset) => ipcRenderer.send('window-move', offset),
  resizeWindow: (delta) => ipcRenderer.send('window-resize', delta),
  getDecryptedModel: () => ipcRenderer.invoke('get-decrypted-model')
});
