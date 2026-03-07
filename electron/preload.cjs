const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,

  // Controles de ventana
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  isMaximized: () => ipcRenderer.invoke('is-maximized'),

  // Captura de pantalla
  capturePage: () => ipcRenderer.invoke('capture-page'),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),

  // PDF
  printToPdf: () => ipcRenderer.invoke('print-to-pdf'),

  // Guardar HTML
  savePageHtml: () => ipcRenderer.invoke('save-page-html'),

  // DevTools
  openDevTools: (panel) => ipcRenderer.invoke('open-devtools', panel),
  closeDevTools: () => ipcRenderer.invoke('close-devtools'),

  // Vista responsiva
  toggleDeviceEmulation: () => ipcRenderer.invoke('toggle-device-emulation'),

  // Audio
  toggleMute: () => ipcRenderer.invoke('toggle-mute'),
  isMuted: () => ipcRenderer.invoke('is-muted'),

  // HTML
  getPageSource: () => ipcRenderer.invoke('get-page-source'),
});