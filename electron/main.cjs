const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
const ROOT = path.resolve(__dirname, '..');
let mainWindow = null;
let runningProcesses = [];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0b14',
      symbolColor: '#a78bfa',
      height: 36,
    },
    backgroundColor: '#0a0b14',
    show: false,
    frame: true,
  });

  mainWindow.once('ready-to-show', () => { mainWindow.show(); });

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(ROOT, 'dist', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    runningProcesses.forEach(p => { try { p.kill(); } catch (_) {} });
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('launch-game-exe', async (_, exePath) => {
  if (!fs.existsSync(exePath)) return { error: 'Dosya bulunamadi: ' + exePath };
  try {
    const proc = spawn(exePath, [], { detached: true, stdio: 'ignore' });
    proc.unref();
    runningProcesses.push(proc);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('pick-game-exe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Oyun .exe dosyasini sec',
    filters: [{ name: 'Executable', extensions: ['exe'] }],
    properties: ['openFile'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('read-local-html', async (_, filePath) => {
  if (!fs.existsSync(filePath)) return { error: 'Bulunamadi' };
  try { return { content: fs.readFileSync(filePath, 'utf8') }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('pick-game-html', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'HTML Oyun sec',
    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
    properties: ['openFile'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});
