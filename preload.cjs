const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  moveWindow: (offset) => ipcRenderer.send('window-move', offset),
  resizeWindow: (delta) => ipcRenderer.send('window-resize', delta),
  getDecryptedModel: () => ipcRenderer.invoke('get-decrypted-model'),
  openDashboard: () => ipcRenderer.send('open-dashboard'),
  onClipboardAlert: (callback) => ipcRenderer.on('clipboard-alert', (_event, data) => callback(data))
});
