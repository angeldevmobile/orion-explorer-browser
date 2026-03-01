import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  RotateCw,
  Sparkles,
  Mic,
  MicOff,
  Eye,
  EyeOff,
  Timer,
  Zap,
  Copy,
  Check,
  QrCode,
  Share2,
  ArrowRight,
  Clock,
  TrendingUp,
  Globe,
  Loader2,
  X,
  ChevronDown,
  Bookmark,
  AlertTriangle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "@/hooks/use-toast";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface AddressBarProps {
  url: string;
  onNavigate: (url: string) => void;
  onRefresh: () => void;
  isSecure?: boolean;
  isLoading?: boolean;
  pageTitle?: string;
  onVoiceCommand?: () => void;
  voiceState?: "idle" | "listening" | "processing" | "results";
}

interface SuggestionItem {
  type: "history" | "suggestion" | "bookmark" | "trending" | "quick-action";
  title: string;
  url?: string;
  icon?: string;
  description?: string;
  action?: () => void;
}

interface SiteSecurityInfo {
  level: "secure" | "warning" | "danger";
  protocol: string;
  certificate?: string;
  trackers: number;
  cookies: number;
  loadTime: number;
}

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const ORION_INTERNAL = ["orion://welcome", "orion://newtab", "orion://settings"];
const isInternalUrl = (url: string) => ORION_INTERNAL.some((p) => url.startsWith(p));

