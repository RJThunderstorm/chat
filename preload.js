const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  openPdfWindow: (filePath) => ipcRenderer.send('open-pdf-window', filePath)
});
