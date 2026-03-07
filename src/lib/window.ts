export {};

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
    };
  }
}