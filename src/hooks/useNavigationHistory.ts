// src/hooks/useNavigationHistory.ts
import { useState, useCallback } from 'react';

interface HistoryEntry {
  url: string;
  title?: string;
}

export function useNavigationHistory(initialUrl: string = '') {
  const [history, setHistory] = useState<HistoryEntry[]>(
    initialUrl ? [{ url: initialUrl }] : []
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  const push = useCallback((url: string, title?: string) => {
    setHistory((prev) => {
      // Si no estamos al final, elimina el historial siguiente
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push({ url, title });
      return newHistory;
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const back = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const forward = useCallback(() => {
    setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;
  const current = history[currentIndex];

  return {
    currentUrl: current?.url || '',
    canGoBack,
    canGoForward,
    back,
    forward,
    push,
    history,
    currentIndex,
  };
}