const toOrionDisplay = (url: string): string => {
  if (isInternalUrl(url)) return url;
  return url.replace(/^https?:\/\//, "orion://");
};

const toRealUrl = (input: string): string => {
  if (isInternalUrl(input)) return input;
  if (input.startsWith("orion://")) return "https://" + input.slice(8);
  return input;
};

const getDomain = (url: string): string => {
  try {
    return new URL(url.replace("orion://", "https://")).hostname;
  } catch {
    return url;
  }
};

/* ═══════════════════════════════════════════
   MOCK SUGGESTIONS — Reemplazar con datos reales
   ═══════════════════════════════════════════ */
const MOCK_SUGGESTIONS: SuggestionItem[] = [
  { type: "trending", title: "ChatGPT 5 release", url: "https://google.com/search?q=chatgpt+5", description: "2.1M búsquedas" },
  { type: "trending", title: "React 20 features", url: "https://google.com/search?q=react+20", description: "890K búsquedas" },
];

const QUICK_ACTIONS: SuggestionItem[] = [
  { type: "quick-action", title: "Modo privado", description: "Navegar sin dejar rastro", action: () => {} },
  { type: "quick-action", title: "Captura de pantalla", description: "Capturar esta página", action: () => {} },
  { type: "quick-action", title: "Modo lectura", description: "Leer sin distracciones", action: () => {} },
  { type: "quick-action", title: "Temporizador de sitio", description: "Limitar tiempo en este sitio", action: () => {} },
];

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function getSecurityInfo(url: string, isSecure: boolean): SiteSecurityInfo {
  // Mock — en producción esto vendría del webview/network layer
  return {
    level: isSecure ? "secure" : url.startsWith("http://") ? "danger" : "warning",
    protocol: isSecure ? "TLS 1.3" : "Sin cifrar",
    certificate: isSecure ? "Let's Encrypt Authority X3" : undefined,
    trackers: Math.floor(Math.random() * 12),
    cookies: Math.floor(Math.random() * 25),
    loadTime: +(Math.random() * 3 + 0.2).toFixed(2),
  };
}

function formatTimeAgo(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export const AddressBar = ({
  url,
  onNavigate,
  onRefresh,
  isSecure = true,
  isLoading = false,
  pageTitle,
  onVoiceCommand,
  voiceState = "idle",
}: AddressBarProps) => {
  const [inputValue, setInputValue] = useState(toOrionDisplay(url));
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [siteTimer, setSiteTimer] = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);
  const [readerMode, setReaderMode] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { addFavorite, removeFavorite, isFavorite, favorites } = useFavorites();
  const { toast } = useToast();

  const isCurrentFavorite = isFavorite(url);
  const securityInfo = getSecurityInfo(url, isSecure);
  const domain = getDomain(url);
  const isVoiceActive = voiceState !== "idle";

  // ── Sync URL changes ──
  useEffect(() => {
    if (!isFocused) {
      setInputValue(toOrionDisplay(url));
    }
  }, [url, isFocused]);

  // ── Site timer ──
  useEffect(() => {
    if (siteTimer !== null) {
      timerRef.current = setInterval(() => {
        setTimerElapsed((prev) => {
          const next = prev + 1000;
          if (next >= siteTimer) {
            toast({
              title: "⏱️ Tiempo cumplido",
              description: `Has estado ${formatTimeAgo(siteTimer)} en ${domain}`,
            });
            setSiteTimer(null);
            return 0;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [siteTimer, domain, toast]);

  // Reset timer on navigation
  useEffect(() => {
    setTimerElapsed(0);
  }, [url]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        barRef.current &&
        !barRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setShowSecurityPanel(false);
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Suggestions filtering ──
  const filteredSuggestions = useCallback((): SuggestionItem[] => {
    const q = filterQuery.toLowerCase();
    if (!q) return [...QUICK_ACTIONS, ...MOCK_SUGGESTIONS];

    const results: SuggestionItem[] = [];

    // Search bookmarks
    favorites.forEach((f) => {
      if (f.title.toLowerCase().includes(q) || f.url.toLowerCase().includes(q)) {
        results.push({
          type: "bookmark",
          title: f.title,
          url: f.url,
          description: toOrionDisplay(f.url),
        });
      }
    });

    // Add search suggestion
    results.push({
      type: "suggestion",
      title: `Buscar "${filterQuery}"`,
      url: `https://www.google.com/search?q=${encodeURIComponent(filterQuery)}`,
      description: "Google Search",
    });

    // Add matching trending
    MOCK_SUGGESTIONS.forEach((s) => {
      if (s.title.toLowerCase().includes(q)) results.push(s);
    });

    return results;
  }, [filterQuery, favorites]);

  // ── Handlers ──
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const realUrl = toRealUrl(trimmed);
    onNavigate(realUrl);
    setIsFocused(false);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowDropdown(true);
    setFilterQuery("");
    // Select all text on focus
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    // Delay to allow clicks on dropdown
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setFilterQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "URL copiada", description: toOrionDisplay(url) });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Error al copiar", description: "No se pudo copiar la URL" });
    }
  };

  const handleToggleFavorite = () => {
    if (isCurrentFavorite) {
      const fav = favorites.find((f) => f.url === url);
      if (fav) {
        removeFavorite(fav.id);
        toast({ title: "Eliminado de favoritos", description: toOrionDisplay(url) });
      }
    } else {
      addFavorite({
        title: pageTitle || domain,
        url,
      });
      toast({ title: "Añadido a favoritos", description: toOrionDisplay(url) });
    }
  };

  const handleSetTimer = (minutes: number) => {
    setSiteTimer(minutes * 60 * 1000);
    setTimerElapsed(0);
    toast({
      title: `Temporizador: ${minutes} min`,
      description: `Se te avisará después de ${minutes} minutos en ${domain}`,
    });
    setShowDropdown(false);
  };

  const handleTogglePrivacy = () => {
    setPrivacyMode(!privacyMode);
    toast({
      title: privacyMode ? "🌐 Modo normal" : "🔒 Modo privado",
      description: privacyMode
        ? "Navegación normal restaurada"
        : "No se guardarán historial ni cookies",
    });
  };

  const handleToggleReader = () => {
    setReaderMode(!readerMode);
    toast({
      title: readerMode ? "📄 Vista normal" : "📖 Modo lectura",
      description: readerMode
        ? "Vista original restaurada"
        : "Contenido optimizado para lectura",
    });
  };

  const handleSuggestionClick = (item: SuggestionItem) => {
    if (item.action) {
      item.action();
    } else if (item.url) {
      onNavigate(item.url);
    }
    setShowDropdown(false);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // ── Visual states ──
  const getBarBorder = () => {
    if (isVoiceActive) {
      if (voiceState === "listening") return "border-cyan-500/50 shadow-[0_0_20px_-4px_rgba(6,182,212,0.25)]";
      if (voiceState === "processing") return "border-violet-500/50 shadow-[0_0_20px_-4px_rgba(139,92,246,0.25)]";
      return "border-emerald-500/50 shadow-[0_0_20px_-4px_rgba(16,185,129,0.25)]";
    }
    if (privacyMode) return "border-amber-500/40 shadow-[0_0_15px_-4px_rgba(245,158,11,0.2)]";
    if (readerMode) return "border-orange-500/40";
    if (isFocused) return "border-cyan-500/40 shadow-[0_0_20px_-4px_rgba(6,182,212,0.15)]";
    return "border-white/[0.06] hover:border-white/[0.12]";
  };

  const getBarBg = () => {
    if (privacyMode) return "bg-amber-950/20";
    if (readerMode) return "bg-orange-950/15";
    if (isFocused) return "bg-white/[0.06]";
    return "bg-white/[0.03]";
  };

  const SecurityIcon = securityInfo.level === "secure" ? ShieldCheck
    : securityInfo.level === "warning" ? Shield
    : ShieldAlert;

  const securityColor = securityInfo.level === "secure" ? "text-emerald-400"
    : securityInfo.level === "warning" ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="relative w-full">
      <form
        ref={barRef}
        onSubmit={handleSubmit}
        className="flex items-center gap-2 w-full"
      >
        {/* ═══ Main Bar ═══ */}
        <div
          className={`
            flex-1 flex items-center gap-0 rounded-2xl border transition-all duration-300 relative overflow-hidden
            ${getBarBorder()} ${getBarBg()}
          `}
        >
          {/* Loading progress bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 rounded-full"
                style={{
                  animation: "loadBar 1.5s ease-in-out infinite",
                  width: "40%",
                }}
              />
            </div>
          )}

          {/* Privacy mode indicator strip */}
          {privacyMode && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
          )}

          {/* ── Security Icon ── */}
          <button
            type="button"
            onClick={() => {
              setShowSecurityPanel(!showSecurityPanel);
              setShowDropdown(false);
              setShowShareMenu(false);
            }}
            className={`flex items-center gap-2 pl-4 pr-2 py-3.5 flex-shrink-0 transition-all duration-200 hover:bg-white/[0.04] rounded-l-2xl group`}
          >
            <div className="relative">
              <SecurityIcon
                className={`h-4 w-4 ${securityColor} transition-all duration-200 group-hover:scale-110`}
              />
              {securityInfo.trackers > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>

            {/* Domain badge (when not focused) */}
            {!isFocused && !isInternalUrl(url) && (
              <span className="text-xs text-slate-500 font-medium hidden sm:inline max-w-[100px] truncate">
                {domain}
              </span>
            )}
          </button>

          {/* ── Separator ── */}
          <div className="w-px h-5 bg-white/[0.06] flex-shrink-0" />

          {/* ── Input ── */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="flex-1 px-3 py-3.5 bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none min-w-0"
            placeholder={
              privacyMode
                ? "Navegación privada — Buscar o escribir URL…"
                : "Buscar con Orion o ingresar URL…"
            }
          />

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-0.5 pr-2 flex-shrink-0">
            {/* Active timer indicator */}
            {siteTimer !== null && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/15 mr-1">
                <Timer className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-mono text-amber-400 font-bold">
                  {formatTimeAgo(siteTimer - timerElapsed)}
                </span>
              </div>
            )}

            {/* Reader mode toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleToggleReader}
              className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                readerMode
                  ? "bg-orange-500/15 text-orange-400 hover:bg-orange-500/25"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.06]"
              }`}
              title="Modo lectura"
            >
              <Sparkles className="h-3.5 w-3.5" />
            </Button>

            {/* Privacy toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleTogglePrivacy}
              className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                privacyMode
                  ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.06]"
              }`}
              title={privacyMode ? "Desactivar modo privado" : "Modo privado"}
            >
              {privacyMode ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Copy URL */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopyUrl}
              className="h-8 w-8 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all duration-200"
              title="Copiar URL"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>

            {/* Bookmark */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                isCurrentFavorite
                  ? "text-cyan-400 hover:bg-cyan-500/15"
                  : "text-slate-600 hover:text-slate-300 hover:bg-white/[0.06]"
              }`}
              title={isCurrentFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
            >
              <Star
                className={`h-3.5 w-3.5 transition-all duration-300 ${
                  isCurrentFavorite ? "fill-cyan-400" : ""
                }`}
              />
            </Button>

            {/* Separator */}
            <div className="w-px h-5 bg-white/[0.06] mx-0.5" />

            {/* Share */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowShareMenu(!showShareMenu);
                setShowSecurityPanel(false);
                setShowDropdown(false);
              }}
              className="h-8 w-8 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-all duration-200"
              title="Compartir"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>

            {/* Voice */}
            {onVoiceCommand && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onVoiceCommand}
                className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                  voiceState === "listening"
                    ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 animate-pulse"
                    : voiceState === "processing"
                    ? "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
                    : "text-slate-600 hover:text-cyan-400 hover:bg-white/[0.06]"
                }`}
                title="Búsqueda por voz"
              >
                {voiceState === "listening" ? (
                  <MicOff className="h-3.5 w-3.5" />
                ) : voiceState === "processing" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* ═══ Refresh Button ═══ */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={isLoading ? undefined : onRefresh}
          className={`h-10 w-10 rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all duration-300 flex-shrink-0 ${
            isLoading
              ? "text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
              : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] hover:border-white/[0.12]"
          }`}
        >
          {isLoading ? (
            <X className="h-4 w-4" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* ═══════════════════════════════════════
         DROPDOWNS
         ═══════════════════════════════════════ */}

      {/* ── Smart Suggestions Dropdown ── */}
      {showDropdown && isFocused && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 z-50 animate-in"
        >
          <div className="rounded-2xl bg-[#0d1117] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {/* Quick Actions */}
            {!filterQuery && (
              <div className="p-3 border-b border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold px-2 mb-2">
                  Acciones rápidas
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Timer action */}
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSetTimer(15)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150 text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <Timer className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 font-medium">Temporizador</p>
                      <p className="text-[10px] text-slate-600">Limitar tiempo de uso</p>
                    </div>
                  </button>

                  {/* Screenshot */}
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      toast({ title: "📸 Captura guardada", description: "Se guardó en Descargas" })
                    }
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150 text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/15 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 font-medium">Captura</p>
                      <p className="text-[10px] text-slate-600">Screenshot de la página</p>
                    </div>
                  </button>

                  {/* Reader */}
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleToggleReader}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150 text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                      readerMode ? "bg-orange-500/15 border-orange-500/20" : "bg-violet-500/10 border-violet-500/15"
                    }`}>
                      <Sparkles className={`w-3.5 h-3.5 ${readerMode ? "text-orange-400" : "text-violet-400"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 font-medium">
                        {readerMode ? "Salir de lectura" : "Modo lectura"}
                      </p>
                      <p className="text-[10px] text-slate-600">Sin distracciones</p>
                    </div>
                  </button>

                  {/* Privacy */}
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleTogglePrivacy}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150 text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                      privacyMode ? "bg-amber-500/15 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/15"
                    }`}>
                      {privacyMode ? (
                        <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 font-medium">
                        {privacyMode ? "Modo normal" : "Modo privado"}
                      </p>
                      <p className="text-[10px] text-slate-600">
                        {privacyMode ? "Restaurar navegación" : "Sin registro"}
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Results / Suggestions */}
            <div className="p-2">
              {filterQuery && (
                <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold px-3 py-1.5">
                  Resultados
                </p>
              )}
              {!filterQuery && (
                <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold px-3 py-1.5">
                  Tendencias
                </p>
              )}

              {filteredSuggestions().map((item, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(item)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-150 text-left group"
                >
                  {/* Icon */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                      item.type === "bookmark"
                        ? "bg-cyan-500/10 border-cyan-500/15"
                        : item.type === "trending"
                        ? "bg-rose-500/10 border-rose-500/15"
                        : item.type === "suggestion"
                        ? "bg-indigo-500/10 border-indigo-500/15"
                        : "bg-white/[0.04] border-white/[0.06]"
                    }`}
                  >
                    {item.type === "bookmark" ? (
                      <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
                    ) : item.type === "trending" ? (
                      <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    ) : item.type === "suggestion" ? (
                      <Search className="w-3.5 h-3.5 text-indigo-400" />
                    ) : item.type === "history" ? (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 group-hover:text-white truncate transition-colors">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[11px] text-slate-600 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-150 flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* Footer tip */}
            <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-center gap-3 justify-center">
                <span className="flex items-center gap-1 text-[10px] text-slate-700">
                  <kbd className="px-1 py-0.5 rounded text-[9px] bg-white/[0.04] border border-white/[0.06] text-slate-500 font-mono">
                    ↵
                  </kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-700">
                  <kbd className="px-1 py-0.5 rounded text-[9px] bg-white/[0.04] border border-white/[0.06] text-slate-500 font-mono">
                    ↑↓
                  </kbd>
                  mover
                </span>
                <span className="flex items-center gap-1 text-[10px] text-slate-700">
                  <kbd className="px-1 py-0.5 rounded text-[9px] bg-white/[0.04] border border-white/[0.06] text-slate-500 font-mono">
                    Esc
                  </kbd>
                  cerrar
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Security Panel ── */}
      {showSecurityPanel && (
        <div className="absolute top-full left-0 mt-2 z-50 animate-in">
          <div className="w-80 rounded-2xl bg-[#0d1117] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-4 border-b border-white/[0.06] ${
              securityInfo.level === "secure"
                ? "bg-emerald-500/[0.04]"
                : securityInfo.level === "warning"
                ? "bg-amber-500/[0.04]"
                : "bg-red-500/[0.04]"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  securityInfo.level === "secure"
                    ? "bg-emerald-500/15 border border-emerald-500/20"
                    : securityInfo.level === "warning"
                    ? "bg-amber-500/15 border border-amber-500/20"
                    : "bg-red-500/15 border border-red-500/20"
                }`}>
                  <SecurityIcon className={`w-5 h-5 ${securityColor}`} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${
                    securityInfo.level === "secure" ? "text-emerald-400"
                    : securityInfo.level === "warning" ? "text-amber-400"
                    : "text-red-400"
                  }`}>
                    {securityInfo.level === "secure" ? "Conexión segura"
                      : securityInfo.level === "warning" ? "Precaución"
                      : "No seguro"}
                  </p>
                  <p className="text-[11px] text-slate-500">{domain}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              {/* Protocol */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">Protocolo</span>
                </div>
                <span className="text-xs text-slate-300 font-medium">
                  {securityInfo.protocol}
                </span>
              </div>

              {/* Certificate */}
              {securityInfo.certificate && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">Certificado</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium max-w-[150px] truncate">
                    {securityInfo.certificate}
                  </span>
                </div>
              )}

              {/* Trackers */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">Rastreadores</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${
                    securityInfo.trackers === 0
                      ? "text-emerald-400"
                      : securityInfo.trackers < 5
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}>
                    {securityInfo.trackers}
                  </span>
                  {securityInfo.trackers > 0 && (
                    <span className="text-[10px] text-slate-600">bloqueados</span>
                  )}
                </div>
              </div>

              {/* Cookies */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">Cookies</span>
                </div>
                <span className="text-xs text-slate-300 font-medium">
                  {securityInfo.cookies}
                </span>
              </div>

              {/* Load time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400">Carga</span>
                </div>
                <span className={`text-xs font-bold ${
                  securityInfo.loadTime < 1
                    ? "text-emerald-400"
                    : securityInfo.loadTime < 2
                    ? "text-amber-400"
                    : "text-red-400"
                }`}>
                  {securityInfo.loadTime}s
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 pt-1 flex gap-2">
              <button
                onClick={() => {
                  setShowSecurityPanel(false);
                  handleTogglePrivacy();
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-xs text-slate-300 font-medium transition-all duration-200 text-center"
              >
                Modo privado
              </button>
              <button
                onClick={() => {
                  toast({ title: "Sitio bloqueado", description: `${domain} fue bloqueado` });
                  setShowSecurityPanel(false);
                }}
                className="flex-1 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/15 hover:bg-red-500/20 text-xs text-red-400 font-medium transition-all duration-200 text-center"
              >
                Bloquear sitio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Share Menu ── */}
      {showShareMenu && (
        <div className="absolute top-full right-12 mt-2 z-50 animate-in">
          <div className="w-56 rounded-2xl bg-[#0d1117] border border-white/[0.08] shadow-2xl shadow-black/40 overflow-hidden p-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold px-2 mb-2">
              Compartir
            </p>

            <button
              onClick={() => {
                handleCopyUrl();
                setShowShareMenu(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left"
            >
              <Copy className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Copiar enlace</span>
            </button>

            <button
              onClick={() => {
                toast({ title: "🔗 QR generado", description: "Escanea el código para compartir" });
                setShowShareMenu(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left"
            >
              <QrCode className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Código QR</span>
            </button>

            <button
              onClick={() => {
                toast({ title: "📧 Compartido", description: "Enlace listo para enviar" });
                setShowShareMenu(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left"
            >
              <Share2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Enviar por email</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ Styles ═══ */}
      <style>{`
        @keyframes loadBar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(250%); }
        }
        .animate-in {
          animation: dropIn 0.2s ease-out forwards;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
