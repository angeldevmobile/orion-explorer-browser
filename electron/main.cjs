const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, session, webContents } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');

// ═══ Flags de Chromium: reducir consumo de RAM/CPU del proceso ═══
app.commandLine.appendSwitch('disable-background-networking');         // No tráfico de fondo
app.commandLine.appendSwitch('disable-default-apps');                  // Sin apps internas de Chrome
app.commandLine.appendSwitch('disable-extensions');                    // Sin extensiones Chromium
app.commandLine.appendSwitch('disable-sync');                          // Sin sincronización
app.commandLine.appendSwitch('disable-translate');                     // Sin traductor integrado
app.commandLine.appendSwitch('no-first-run');                          // Evitar tareas de primer arranque
app.commandLine.appendSwitch('disable-client-side-phishing-detection');// Ahorra CPU de fondo
app.commandLine.appendSwitch('disable-hang-monitor');                  // Sin monitor de cuelgues
app.commandLine.appendSwitch('disable-prompt-on-repost');
app.commandLine.appendSwitch('disable-domain-reliability');            // Sin reporte de dominios a Google
app.commandLine.appendSwitch('no-pings');                              // Sin pings de hipervínculo
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256 --expose-gc'); // Límite heap + GC manual
app.commandLine.appendSwitch('renderer-process-limit', '4');          // Máx. 4 procesos renderer en RAM
app.commandLine.appendSwitch('enable-precise-memory-info');           // V8 reporta uso real de memoria
app.commandLine.appendSwitch('aggressive-cache-discard');             // Libera caché de GPU más agresivamente

let mainWindow;

// ═══════════════════════════════════════════
// ═══ PRIVACIDAD: Estado y configuración ═══
// ═══════════════════════════════════════════

let privacyPrefs = {
  blockTrackers: true,
  blockThirdPartyCookies: true,
  antiFingerprint: true,
  forceHttps: true,
  blockMining: true,
};

// Stats GLOBALES de la sesión
let privacyStats = {
  trackersBlocked: 0,
  cookiesBlocked: 0,
  dataSavedBytes: 0,
};

// Stats POR PÁGINA (clave = hostname)
const pagePrivacyStats = new Map();

const PAGE_STATS_LIMIT = 100;
function getPageStatsFor(hostname) {
  if (!pagePrivacyStats.has(hostname)) {
    // Evitar crecimiento ilimitado: eliminar la entrada más antigua si se supera el límite
    if (pagePrivacyStats.size >= PAGE_STATS_LIMIT) {
      pagePrivacyStats.delete(pagePrivacyStats.keys().next().value);
    }
    pagePrivacyStats.set(hostname, { trackersBlocked: 0, cookiesBlocked: 0, dataSavedBytes: 0 });
  }
  return pagePrivacyStats.get(hostname);
}

function getPageHostname(wcId) {
  try {
    const wc = webContents.fromId(wcId);
    if (wc) {
      const u = new URL(wc.getURL());
      return u.hostname;
    }
  } catch {}
  return null;
}

// ═══ Listas de dominios (Disconnect.me core + extras) ═══

