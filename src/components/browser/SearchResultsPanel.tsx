// src/components/browser/SearchResultsPanel.tsx
import { useState, useEffect } from "react";
import { Search, Globe, ExternalLink, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  engine: "google" | "duckduckgo" | "brave" | "ecosia";
}

interface SearchResultsPanelProps {
  query: string;
  onNavigate: (url: string) => void;
}

const SEARCH_ENGINES = [
  {
    id: "google",
    name: "Google",
    color: "text-blue-400",
    border: "hover:border-blue-500/30",
    icon: "🔵",
    url: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    color: "text-orange-400",
    border: "hover:border-orange-500/30",
    icon: "🦆",
    url: (q: string) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "brave",
    name: "Brave Search",
    color: "text-orange-500",
    border: "hover:border-orange-600/30",
    icon: "⚔️",
    url: (q: string) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "ecosia",
    name: "Ecosia",
    color: "text-green-400",
    border: "hover:border-green-500/30",
    icon: "🌱",
    url: (q: string) => `https://www.ecosia.org/search?q=${encodeURIComponent(q)}`,
  },
];

export const SearchResultsPanel = ({ query, onNavigate }: SearchResultsPanelProps) => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col h-full bg-background border-r border-border/60 overflow-hidden">

      {/* Header */}
      <div className="flex-shrink-0 border-b border-border/40 bg-muted/5 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-muted-foreground/60" />
          <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
            Resultados Web
          </h3>
        </div>
        <p className="text-xs text-muted-foreground/50 line-clamp-2">
          "{query}"
        </p>
      </div>

      {/* Search Engines Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* Title */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3">
              Buscar en:
            </p>
            <div className="space-y-2">
              {SEARCH_ENGINES.map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => onNavigate(engine.url(query))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    bg-muted/10 border border-border/60 ${engine.border}
                    hover:bg-muted/20 transition-all group text-left`}
                >
                  <span className="text-lg flex-shrink-0">{engine.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${engine.color} group-hover:brightness-110`}>
                      {engine.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground/40">
                      {engine.name === "Google" && "Búsqueda rápida y precisa"}
                      {engine.name === "DuckDuckGo" && "Privacidad al primero"}
                      {engine.name === "Brave Search" && "Búsqueda independiente"}
                      {engine.name === "Ecosia" && "Búsqueda con propósito"}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/80 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="h-px bg-border/40 my-4" />

          {/* Quick tips */}
          <div className="bg-muted/5 border border-border/20 rounded-lg p-3 space-y-2">
            <div className="flex gap-2 items-start">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400/70 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-foreground/80">Consejo</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Usa el chat a la derecha para profundizar en el tema. Haz preguntas de seguimiento para obtener más detalles.
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex gap-2 text-[10px] text-muted-foreground/40 px-2">
            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <p>Haz clic en cualquier motor para explorar los resultados</p>
          </div>
        </div>
      </div>
    </div>
  );
};