const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, shell } = electron;
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';
const ROOT = path.join(__dirname, '..');   // gamehub/
let mainWindow;
let runningProcesses = [];

function createWindow() {
  const iconPath = path.join(ROOT, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
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
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

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

// ── IPC: Launch a Godot .exe game ──────────────────────────
ipcMain.handle('launch-game-exe', async (_, exePath) => {
  if (!fs.existsSync(exePath)) {
    return { error: 'Dosya bulunamadi: ' + exePath };
  }
  try {
    const proc = spawn(exePath, [], { detached: true, stdio: 'ignore' });
    proc.unref();
    runningProcesses.push(proc);
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// ── IPC: Open file picker to choose game exe ─────────────
ipcMain.handle('pick-game-exe', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Oyun .exe dosyasini sec',
    filters: [{ name: 'Calistirilabiilir Dosya', extensions: ['exe'] }],
    properties: ['openFile'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// ── IPC: Read local HTML game file ────────────────────────
ipcMain.handle('read-local-html', async (_, filePath) => {
  if (!fs.existsSync(filePath)) return { error: 'Dosya bulunamadi' };
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { content };
  } catch (err) {
    return { error: err.message };
  }
});

// ── IPC: Open file browser for HTML ────────────────────────
ipcMain.handle('pick-game-html', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Oyun HTML dosyasini sec',
    filters: [{ name: 'HTML Oyun', extensions: ['html', 'htm'] }],
    properties: ['openFile'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// ── IPC: Open URL in external browser ────────────────────
ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});
