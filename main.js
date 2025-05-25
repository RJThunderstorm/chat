const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false, // Remove window frame
    transparent: true, // Make window transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Recommended for security
      enableRemoteModule: false // Recommended for security
    }
  });

  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handler for opening the file dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'PDFs', extensions: ['pdf'] }
    ]
  });
  return result.filePaths; // Send back array of file paths
});

// Listener to open a new window for PDF viewing
ipcMain.on('open-pdf-window', (event, filePath) => {
  createPdfViewWindow(filePath);
});

function createPdfViewWindow(filePath) {
  const pdfWin = new BrowserWindow({
    width: 1024, // Wider for better PDF viewing
    height: 768, // Taller for better PDF viewing
    webPreferences: {
      // No preload script needed for simple iframe viewing unless we add custom controls.
      // contextIsolation is true by default if no preload script is specified.
      // nodeIntegration is false by default.
      // webSecurity is true by default, which is good.
      // We ensure contextIsolation is explicitly true for clarity, though defaults might cover it.
      contextIsolation: true, 
      nodeIntegration: false,
    }
  });

  // Load pdf-viewer.html and pass the file path as a query parameter.
  // The path needs to be URI encoded to handle special characters in file names/paths.
  pdfWin.loadFile('pdf-viewer.html', { query: { filePath: encodeURIComponent(filePath) } });

  // Optional: Remove menu bar for a cleaner look, though users might want it.
  // pdfWin.setMenuBarVisibility(false);

  // For debugging the PDF window itself
  // pdfWin.webContents.openDevTools();
}
