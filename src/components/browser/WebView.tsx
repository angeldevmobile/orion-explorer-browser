import { useEffect, useRef, useState } from "react";
import { ExternalLink, RefreshCw, WifiOff } from "lucide-react";

interface WebViewProps {
  url: string;
  onLoadStart?: () => void;
  onLoadStop?: () => void;
  onTitleUpdate?: (title: string) => void;
  onFaviconUpdate?: (favicon: string) => void;
  onUrlChange?: (url: string) => void;
  onNewWindow?: (url: string) => void;
  className?: string;
}

interface WebViewTitleEvent extends Event {
  title: string;
}

interface WebViewFaviconEvent extends Event {
  favicons: string[];
}

interface ElectronWebViewElement extends HTMLElement {
  src: string;
}

const isElectron =
  !!window.electron || navigator.userAgent.includes("Electron");

export const WebView = ({
  url,
  onLoadStart,
  onLoadStop,
  onTitleUpdate,
  onFaviconUpdate,
  onUrlChange,
  onNewWindow,
  className = "w-full h-full",
}: WebViewProps) => {
  const webviewRef = useRef<ElectronWebViewElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const initialLoadDone = useRef(false);
  const loadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Refs para evitar loop de navegación ──
  const initialUrl = useRef(url);       // src estable para el <webview>
  const internalNavUrl = useRef("");     // última URL de did-navigate

  // ── Navegación imperativa: solo cuando el padre cambia la URL ──
  useEffect(() => {
    if (!isElectron) return;
    const webview = webviewRef.current;
    if (!webview) return;

    // Si la URL viene de una navegación interna (did-navigate), no re-navegar
    if (url === internalNavUrl.current) return;

    webview.src = url;
    initialLoadDone.current = false;
    if (loadTimeout.current) {
      clearTimeout(loadTimeout.current);
      loadTimeout.current = null;
    }
    setIsLoading(true);
    setLoadError(false);
  }, [url]);

  useEffect(() => {
    if (!isElectron) return;
    const webview = webviewRef.current;
    if (!webview) return;

    const handleLoadStart = () => {
      if (!initialLoadDone.current) {
        setIsLoading(true);
        setLoadError(false);
        onLoadStart?.();
        if (loadTimeout.current) clearTimeout(loadTimeout.current);
      }
    };

    const hideSpinner = () => {
      if (loadTimeout.current) return; // already scheduled
      loadTimeout.current = setTimeout(() => {
        loadTimeout.current = null;
        initialLoadDone.current = true;
        setIsLoading(false);
        onLoadStop?.();
      }, 150);
    };

    const handleLoadStop = () => { hideSpinner(); };
    const handleDomReady = () => { hideSpinner(); };
    const handleDidFinishLoad = () => { hideSpinner(); };

    const handleTitleUpdated = (e: Event) => {
      onTitleUpdate?.((e as WebViewTitleEvent).title);
    };

    const handleFaviconUpdated = (e: Event) => {
      const favicons = (e as WebViewFaviconEvent).favicons;
      if (favicons?.length > 0) onFaviconUpdate?.(favicons[0]);
    };

    // ── Capturar la URL real tras navegación interna ──
    const handleDidNavigate = (e: Event) => {
      const navUrl = (e as Event & { url: string }).url;
      console.log("[WebView] did-navigate →", navUrl);
      if (navUrl) {
        internalNavUrl.current = navUrl;
        onUrlChange?.(navUrl);
      }
    };

    const handleDidNavigateInPage = (e: Event) => {
      const navUrl = (e as Event & { url: string }).url;
      console.log("[WebView] did-navigate-in-page →", navUrl);
      if (navUrl) {
        internalNavUrl.current = navUrl;
        onUrlChange?.(navUrl);
      }
    };

    // ── Links con target="_blank" → nueva pestaña en Orion ──
    const handleNewWindow = (e: Event) => {
      const newUrl = (e as Event & { url: string }).url;
      console.log("[WebView] new-window →", newUrl);
      if (!newUrl) return;
      if (onNewWindow) {
        onNewWindow(newUrl);
      } else {
        // Fallback: navegar en la pestaña actual
        webview.src = newUrl;
        internalNavUrl.current = "";
        setIsLoading(true);
        setLoadError(false);
      }
    };

    const handleWillNavigate = (e: Event) => {
      const navUrl = (e as Event & { url: string }).url;
      console.log("[WebView] will-navigate →", navUrl);
    };

    const handleError = (e: Event) => {
      // ERR_ABORTED (-3) ocurre en navegación normal (redirects), ignorarlo
      const errorCode = (e as Event & { errorCode?: number }).errorCode;
      if (errorCode === -3) return;

      initialLoadDone.current = true;
      setIsLoading(false);
      setLoadError(true);
    };

    const safetyTimeout = setTimeout(() => {
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
        setIsLoading(false);
      }
    }, 4000);

    webview.addEventListener("did-start-loading", handleLoadStart);
    webview.addEventListener("did-stop-loading", handleLoadStop);
    webview.addEventListener("dom-ready", handleDomReady);
    webview.addEventListener("did-finish-load", handleDidFinishLoad);
    webview.addEventListener("page-title-updated", handleTitleUpdated);
    webview.addEventListener("page-favicon-updated", handleFaviconUpdated);
    webview.addEventListener("did-navigate", handleDidNavigate);
    webview.addEventListener("did-navigate-in-page", handleDidNavigateInPage);
    webview.addEventListener("will-navigate", handleWillNavigate);
    webview.addEventListener("did-fail-load", handleError);
    webview.addEventListener("new-window", handleNewWindow);

    return () => {
      clearTimeout(safetyTimeout);
      if (loadTimeout.current) clearTimeout(loadTimeout.current);
      webview.removeEventListener("did-start-loading", handleLoadStart);
      webview.removeEventListener("did-stop-loading", handleLoadStop);
      webview.removeEventListener("dom-ready", handleDomReady);
      webview.removeEventListener("did-finish-load", handleDidFinishLoad);
      webview.removeEventListener("page-title-updated", handleTitleUpdated);
      webview.removeEventListener("page-favicon-updated", handleFaviconUpdated);
      webview.removeEventListener("did-navigate", handleDidNavigate);
      webview.removeEventListener("did-navigate-in-page", handleDidNavigateInPage);
      webview.removeEventListener("will-navigate", handleWillNavigate);
      webview.removeEventListener("did-fail-load", handleError);
      webview.removeEventListener("new-window", handleNewWindow);
    };
  }, [onLoadStart, onLoadStop, onTitleUpdate, onFaviconUpdate, onUrlChange, onNewWindow]);

  useEffect(() => {
    if (isElectron) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      const hostname = new URL(url).hostname;
      onTitleUpdate?.(hostname);
      onFaviconUpdate?.(
        `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
      );
    } catch {
      /* ignore */
    }
  }, [url, onTitleUpdate, onFaviconUpdate]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    onLoadStop?.();
  };
  const handleIframeError = () => {
    setIsLoading(false);
    setLoadError(true);
  };

  return (
    <div className="relative w-full h-full bg-[#0a0e1a]">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e1a]/90 backdrop-blur-md transition-all duration-500">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s" }}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
            </div>
          </div>
          <div className="w-48 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
              style={{ animation: "loadProgress 2s ease-in-out infinite" }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-3">Cargando página…</p>
          <style>{`
            @keyframes loadProgress {
              0% { width: 0%; margin-left: 0; }
              50% { width: 70%; margin-left: 0; }
              100% { width: 0%; margin-left: 100%; }
            }
          `}</style>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]">
          <div className="flex flex-col items-center gap-5 text-center max-w-sm px-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-red-500/[0.08] border border-red-500/20 flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-red-400" />
              </div>
              <div className="absolute -inset-2 rounded-3xl bg-red-500/5 blur-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200 mb-1.5">
                No se pudo cargar
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {isElectron
                  ? "Hubo un error al intentar cargar esta página. Verifica tu conexión a internet."
                  : "Este sitio no permite la carga en marcos embebidos por razones de seguridad."}
              </p>
            </div>
            <div className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="text-xs text-slate-500 truncate font-mono">{url}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setLoadError(false);
                  setIsLoading(true);
                  initialLoadDone.current = false;
                  if (iframeRef.current) {
                    iframeRef.current.src = url;
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-sm text-slate-300 transition-all duration-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 transition-all duration-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir en pestaña
              </a>
            </div>
          </div>
        </div>
      )}

      {isElectron ? (
        <webview
          ref={webviewRef}
          src={initialUrl.current}
          className={className}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <iframe
          ref={iframeRef}
          src={url}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className={className}
          style={{ width: "100%", height: "100%", border: "none" }}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
          referrerPolicy="no-referrer"
          title="Orion WebView"
        />
      )}
    </div>
  );
};