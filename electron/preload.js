const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchGameExe: (exePath) => ipcRenderer.invoke('launch-game-exe', exePath),
  pickGameExe: () => ipcRenderer.invoke('pick-game-exe'),
  pickGameHtml: () => ipcRenderer.invoke('pick-game-html'),
  readLocalHtml: (filePath) => ipcRenderer.invoke('read-local-html', filePath),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  isElectron: true,
});
