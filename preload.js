const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  saveUserData: (email, data) => ipcRenderer.invoke('save-user-data', email, data),
  loadUserData: (email) => ipcRenderer.invoke('load-user-data', email),
  clearUserSession: (email) => ipcRenderer.invoke('clear-user-session', email),
  
  // Auto-updater API
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
  removeUpdateStatusListener: () => ipcRenderer.removeAllListeners('update-status'),
  
  // Add more API methods as needed
}); 