const TRACKER_DOMAINS = new Set([
  // ── Google ──
  'google-analytics.com', 'googletagmanager.com', 'analytics.google.com',
  'doubleclick.net', 'adservice.google.com', 'googlesyndication.com',
  'googleadservices.com', 'pagead2.googlesyndication.com', 'google-analytics.l.google.com',
  // ── Facebook / Meta ──
  'facebook.net', 'connect.facebook.net', 'pixel.facebook.com',
  'an.facebook.com', 'ads.facebook.com',
  // ── Twitter / X ──
  'analytics.twitter.com', 'ads-twitter.com', 't.co', 'platform.twitter.com',
  'syndication.twitter.com', 'ads-api.twitter.com',
  // ── Microsoft ──
  // 'c.bing.com' y 'c.msn.com' eliminados: son APIs internas que Bing necesita
  // para procesar clics en resultados de búsqueda.
  'bat.bing.com', 'clarity.ms',
  // ── Analytics ──
  'hotjar.com', 'static.hotjar.com', 'vars.hotjar.com',
  'mixpanel.com', 'api.mixpanel.com', 'cdn.mxpnl.com',
  'segment.io', 'api.segment.io', 'cdn.segment.com',
  'amplitude.com', 'api.amplitude.com', 'cdn.amplitude.com',
  'heap.io', 'heapanalytics.com', 'cdn.heapanalytics.com',
  'fullstory.com', 'rs.fullstory.com',
  'mouseflow.com', 'cdn.mouseflow.com',
  'crazyegg.com', 'script.crazyegg.com',
  'luckyorange.com', 'cdn.luckyorange.com',
  'inspectlet.com', 'cdn.inspectlet.com',
  'logrocket.com', 'cdn.logrocket.io',
  'pendo.io', 'cdn.pendo.io',
  'kissmetrics.com', 'kissmetrics.io',
  'chartbeat.com', 'static.chartbeat.com',
  'newrelic.com', 'nr-data.net', 'bam.nr-data.net', 'js-agent.newrelic.com',
  'sentry.io', 'browser.sentry-cdn.com',
  'bugsnag.com', 'sessions.bugsnag.com',
  'rollbar.com', 'cdn.rollbar.com',
  // ── Advertising ──
  'adnxs.com', 'adsrvr.org', 'criteo.com', 'criteo.net',
  'taboola.com', 'cdn.taboola.com',
  'outbrain.com', 'widgets.outbrain.com',
  'scorecardresearch.com', 'quantserve.com', 'bluekai.com',
  'demdex.net', 'krxd.net', 'exelator.com',
  'adform.net', 'pubmatic.com', 'openx.net',
  'rubiconproject.com', 'fastclick.net',
  'smartadserver.com', 'sascdn.com',
  'moatads.com', 'moatpixel.com', 'z.moatads.com',
  'casalemedia.com', 'indexexchange.com',
  'bidswitch.net', '33across.com', 'tynt.com',
  'contextweb.com', 'sovrn.com',
  'media.net', 'mediamath.com',
  'turn.com', 'mathtag.com',
  'liveintent.com', 'lijit.com',
  'yieldmo.com', 'sharethrough.com',
  'spotxchange.com', 'spotx.tv',
  'conversantmedia.com', 'dotomi.com',
  'teads.tv', 'ttdns.com',
  'amazon-adsystem.com', 's.amazon-adsystem.com',
  'advertising.com', 'atwola.com',
  'yimg.com',
  // ── Social widgets/tracking ──
  'snap.licdn.com', 'widgets.pinterest.com', 'assets.pinterest.com',
  'static.ads-twitter.com',
  'sc-static.net', 'tr.snapchat.com',
  // ── Fingerprinting ──
  'fpjs.io', 'fingerprintjs.com', 'cdn.fpjs.io',
  'iovation.com', 'threatmetrix.com',
  // ── Data brokers ──
  'acxiom.com', 'liveramp.com', 'rlcdn.com',
  'agkn.com', 'bkrtx.com',
  // ── Tracking pixels misc ──
  'omtrdc.net', 'everesttech.net', 'rfihub.com',
  'adsymptotic.com', 'serving-sys.com',
  'eyeota.net', 'narrative.io',
  'branch.io', 'app.link', 'bnc.lt',
  'appsflyer.com', 'onelink.me',
  'adjust.com', 'app.adjust.com',
  'kochava.com', 'singular.net',
]);

const MINING_DOMAINS = new Set([
  'coinhive.com', 'coin-hive.com', 'authedmine.com',
  'cryptoloot.pro', 'crypto-loot.com',
  'minero.cc', 'jsecoin.com', 'coinimp.com',
  'ppoi.org', 'cryptonight.wasm',
  'webminepool.com', 'minr.pw',
  'coinerra.com', 'coin-have.com', 'hashforcash.us',
  'monerominer.rocks', 'webmine.cz',
]);

// Set lookup: O(1) para match exacto, luego comprueba subdominios solo si no hay match directo
function isDomainMatch(hostname, domainSet) {
  if (domainSet.has(hostname)) return true;
  const parts = hostname.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    if (domainSet.has(parts.slice(i).join('.'))) return true;
  }
  return false;
}

function estimateRequestSize(url) {
  if (url.includes('.js')) return 45000;
  if (url.includes('.gif') || url.includes('.png') || url.includes('.jpg')) return 5000;
  if (url.includes('.css')) return 15000;
  return 12000;
}

