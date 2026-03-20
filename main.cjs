'use strict';
const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');

const isDev = process.env.NODE_ENV === 'development';
let mainWindow = null;
let runningProcesses = [];

// Read server IP from server.txt (sits next to the exe/main.cjs)
function getServerUrl() {
  const txtPath = path.join(__dirname, 'server.txt');
  try {
    const ip = fs.readFileSync(txtPath, 'utf8').trim();
    if (ip) return `http://${ip}:5173`;
  } catch (_) {}
  return null;
}

// Check if server is reachable
function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false,
    },
    backgroundColor: '#0a0b14',
    show: false,
    title: 'GameHub',
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Try network server first, fall back to local files
  let loadUrl;
  if (!isDev) {
    const serverUrl = getServerUrl();
    if (serverUrl) {
      const online = await checkServer(serverUrl);
      if (online) {
        loadUrl = serverUrl;
        console.log('[GameHub] Loading from network server:', serverUrl);
      }
    }
    if (!loadUrl) {
      loadUrl = `file://${path.join(__dirname, 'dist', 'index.html')}`;
      console.log('[GameHub] Server offline, loading from local files');
    }
  } else {
    loadUrl = 'http://localhost:5173';
  }

  mainWindow.loadURL(loadUrl);
  mainWindow.on('closed', () => {
    runningProcesses.forEach(p => { try { p.kill(); } catch (_) {} });
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
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
    const proc = childProcess.spawn(exePath, [], { detached: true, stdio: 'ignore' });
    proc.unref();
    runningProcesses.push(proc);
    return { success: true };
  } catch (err) { return { error: err.message }; }
});

ipcMain.handle('pick-game-exe', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'Oyun .exe sec',
    filters: [{ name: 'Executable', extensions: ['exe'] }],
    properties: ['openFile'],
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('read-local-html', async (_, filePath) => {
  if (!fs.existsSync(filePath)) return { error: 'Bulunamadi' };
  try { return { content: fs.readFileSync(filePath, 'utf8') }; }
  catch (err) { return { error: err.message }; }
});

ipcMain.handle('pick-game-html', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    title: 'HTML Oyun sec',
    filters: [{ name: 'HTML', extensions: ['html', 'htm'] }],
    properties: ['openFile'],
  });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('open-external', async (_, url) => shell.openExternal(url));
