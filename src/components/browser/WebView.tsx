import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface WebViewProps {
  url: string;
  onLoadStart?: () => void;
  onLoadStop?: () => void;
  onTitleUpdate?: (title: string) => void;
  onFaviconUpdate?: (favicon: string) => void;
  className?: string;
}

interface PageTitleUpdatedEvent extends Event {
  title: string;
}

interface PageFaviconUpdatedEvent extends Event {
  favicons: string[];
}

type WebViewEventListener = ((e: Event) => void) | ((e: PageTitleUpdatedEvent) => void) | ((e: PageFaviconUpdatedEvent) => void);

interface WebViewElement extends HTMLElement {
  src: string;
  addEventListener(event: string, listener: WebViewEventListener): void;
  removeEventListener(event: string, listener: WebViewEventListener): void;
}

export const WebView = ({ 
  url, 
  onLoadStart, 
  onLoadStop, 
  onTitleUpdate,
  onFaviconUpdate,
  className = "w-full h-full" 
}: WebViewProps) => {
  const webviewRef = useRef<WebViewElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // Event listeners
    const handleLoadStart = () => {
      setIsLoading(true);
      onLoadStart?.();
    };

    const handleLoadStop = () => {
      setIsLoading(false);
      onLoadStop?.();
    };

    const handleTitleUpdated = (e: Event) => {
      const titleEvent = e as PageTitleUpdatedEvent;
      console.log('Title updated:', titleEvent.title);
      onTitleUpdate?.(titleEvent.title);
    };

    const handleFaviconUpdated = (e: Event) => {
      const faviconEvent = e as PageFaviconUpdatedEvent;
      console.log('Favicon updated:', faviconEvent.favicons);
      if (faviconEvent.favicons && faviconEvent.favicons.length > 0) {
        onFaviconUpdate?.(faviconEvent.favicons[0]);
      }
    };

    webview.addEventListener('did-start-loading', handleLoadStart);
    webview.addEventListener('did-stop-loading', handleLoadStop);
    webview.addEventListener('page-title-updated', handleTitleUpdated);
    webview.addEventListener('page-favicon-updated', handleFaviconUpdated);

    return () => {
      webview.removeEventListener('did-start-loading', handleLoadStart);
      webview.removeEventListener('did-stop-loading', handleLoadStop);
      webview.removeEventListener('page-title-updated', handleTitleUpdated);
      webview.removeEventListener('page-favicon-updated', handleFaviconUpdated);
    };
  }, [url, onLoadStart, onLoadStop, onTitleUpdate, onFaviconUpdate]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      )}
      <webview
        ref={webviewRef}
        src={url}
        className={className}
      />
    </div>
  );
};