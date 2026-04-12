const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (offset) => ipcRenderer.send('window-move', offset),
  getDecryptedModel: () => ipcRenderer.invoke('get-decrypted-model')
});