// ═══ Anti-fingerprint script (se inyecta en cada página) ═══
const ANTI_FINGERPRINT_SCRIPT = `
(function() {
  // Canvas fingerprint protection: añade ruido imperceptible
  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(type) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] ^= 1;     // R: flip bit menos significativo
        imageData.data[i+1] ^= 1;   // G
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return origToDataURL.apply(this, arguments);
  };

  const origToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
    const ctx = this.getContext('2d');
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, this.width, this.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] ^= 1;
        imageData.data[i+1] ^= 1;
      }
      ctx.putImageData(imageData, 0, 0);
    }
    return origToBlob.apply(this, arguments);
  };

  // WebGL fingerprint protection
  const getParamOrig = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(param) {
    // UNMASKED_VENDOR_WEBGL / UNMASKED_RENDERER_WEBGL
    if (param === 0x9245 || param === 0x9246) {
      return 'Generic GPU';
    }
    return getParamOrig.apply(this, arguments);
  };

  // AudioContext fingerprint protection
  const origCreateOscillator = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function() {
    const osc = origCreateOscillator.apply(this, arguments);
    const origConnect = osc.connect.bind(osc);
    osc.connect = function(dest) {
      if (dest instanceof AnalyserNode) {
        // Silenciosamente retorna sin conectar a analysers usados para fingerprint
        return osc;
      }
      return origConnect(dest);
    };
    return osc;
  };

  // Navigator properties normalization
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });

  // Plugins list normalization
  Object.defineProperty(navigator, 'plugins', { get: () => [] });
})();
`;

// ═══════════════════════════════════════════
// ═══ Crear ventana
// ═══════════════════════════════════════════

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
      backgroundThrottling: true,   // Frena JS de tabs en segundo plano → menos CPU
      spellcheck: false,            // Sin corrector ortográfico → menos RAM/CPU de fondo
    },
  });

  const startURL = isDev
    ? 'http://localhost:8082'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startURL);

  // ── Forzar allowpopups en todos los webviews ANTES de que se adjunten ──
  // setAttribute después del montaje no funciona; will-attach-webview es el momento correcto.
  mainWindow.webContents.on('will-attach-webview', (_event, _webPreferences, params) => {
    params.allowpopups = true;
    console.log('[Main] will-attach-webview: allowpopups forzado para', params.src);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Liberar memoria del sistema cuando la ventana se minimiza
  mainWindow.on('minimize', () => {
    if (global.gc) global.gc();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ═══════════════════════════════════════════
// ═══ App Ready (UNA SOLA VEZ)
// ═══════════════════════════════════════════

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // ═══ Privacidad: interceptores de red ═══
  const ses = session.defaultSession;

  ses.webRequest.onBeforeRequest((details, callback) => {
    try {
      const url = new URL(details.url);
      const pageHost = getPageHostname(details.webContentsId);

      // Bloquear trackers
      if (privacyPrefs.blockTrackers && isDomainMatch(url.hostname, TRACKER_DOMAINS)) {
        const size = estimateRequestSize(details.url);
        privacyStats.trackersBlocked++;
        privacyStats.dataSavedBytes += size;
        if (pageHost) {
          const ps = getPageStatsFor(pageHost);
          ps.trackersBlocked++;
          ps.dataSavedBytes += size;
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('privacy-blocked', {
            type: 'tracker',
            hostname: url.hostname,
            pageHost,
            pageStats: pageHost ? getPageStatsFor(pageHost) : null,
          });
        }
        // Usar redirectURL en vez de cancel:true para que fetch/XHR no lance excepción
        // y no rompa el JS de la página (ej: Bing espera respuesta antes de navegar).
        const emptyResponse = details.resourceType === 'image'
          ? 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
          : 'data:text/plain,';
        callback({ redirectURL: emptyResponse });
        return;
      }

      // Bloquear minería
      if (privacyPrefs.blockMining && isDomainMatch(url.hostname, MINING_DOMAINS)) {
        const size = estimateRequestSize(details.url);
        privacyStats.trackersBlocked++;
        privacyStats.dataSavedBytes += size;
        if (pageHost) {
          const ps = getPageStatsFor(pageHost);
          ps.trackersBlocked++;
          ps.dataSavedBytes += size;
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('privacy-blocked', {
            type: 'mining',
            hostname: url.hostname,
            pageHost,
            pageStats: pageHost ? getPageStatsFor(pageHost) : null,
          });
        }
        callback({ redirectURL: 'data:text/plain,' });
        return;
      }

      // Forzar HTTPS
      if (privacyPrefs.forceHttps && url.protocol === 'http:' && url.hostname !== 'localhost') {
        callback({ redirectURL: details.url.replace('http:', 'https:') });
        return;
      }
    } catch { /* URL inválida */ }

    callback({});
  });

  // Bloquear cookies de terceros
  ses.webRequest.onHeadersReceived((details, callback) => {
    if (!privacyPrefs.blockThirdPartyCookies) {
      callback({});
      return;
    }
    try {
      const responseHeaders = { ...details.responseHeaders };
      const requestUrl = new URL(details.url);
      // Use the webview's own URL (not the app shell) as the "first-party" context
      let firstPartyHostname = null;
      try {
        const wc = webContents.fromId(details.webContentsId);
        if (wc) firstPartyHostname = new URL(wc.getURL()).hostname;
      } catch {}
      if (!firstPartyHostname && mainWindow) {
        try { firstPartyHostname = new URL(mainWindow.webContents.getURL()).hostname; } catch {}
      }

      if (firstPartyHostname && requestUrl.hostname !== firstPartyHostname &&
          !requestUrl.hostname.endsWith('.' + firstPartyHostname) &&
          !firstPartyHostname.endsWith('.' + requestUrl.hostname)) {
        const hasCookies = responseHeaders['set-cookie'] || responseHeaders['Set-Cookie'];
        if (hasCookies) {
          delete responseHeaders['set-cookie'];
          delete responseHeaders['Set-Cookie'];
          privacyStats.cookiesBlocked++;
          const pageHost = getPageHostname(details.webContentsId);
          if (pageHost) {
            getPageStatsFor(pageHost).cookiesBlocked++;
          }
        }
      }
      callback({ responseHeaders });
    } catch {
      callback({});
    }
  });

  // Anti-fingerprinting: limpiar headers
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    if (!privacyPrefs.antiFingerprint) {
      callback({});
      return;
    }
    const headers = { ...details.requestHeaders };
    delete headers['X-Client-Data'];
    // Normalizar Accept-Language para reducir fingerprint
    headers['Accept-Language'] = 'en-US,en;q=0.9';
    callback({ requestHeaders: headers });
  });

  // Inyectar anti-fingerprint script en webviews
  ses.webRequest.onCompleted((details) => {
    if (!privacyPrefs.antiFingerprint) return;
    if (details.resourceType === 'mainFrame' || details.resourceType === 'subFrame') {
      try {
        const wc = webContents.fromId(details.webContentsId);
        if (wc && wc.getType() === 'webview') {
          wc.executeJavaScript(ANTI_FINGERPRINT_SCRIPT).catch(() => {});
        }
      } catch {}
    }
  });
});

