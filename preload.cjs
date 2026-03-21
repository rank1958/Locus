'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchGameExe: (p) => ipcRenderer.invoke('launch-game-exe', p),
  pickGameExe: () => ipcRenderer.invoke('pick-game-exe'),
  pickGameHtml: () => ipcRenderer.invoke('pick-game-html'),
  readLocalHtml: (p) => ipcRenderer.invoke('read-local-html', p),
  openExternal: (u) => ipcRenderer.invoke('open-external', u),
  isElectron: true,

  // ── Oyun İndirme Sistemi ──────────────────────────────────
  downloadGame: (gameId, url, fileName) =>
    ipcRenderer.invoke('download-game', gameId, url, fileName),
  getGamePath: (gameId, exeName) =>
    ipcRenderer.invoke('get-game-path', gameId, exeName),
  deleteGame: (gameId) =>
    ipcRenderer.invoke('delete-game', gameId),
  onDownloadProgress: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
});
