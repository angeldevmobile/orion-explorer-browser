import { createContext } from "react";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */

export type ThemeId =
  | "midnight"
  | "aurora"
  | "ocean"
  | "sunset"
  | "forest"
  | "lavender"
  | "amoled"
  | "arctic";

export type Mode = "light" | "dark" | "system";

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  accent: string;
  accentGradient: [string, string];
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderHover: string;
  hoverBg: string;
  activeBg: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  iconSvg: string;
  colors: {
    dark: ThemeColors;
    light: ThemeColors;
  };
}

/* ═══════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════ */

const ICON = {
  moon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  aurora: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m6.34 6.34 2.83 2.83"/><path d="M2 12h4"/><path d="m17.66 6.34-2.83 2.83"/><path d="M22 12h-4"/><path d="M6 20a6 6 0 0 1 12 0"/></svg>`,
  wave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
  sunset: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>`,
  leaf: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  flower: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m3 4.5a4.5 4.5 0 1 0 4.5-4.5M12 16.5V15m4.5-3a4.5 4.5 0 1 1-4.5-4.5M16.5 12H15"/><circle cx="12" cy="12" r="3"/></svg>`,
  circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
  snowflake: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>`,
} as const;

/* ═══════════════════════════════════════════
   THEMES
   ═══════════════════════════════════════════ */

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  midnight: {
    id: "midnight",
    name: "Midnight",
    description: "Azul profundo y cian neón",
    iconSvg: ICON.moon,
    colors: {
      dark: {
        bgPrimary: "#0a0e1a",
        bgSecondary: "#0d1117",
        bgTertiary: "#111827",
        accent: "#06b6d4",
        accentGradient: ["#06b6d4", "#14b8a6"],
        accentGlow: "rgba(6, 182, 212, 0.25)",
        textPrimary: "#e2e8f0",
        textSecondary: "#94a3b8",
        textMuted: "#475569",
        border: "rgba(255, 255, 255, 0.06)",
        borderHover: "rgba(255, 255, 255, 0.12)",
        hoverBg: "rgba(255, 255, 255, 0.04)",
        activeBg: "rgba(6, 182, 212, 0.1)",
      },
      light: {
        bgPrimary: "#f8fafc",
        bgSecondary: "#f1f5f9",
        bgTertiary: "#e2e8f0",
        accent: "#0891b2",
        accentGradient: ["#0891b2", "#0d9488"],
        accentGlow: "rgba(8, 145, 178, 0.2)",
        textPrimary: "#0f172a",
        textSecondary: "#475569",
        textMuted: "#94a3b8",
        border: "rgba(0, 0, 0, 0.08)",
        borderHover: "rgba(0, 0, 0, 0.15)",
        hoverBg: "rgba(0, 0, 0, 0.04)",
        activeBg: "rgba(8, 145, 178, 0.1)",
      },
    },
  },
  aurora: {
    id: "aurora",
    name: "Aurora",
    description: "Verdes y violetas boreales",
    iconSvg: ICON.aurora,
    colors: {
      dark: {
        bgPrimary: "#0b0f14",
        bgSecondary: "#0f1419",
        bgTertiary: "#151c24",
        accent: "#a78bfa",
        accentGradient: ["#a78bfa", "#34d399"],
        accentGlow: "rgba(167, 139, 250, 0.25)",
        textPrimary: "#e2e8f0",
        textSecondary: "#94a3b8",
        textMuted: "#475569",
        border: "rgba(255, 255, 255, 0.06)",
        borderHover: "rgba(167, 139, 250, 0.2)",
        hoverBg: "rgba(167, 139, 250, 0.06)",
        activeBg: "rgba(167, 139, 250, 0.12)",
      },
      light: {
        bgPrimary: "#faf5ff",
        bgSecondary: "#f3e8ff",
        bgTertiary: "#e9d5ff",
        accent: "#7c3aed",
        accentGradient: ["#7c3aed", "#059669"],
        accentGlow: "rgba(124, 58, 237, 0.2)",
        textPrimary: "#1e1b4b",
        textSecondary: "#6b21a8",
        textMuted: "#a78bfa",
        border: "rgba(124, 58, 237, 0.1)",
        borderHover: "rgba(124, 58, 237, 0.2)",
        hoverBg: "rgba(124, 58, 237, 0.05)",
        activeBg: "rgba(124, 58, 237, 0.1)",
      },
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Azules marinos profundos",
    iconSvg: ICON.wave,
    colors: {
      dark: {
        bgPrimary: "#0a1628",
        bgSecondary: "#0d1b30",
        bgTertiary: "#132240",
        accent: "#3b82f6",
        accentGradient: ["#3b82f6", "#06b6d4"],
        accentGlow: "rgba(59, 130, 246, 0.25)",
        textPrimary: "#e2e8f0",
        textSecondary: "#93c5fd",
        textMuted: "#3b82f6",
        border: "rgba(59, 130, 246, 0.1)",
        borderHover: "rgba(59, 130, 246, 0.2)",
        hoverBg: "rgba(59, 130, 246, 0.06)",
        activeBg: "rgba(59, 130, 246, 0.12)",
      },
      light: {
        bgPrimary: "#eff6ff",
        bgSecondary: "#dbeafe",
        bgTertiary: "#bfdbfe",
        accent: "#2563eb",
        accentGradient: ["#2563eb", "#0891b2"],
        accentGlow: "rgba(37, 99, 235, 0.2)",
        textPrimary: "#1e3a5f",
        textSecondary: "#1d4ed8",
        textMuted: "#60a5fa",
        border: "rgba(37, 99, 235, 0.1)",
        borderHover: "rgba(37, 99, 235, 0.2)",
        hoverBg: "rgba(37, 99, 235, 0.05)",
        activeBg: "rgba(37, 99, 235, 0.1)",
      },
    },
  },
  sunset: {
    id: "sunset",
    name: "Sunset",
    description: "Naranjas y rosas cálidos",
    iconSvg: ICON.sunset,
    colors: {
      dark: {
        bgPrimary: "#150a0a",
        bgSecondary: "#1a0e0e",
        bgTertiary: "#221414",
        accent: "#f97316",
        accentGradient: ["#f97316", "#ec4899"],
        accentGlow: "rgba(249, 115, 22, 0.25)",
        textPrimary: "#fde8e8",
        textSecondary: "#fca5a5",
        textMuted: "#7f1d1d",
        border: "rgba(249, 115, 22, 0.1)",
        borderHover: "rgba(249, 115, 22, 0.2)",
        hoverBg: "rgba(249, 115, 22, 0.06)",
        activeBg: "rgba(249, 115, 22, 0.12)",
      },
      light: {
        bgPrimary: "#fff7ed",
        bgSecondary: "#ffedd5",
        bgTertiary: "#fed7aa",
        accent: "#ea580c",
        accentGradient: ["#ea580c", "#db2777"],
        accentGlow: "rgba(234, 88, 12, 0.2)",
        textPrimary: "#431407",
        textSecondary: "#9a3412",
        textMuted: "#fb923c",
        border: "rgba(234, 88, 12, 0.1)",
        borderHover: "rgba(234, 88, 12, 0.2)",
        hoverBg: "rgba(234, 88, 12, 0.05)",
        activeBg: "rgba(234, 88, 12, 0.1)",
      },
    },
  },
  forest: {
    id: "forest",
    name: "Forest",
    description: "Verdes naturales y tierra",
    iconSvg: ICON.leaf,
    colors: {
      dark: {
        bgPrimary: "#0a1410",
        bgSecondary: "#0d1a14",
        bgTertiary: "#12221a",
        accent: "#10b981",
        accentGradient: ["#10b981", "#84cc16"],
        accentGlow: "rgba(16, 185, 129, 0.25)",
        textPrimary: "#e2f0e8",
        textSecondary: "#86efac",
        textMuted: "#166534",
        border: "rgba(16, 185, 129, 0.1)",
        borderHover: "rgba(16, 185, 129, 0.2)",
        hoverBg: "rgba(16, 185, 129, 0.06)",
        activeBg: "rgba(16, 185, 129, 0.12)",
      },
      light: {
        bgPrimary: "#f0fdf4",
        bgSecondary: "#dcfce7",
        bgTertiary: "#bbf7d0",
        accent: "#059669",
        accentGradient: ["#059669", "#65a30d"],
        accentGlow: "rgba(5, 150, 105, 0.2)",
        textPrimary: "#14532d",
        textSecondary: "#166534",
        textMuted: "#4ade80",
        border: "rgba(5, 150, 105, 0.1)",
        borderHover: "rgba(5, 150, 105, 0.2)",
        hoverBg: "rgba(5, 150, 105, 0.05)",
        activeBg: "rgba(5, 150, 105, 0.1)",
      },
    },
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    description: "Violetas suaves y elegantes",
    iconSvg: ICON.flower,
    colors: {
      dark: {
        bgPrimary: "#0f0a1a",
        bgSecondary: "#130e20",
        bgTertiary: "#1a1428",
        accent: "#c084fc",
        accentGradient: ["#c084fc", "#f0abfc"],
        accentGlow: "rgba(192, 132, 252, 0.25)",
        textPrimary: "#f0e8ff",
        textSecondary: "#d8b4fe",
        textMuted: "#581c87",
        border: "rgba(192, 132, 252, 0.1)",
        borderHover: "rgba(192, 132, 252, 0.2)",
        hoverBg: "rgba(192, 132, 252, 0.06)",
        activeBg: "rgba(192, 132, 252, 0.12)",
      },
      light: {
        bgPrimary: "#faf5ff",
        bgSecondary: "#f3e8ff",
        bgTertiary: "#e9d5ff",
        accent: "#9333ea",
        accentGradient: ["#9333ea", "#d946ef"],
        accentGlow: "rgba(147, 51, 234, 0.2)",
        textPrimary: "#3b0764",
        textSecondary: "#6b21a8",
        textMuted: "#c084fc",
        border: "rgba(147, 51, 234, 0.1)",
        borderHover: "rgba(147, 51, 234, 0.2)",
        hoverBg: "rgba(147, 51, 234, 0.05)",
        activeBg: "rgba(147, 51, 234, 0.1)",
      },
    },
  },
  amoled: {
    id: "amoled",
    name: "AMOLED",
    description: "Negro puro, máximo contraste",
    iconSvg: ICON.circle,
    colors: {
      dark: {
        bgPrimary: "#000000",
        bgSecondary: "#0a0a0a",
        bgTertiary: "#141414",
        accent: "#ffffff",
        accentGradient: ["#ffffff", "#a1a1aa"],
        accentGlow: "rgba(255, 255, 255, 0.15)",
        textPrimary: "#ffffff",
        textSecondary: "#a1a1aa",
        textMuted: "#3f3f46",
        border: "rgba(255, 255, 255, 0.06)",
        borderHover: "rgba(255, 255, 255, 0.12)",
        hoverBg: "rgba(255, 255, 255, 0.04)",
        activeBg: "rgba(255, 255, 255, 0.08)",
      },
      light: {
        bgPrimary: "#ffffff",
        bgSecondary: "#fafafa",
        bgTertiary: "#f4f4f5",
        accent: "#18181b",
        accentGradient: ["#18181b", "#3f3f46"],
        accentGlow: "rgba(24, 24, 27, 0.15)",
        textPrimary: "#09090b",
        textSecondary: "#3f3f46",
        textMuted: "#a1a1aa",
        border: "rgba(0, 0, 0, 0.08)",
        borderHover: "rgba(0, 0, 0, 0.15)",
        hoverBg: "rgba(0, 0, 0, 0.03)",
        activeBg: "rgba(0, 0, 0, 0.06)",
      },
    },
  },
  arctic: {
    id: "arctic",
    name: "Arctic",
    description: "Blancos fríos y azul hielo",
    iconSvg: ICON.snowflake,
    colors: {
      dark: {
        bgPrimary: "#0c1220",
        bgSecondary: "#101828",
        bgTertiary: "#162032",
        accent: "#7dd3fc",
        accentGradient: ["#7dd3fc", "#bae6fd"],
        accentGlow: "rgba(125, 211, 252, 0.25)",
        textPrimary: "#f0f9ff",
        textSecondary: "#bae6fd",
        textMuted: "#0c4a6e",
        border: "rgba(125, 211, 252, 0.08)",
        borderHover: "rgba(125, 211, 252, 0.18)",
        hoverBg: "rgba(125, 211, 252, 0.06)",
        activeBg: "rgba(125, 211, 252, 0.12)",
      },
      light: {
        bgPrimary: "#f0f9ff",
        bgSecondary: "#e0f2fe",
        bgTertiary: "#bae6fd",
        accent: "#0284c7",
        accentGradient: ["#0284c7", "#0ea5e9"],
        accentGlow: "rgba(2, 132, 199, 0.2)",
        textPrimary: "#0c4a6e",
        textSecondary: "#075985",
        textMuted: "#7dd3fc",
        border: "rgba(2, 132, 199, 0.1)",
        borderHover: "rgba(2, 132, 199, 0.2)",
        hoverBg: "rgba(2, 132, 199, 0.05)",
        activeBg: "rgba(2, 132, 199, 0.1)",
      },
    },
  },
};

/* ═══════════════════════════════════════════
   UTILITIES & CONTEXT
   ═══════════════════════════════════════════ */

export const STORAGE_KEYS = {
  theme: "orion-theme",
  mode: "orion-mode",
} as const;

export function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export interface ThemeContextType {
  themeId: ThemeId;
  mode: Mode;
  resolvedMode: "light" | "dark";
  colors: ThemeColors;
  theme: ThemeDefinition;
  allThemes: ThemeDefinition[];
  setTheme: (id: ThemeId) => void;
  setMode: (mode: Mode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);