// ── Interceptar nuevas ventanas de webviews (target="_blank", window.open) ──
// En Electron 12+, new-window está deprecado; se usa setWindowOpenHandler.
app.on('web-contents-created', (_event, contents) => {
  console.log('[Main] web-contents-created type:', contents.getType());
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url, frameName, features }) => {
      console.log('[Main] setWindowOpenHandler →', url, '| frame:', frameName, '| features:', features);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('open-new-tab', url);
      }
      return { action: 'deny' };
    });

    contents.on('will-navigate', (_e, url) => {
      console.log('[Main] webview will-navigate →', url);
    });

    contents.on('did-navigate', (_e, url) => {
      console.log('[Main] webview did-navigate →', url);
    });
  }
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

ipcMain.handle('close-devtools', () => {
  if (!mainWindow) return;
  mainWindow.webContents.closeDevTools();
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
ipcMain.handle('get-page-source', async (event, targetUrl) => {
  if (!mainWindow) return null;
  const guest = findWebView(targetUrl);
  if (guest) {
    return await guest.executeJavaScript('document.documentElement.outerHTML');
  }
  return await mainWindow.webContents.executeJavaScript('document.documentElement.outerHTML');
});

// ═══ IPC: Vista responsiva ═══
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

// ═══ IPC: Privacidad ═══
ipcMain.handle('update-privacy-prefs', (event, prefs) => {
  privacyPrefs = { ...privacyPrefs, ...prefs };
  return privacyPrefs;
});

ipcMain.handle('get-privacy-stats', () => {
  return privacyStats;
});

// NUEVO: Stats por página específica
ipcMain.handle('get-page-privacy-stats', (event, hostname) => {
  return pagePrivacyStats.get(hostname) || { trackersBlocked: 0, cookiesBlocked: 0, dataSavedBytes: 0 };
});

ipcMain.handle('reset-page-privacy-stats', (event, hostname) => {
  pagePrivacyStats.delete(hostname);
  return true;
});

ipcMain.handle('clear-browsing-data', async (event, options) => {
  if (!mainWindow) return false;
  const ses = session.defaultSession;

  try {
    if (options.cache) {
      await ses.clearCache();
    }
    if (options.cookies) {
      await ses.clearStorageData({ storages: ['cookies'] });
    }
    if (options.localStorage) {
      await ses.clearStorageData({ storages: ['localstorage'] });
    }
    if (options.sessionStorage) {
      await ses.clearStorageData({ storages: ['sessionstorage'] });
    }
    if (options.indexedDB) {
      await ses.clearStorageData({ storages: ['indexdb'] });
    }

    // Resetear todos los contadores
    privacyStats = { trackersBlocked: 0, cookiesBlocked: 0, dataSavedBytes: 0 };
    pagePrivacyStats.clear();

    return true;
  } catch (err) {
    console.error('Error clearing data:', err);
    return false;
  }
});

// ═══ IPC: Media Gallery - Escanear medios de la página ═══
ipcMain.handle('get-page-media', async (event, targetUrl) => {
  if (!mainWindow) return [];
  const target = findWebView(targetUrl) || mainWindow.webContents;
  
  try {
    return await target.executeJavaScript(`
      (() => {
        const seen = new Set();
        const media = [];
        document.querySelectorAll('img[src]').forEach(img => {
          const src = img.src;
          if (!seen.has(src) && img.naturalWidth > 80 && img.naturalHeight > 80) {
            seen.add(src);
            media.push({ type: 'image', src, alt: img.alt || '', width: img.naturalWidth, height: img.naturalHeight });
          }
        });
        document.querySelectorAll('video').forEach(v => {
          const src = v.src || v.querySelector('source')?.src;
          if (src && !seen.has(src)) {
            seen.add(src);
            media.push({ type: 'video', src, poster: v.poster || '', duration: v.duration || 0 });
          }
        });
        document.querySelectorAll('audio').forEach(a => {
          const src = a.src || a.querySelector('source')?.src;
          if (src && !seen.has(src)) {
            seen.add(src);
            media.push({ type: 'audio', src, duration: a.duration || 0 });
          }
        });
        document.querySelectorAll('[style*="background-image"]').forEach(el => {
          const match = el.style.backgroundImage.match(/url\\(["']?([^"')]+)["']?\\)/);
          if (match && match[1] && !seen.has(match[1])) {
            seen.add(match[1]);
            media.push({ type: 'image', src: match[1], alt: 'bg', width: 0, height: 0 });
          }
        });
        return media;
      })()
    `);
  } catch {
    return [];
  }
});

// ═══ IPC: Descargar un archivo de media ═══
ipcMain.handle('download-media', async (event, { url, filename }) => {
  if (!mainWindow) return { success: false };
  try {
    if (url.startsWith('blob:')) {
      const allWC = webContents.getAllWebContents();
      const guest = allWC.find(wc => wc.getType() === 'webview');
      const target = guest || mainWindow.webContents;

      let dataUrl;
      try {
        // JSON.stringify evita inyección al embeber la URL en el script
        dataUrl = await target.executeJavaScript(`
          new Promise((resolve, reject) => {
            fetch(${JSON.stringify(url)})
              .then(r => r.blob())
              .then(blob => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('FileReader error'));
                reader.readAsDataURL(blob);
              })
              .catch(reject);
          })
        `);
      } catch {
        return { success: false };
      }

      const [header, base64data] = dataUrl.split(',');
      const extMatch = header.match(/\/([a-z0-9]+);/i);
      const ext = extMatch ? extMatch[1] : 'bin';
      const defaultName = (filename || ('media_' + Date.now())) + '.' + ext;

      const { canceled, filePath: savePath } = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [{ name: 'Todos los archivos', extensions: ['*'] }],
      });
      if (canceled || !savePath) return { success: false };

      const buffer = Buffer.from(base64data, 'base64');
      fs.writeFileSync(savePath, buffer);
      return { success: true, path: savePath, size: buffer.length };
    }

    // ── URLs normales http/https ──
    const ext = path.extname(new URL(url).pathname) || '.jpg';
    const defaultName = filename || ('media_' + Date.now() + ext);

    const { canceled, filePath: savePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [
        { name: 'Todos los archivos', extensions: ['*'] },
        { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] },
        { name: 'Videos', extensions: ['mp4', 'webm', 'ogg', 'avi'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'aac'] },
      ],
    });
    if (canceled || !savePath) return { success: false };

    const { net } = require('electron');
    const request = net.request(url);

    return new Promise((resolve) => {
      request.on('response', (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          fs.writeFileSync(savePath, buffer);
          resolve({ success: true, path: savePath, size: buffer.length });
        });
      });
      request.on('error', () => resolve({ success: false }));
      request.end();
    });
  } catch {
    return { success: false };
  }
});

