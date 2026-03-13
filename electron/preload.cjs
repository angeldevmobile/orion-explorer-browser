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
  getPageSource: (url) => ipcRenderer.invoke('get-page-source', url),
  getPageMedia: (url) => ipcRenderer.invoke('get-page-media', url),
  getCurrentUrl: (url) => ipcRenderer.invoke('get-current-url', url),

  // Privacidad
  updatePrivacyPrefs: (prefs) => ipcRenderer.invoke('update-privacy-prefs', prefs),
  getPrivacyStats: () => ipcRenderer.invoke('get-privacy-stats'),
  getPagePrivacyStats: (hostname) => ipcRenderer.invoke('get-page-privacy-stats', hostname),
  resetPagePrivacyStats: (hostname) => ipcRenderer.invoke('reset-page-privacy-stats', hostname),
  clearBrowsingData: (options) => ipcRenderer.invoke('clear-browsing-data', options),

  // Sugerencias de búsqueda
  fetchSuggestions: (query, engine) => ipcRenderer.invoke('fetch-suggestions', query, engine),

  // Eventos de privacidad en tiempo real
  onPrivacyBlocked: (callback) => {
    ipcRenderer.on('privacy-blocked', (event, data) => callback(data));
  },
  removePrivacyBlockedListener: () => {
    ipcRenderer.removeAllListeners('privacy-blocked');
  },

  // Nueva pestaña desde webview (target="_blank", window.open en Electron 12+)
  onOpenNewTab: (callback) => {
    ipcRenderer.on('open-new-tab', (event, url) => callback(url));
  },
  removeOpenNewTabListener: () => {
    ipcRenderer.removeAllListeners('open-new-tab');
  },
});