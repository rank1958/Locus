const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  launchGameExe: function(p) { return ipcRenderer.invoke('launch-game-exe', p); },
  pickGameExe: function() { return ipcRenderer.invoke('pick-game-exe'); },
  pickGameHtml: function() { return ipcRenderer.invoke('pick-game-html'); },
  readLocalHtml: function(p) { return ipcRenderer.invoke('read-local-html', p); },
  openExternal: function(u) { return ipcRenderer.invoke('open-external', u); },
  isElectron: true,
});
