import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "default" | "ocean" | "sunset" | "forest" | "purple" | "amoled";
type Mode = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("default");
  const [mode, setMode] = useState<Mode>("dark");

  useEffect(() => {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedMode = localStorage.getItem("mode") as Mode | null;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedMode) setMode(savedMode);
  }, []);

  useEffect(() => {
    // Guardar tema
    localStorage.setItem("theme", theme);
    localStorage.setItem("mode", mode);
    
    // Aplicar tema al documento
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-mode", mode);
  }, [theme, mode]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser usado dentro de ThemeProvider");
  }
  return context;
};
