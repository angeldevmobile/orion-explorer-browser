export {};

interface PagePrivacyStats {
  trackersBlocked: number;
  cookiesBlocked: number;
  dataSavedBytes: number;
}

interface PrivacyBlockedEvent {
  type: 'tracker' | 'mining';
  hostname: string;
  pageHost: string | null;
  pageStats: PagePrivacyStats | null;
}

declare global {
  interface Window {
    electron?: {
      platform: string;

      // Controles de ventana
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      isMaximized: () => Promise<boolean>;

      // Captura de pantalla
      capturePage: () => Promise<string | null>;
      captureScreen: () => Promise<string | null>;

      // PDF
      printToPdf: () => Promise<string | null>;

      // Guardar HTML
      savePageHtml: () => Promise<string | null>;

      // DevTools
      openDevTools: (panel?: string) => Promise<void>;
      closeDevTools: () => Promise<void>;

      // Vista responsiva
      toggleDeviceEmulation: () => Promise<boolean>;

      // Audio
      toggleMute: () => Promise<boolean>;
      isMuted: () => Promise<boolean>;

      // Obtener fuente de página
      getPageSource: () => Promise<string | null>;

      // Privacidad
      updatePrivacyPrefs: (prefs: Record<string, boolean>) => Promise<Record<string, boolean>>;
      getPrivacyStats: () => Promise<PagePrivacyStats>;
      getPagePrivacyStats: (hostname: string) => Promise<PagePrivacyStats>;
      resetPagePrivacyStats: (hostname: string) => Promise<boolean>;
      clearBrowsingData: (options: {
        cache?: boolean;
        cookies?: boolean;
        localStorage?: boolean;
        sessionStorage?: boolean;
        indexedDB?: boolean;
      }) => Promise<boolean>;

      getPageMedia: () => Promise<Array<{
        type: 'image' | 'video' | 'audio';
        src: string;
        alt?: string;
        width?: number;
        height?: number;
        poster?: string;
        duration?: number;
      }>>;
      downloadMedia: (data: { url: string; filename?: string }) => Promise<{ success: boolean; path?: string; size?: number }>;
      downloadMediaBulk: (items: Array<{ src: string; alt?: string }>) => Promise<{ success: boolean; downloaded?: number; total?: number }>;
      captureTabAudio: () => Promise<{ sourceId: string | null }>;
      getCurrentUrl: () => Promise<string>;

      // Eventos de privacidad en tiempo real
      onPrivacyBlocked: (callback: (data: PrivacyBlockedEvent) => void) => void;
      removePrivacyBlockedListener: () => void;
    };
  }
}