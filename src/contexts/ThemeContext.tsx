import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  type ThemeId,
  type Mode,
  THEMES,
  STORAGE_KEYS,
  getSystemMode,
  ThemeContext,
} from "./theme-definitions";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme) as ThemeId | null;
    return saved && THEMES[saved] ? saved : "midnight";
  });

  const [mode, setModeState] = useState<Mode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.mode) as Mode | null;
    return saved || "dark";
  });

  const [systemMode, setSystemMode] = useState<"light" | "dark">(getSystemMode);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemMode(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedMode = mode === "system" ? systemMode : mode;
  const themeDefinition = THEMES[themeId];
  const colors = themeDefinition.colors[resolvedMode];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, themeId);
    localStorage.setItem(STORAGE_KEYS.mode, mode);

    const root = document.documentElement;
    root.setAttribute("data-theme", themeId);
    root.setAttribute("data-mode", resolvedMode);

    Object.entries(colors).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        root.style.setProperty(`--orion-${key}-from`, value[0]);
        root.style.setProperty(`--orion-${key}-to`, value[1]);
      } else {
        root.style.setProperty(`--orion-${key}`, value);
      }
    });
  }, [themeId, mode, resolvedMode, colors]);

  const setTheme = useCallback((id: ThemeId) => {
    if (THEMES[id]) setThemeId(id);
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      mode,
      resolvedMode,
      colors,
      theme: themeDefinition,
      allThemes: Object.values(THEMES),
      setTheme,
      setMode,
    }),
    [themeId, mode, resolvedMode, colors, themeDefinition, setTheme, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};