export {};

declare global {
  interface Window {
    electron?: {
      platform: string;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
    };
  }
}