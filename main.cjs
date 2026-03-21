'use strict';
const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { pipeline } = require('stream');
const { promisify } = require('util');

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

// ── Oyun İndirme Sistemi ─────────────────────────────────────────────────────

function getGamesDir() {
  return path.join(app.getPath('userData'), 'games');
}

function getGameDir(gameId) {
  return path.join(getGamesDir(), gameId);
}

function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, destPath, onProgress)
          .then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let received = 0;
      const out = fs.createWriteStream(destPath);
      res.on('data', (chunk) => {
        received += chunk.length;
        if (total > 0) onProgress(Math.round((received / total) * 100));
      });
      res.pipe(out);
      out.on('finish', () => { out.close(); resolve(); });
      out.on('error', reject);
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractZip(zipPath, destDir) {
  return new Promise((resolve, reject) => {
    // Use PowerShell to extract zip (no extra npm deps needed)
    const cmd = `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${destDir}' -Force"`;
    childProcess.exec(cmd, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

ipcMain.handle('download-game', async (event, gameId, url, fileName) => {
  try {
    const gameDir = getGameDir(gameId);
    if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

    const isZip = fileName.endsWith('.zip');
    const destPath = path.join(gameDir, fileName);

    event.sender.send('download-progress', { gameId, percent: 0, status: 'downloading' });

    await downloadFile(url, destPath, (percent) => {
      event.sender.send('download-progress', { gameId, percent, status: 'downloading' });
    });

    event.sender.send('download-progress', { gameId, percent: 100, status: 'extracting' });

    if (isZip) {
      await extractZip(destPath, gameDir);
      fs.unlinkSync(destPath); // Zip'i temizle
    }

    event.sender.send('download-progress', { gameId, percent: 100, status: 'done' });
    return { success: true };
  } catch (err) {
    event.sender.send('download-progress', { gameId, percent: 0, status: 'error', message: err.message });
    return { error: err.message };
  }
});

ipcMain.handle('get-game-path', async (_, gameId, exeName) => {
  const gameDir = getGameDir(gameId);
  if (!fs.existsSync(gameDir)) return { installed: false };

  // Belirtilen exe'yi ara, yoksa klasörü tara
  if (exeName) {
    const direct = path.join(gameDir, exeName);
    if (fs.existsSync(direct)) return { installed: true, exePath: direct };
    // Zip içinde subdirectory olabilir
    const entries = fs.readdirSync(gameDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sub = path.join(gameDir, entry.name, exeName);
        if (fs.existsSync(sub)) return { installed: true, exePath: sub };
      }
    }
  }

  // Herhangi bir .exe bul
  const findExe = (dir) => {
    if (!fs.existsSync(dir)) return null;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.exe')) return path.join(dir, entry.name);
      if (entry.isDirectory()) { const r = findExe(path.join(dir, entry.name)); if (r) return r; }
    }
    return null;
  };
  const found = findExe(gameDir);
  return found ? { installed: true, exePath: found } : { installed: false };
});

ipcMain.handle('delete-game', async (_, gameId) => {
  try {
    const gameDir = getGameDir(gameId);
    if (fs.existsSync(gameDir)) fs.rmSync(gameDir, { recursive: true, force: true });
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});