// ═══ IPC: Descargar múltiples archivos ═══
ipcMain.handle('download-media-bulk', async (event, items) => {
  if (!mainWindow) return { success: false };
  
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Selecciona carpeta de destino',
  });
  
  if (canceled || !filePaths[0]) return { success: false };
  const destDir = filePaths[0];
  
  const { net } = require('electron');
  const results = [];
  
  for (const item of items) {
    try {
      const ext = path.extname(new URL(item.src).pathname) || '.jpg';
      const filename = (item.alt || 'media_' + Date.now()) + ext;
      const safeName = filename.replace(/[<>:"/\\|?*]/g, '_');
      const fullPath = path.join(destDir, safeName);
      
      await new Promise((resolve, reject) => {
        const request = net.request(item.src);
        request.on('response', (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            fs.writeFileSync(fullPath, Buffer.concat(chunks));
            resolve();
          });
        });
        request.on('error', reject);
        request.end();
      });
      results.push({ success: true, src: item.src });
    } catch {
      results.push({ success: false, src: item.src });
    }
  }
  
  return { success: true, downloaded: results.filter(r => r.success).length, total: items.length };
});

// ═══ IPC: Capturar audio del tab (para detección de canciones) ═══
ipcMain.handle('capture-tab-audio', async () => {
  // Capturar audio del tab usando desktopCapturer
  try {
    const sources = await desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 1, height: 1 } });
    const orionSource = sources.find(s => s.name.includes('Orion'));
    return { sourceId: orionSource?.id || null };
  } catch {
    return { sourceId: null };
  }
});

