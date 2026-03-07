const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0f0f0f',
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, '../assets/icon.ico'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webviewTag: true,
    },
  });

  const startURL = isDev
    ? 'http://localhost:8082'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startURL);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ═══ IPC: Controles de ventana ═══
ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('close-window', () => {
  mainWindow?.close();
});

ipcMain.handle('is-maximized', () => {
  return mainWindow?.isMaximized();
});

// ═══ IPC: Captura de pantalla ═══
ipcMain.handle('capture-page', async () => {
  if (!mainWindow) return null;
  const image = await mainWindow.webContents.capturePage();
  return image.toDataURL();
});

ipcMain.handle('capture-screen', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 },
  });
  if (sources.length > 0) {
    return sources[0].thumbnail.toDataURL();
  }
  return null;
});

// ═══ IPC: Guardar como PDF ═══
ipcMain.handle('print-to-pdf', async () => {
  if (!mainWindow) return null;
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'pagina.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return null;

  const data = await mainWindow.webContents.printToPDF({
    printBackground: true,
    landscape: false,
  });
  fs.writeFileSync(filePath, data);
  return filePath;
});

// ═══ IPC: Guardar página HTML ═══
ipcMain.handle('save-page-html', async () => {
  if (!mainWindow) return null;
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'pagina.html',
    filters: [{ name: 'HTML', extensions: ['html'] }],
  });
  if (canceled || !filePath) return null;

  const html = await mainWindow.webContents.executeJavaScript(
    'document.documentElement.outerHTML'
  );
  fs.writeFileSync(filePath, html, 'utf-8');
  return filePath;
});

// ═══ IPC: DevTools (con panel específico) ═══
ipcMain.handle('open-devtools', (event, panel) => {
  if (!mainWindow) return;
  mainWindow.webContents.openDevTools();
  if (panel) {
    // Esperar a que DevTools cargue y cambiar al panel solicitado
    const trySwitch = (attempts = 0) => {
      const devtools = mainWindow.webContents.devToolsWebContents;
      if (devtools) {
        devtools.executeJavaScript(`DevToolsAPI.showPanel("${panel}")`).catch(() => {});
      } else if (attempts < 10) {
        setTimeout(() => trySwitch(attempts + 1), 200);
      }
    };
    setTimeout(() => trySwitch(), 300);
  }
});

// ═══ IPC: Audio mute ═══
ipcMain.handle('toggle-mute', () => {
  if (!mainWindow) return false;
  const current = mainWindow.webContents.isAudioMuted();
  mainWindow.webContents.setAudioMuted(!current);
  return !current;
});

ipcMain.handle('is-muted', () => {
  return mainWindow?.webContents.isAudioMuted() ?? false;
});

// ═══ IPC: Page Source ═══
ipcMain.handle('get-page-source', async () => {
  if (!mainWindow) return null;
  const allWebContents = require('electron').webContents.getAllWebContents();
  const guest = allWebContents.find(wc => wc.getType() === 'webview');
  if (guest) {
    return await guest.executeJavaScript('document.documentElement.outerHTML');
  }
  return await mainWindow.webContents.executeJavaScript('document.documentElement.outerHTML');
});

// ═══ IPC: Vista responsiva (device emulation) ═══
let deviceEmulationActive = false;
ipcMain.handle('toggle-device-emulation', () => {
  if (!mainWindow) return false;
  deviceEmulationActive = !deviceEmulationActive;
  if (deviceEmulationActive) {
    mainWindow.webContents.enableDeviceEmulation({
      screenPosition: 'mobile',
      screenSize: { width: 375, height: 812 },
      viewSize: { width: 375, height: 812 },
      viewPosition: { x: 0, y: 0 },
      deviceScaleFactor: 3,
      scale: 1,
    });
  } else {
    mainWindow.webContents.disableDeviceEmulation();
  }
  return deviceEmulationActive;
});

ipcMain.handle('close-devtools', () => {
  if (!mainWindow) return;
  mainWindow.webContents.closeDevTools();
});