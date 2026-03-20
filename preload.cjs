'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchGameExe: (p) => ipcRenderer.invoke('launch-game-exe', p),
  pickGameExe: () => ipcRenderer.invoke('pick-game-exe'),
  pickGameHtml: () => ipcRenderer.invoke('pick-game-html'),
  readLocalHtml: (p) => ipcRenderer.invoke('read-local-html', p),
  openExternal: (u) => ipcRenderer.invoke('open-external', u),
  isElectron: true,
});