// ═══ IPC: Sugerencias de búsqueda (proxy sin CORS, multi-motor) ═══
ipcMain.handle('fetch-suggestions', async (_event, query, engine = 'google') => {
  if (!query || !query.trim()) return [];
  const q = encodeURIComponent(query.trim());
  const { net } = require('electron');

  const SUGGEST_URLS = {
    google:     `https://suggestqueries.google.com/complete/search?client=firefox&q=${q}&hl=es`,
    duckduckgo: `https://duckduckgo.com/ac/?q=${q}&type=list`,
    brave:      `https://search.brave.com/api/suggest?q=${q}`,
    bing:       `https://api.bing.com/osjson.aspx?query=${q}`,
    ecosia:     `https://ac.ecosia.org/autocomplete?q=${q}&type=list`,
  };

  const url = SUGGEST_URLS[engine] || SUGGEST_URLS.google;

  try {
    const response = await net.fetch(url);
    const data = await response.json();
    // Brave devuelve {results:[{query}]}, el resto devuelve [query, [sugerencias]]
    if (engine === 'brave') {
      return Array.isArray(data.results)
        ? data.results.map(r => r.query || r.title || '').filter(Boolean).slice(0, 8)
        : [];
    }
    return Array.isArray(data[1]) ? data[1].slice(0, 8) : [];
  } catch {
    return [];
  }
});

// ═══ IPC: Obtener URL actual del webview ═══
ipcMain.handle('get-current-url', (event, targetUrl) => {
  const guest = findWebView(targetUrl);
  if (guest) return guest.getURL();
  return mainWindow?.webContents.getURL() || '';
});

function findWebView(targetUrl) {
  const allWC = webContents.getAllWebContents();
  if (targetUrl) {
    const match = allWC.find(
      wc => wc.getType() === 'webview' && wc.getURL() === targetUrl
    );
    if (match) return match;
  }
  return allWC.find(wc => wc.getType() === 'webview') || null;
}