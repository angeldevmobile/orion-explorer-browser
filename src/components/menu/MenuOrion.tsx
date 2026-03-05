import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Copy,
  History,
  Download,
  Bookmark,
  Settings,
  Sparkles,
  Wand2,
  ScanLine,
  FileText,
  PenTool,
  Palette,
  Ruler,
  Code2,
  Terminal,
  Bug,
  Shield,
  ShieldCheck,
  Eye,
  Lock,
  Fingerprint,
  Trash2,
  Cookie,
  Image,
  Camera,
  Video,
  Music,
  VolumeX,
  Cast,
  MonitorPlay,
  Clock,
  ListTodo,
  StickyNote,
  Brain,
  BarChart3,
  Activity,
  Maximize2,
  Columns,
  PanelLeft,
  Layers,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Monitor,
  Share2,
  QrCode,
  Send,
  Mail,
  FileDown,
  Printer,
  HelpCircle,
  Info,
  Zap,
  Flame,
  Globe,
  Search,
  ChevronRight,
  X,
  AlertTriangle,
  Wifi,
  Smartphone,
  Keyboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMenuData } from "@/hooks/useMenuData";

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
interface BrowserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (url: string) => void;
  currentUrl: string;
  currentZoom?: number;
  onZoomChange?: (zoom: number) => void;
  onFocusChange?: (
    active: boolean,
    sites: { id: string; domain: string }[],
    timeRemaining: string
  ) => void;
}

interface MenuSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const NOTE_COLORS = [
  "from-amber-500/15 to-yellow-500/10 border-amber-500/20",
  "from-cyan-500/15 to-teal-500/10 border-cyan-500/20",
  "from-violet-500/15 to-purple-500/10 border-violet-500/20",
  "from-rose-500/15 to-pink-500/10 border-rose-500/20",
  "from-emerald-500/15 to-green-500/10 border-emerald-500/20",
];

const MENU_SECTIONS: MenuSection[] = [
  { id: "tools", label: "Herramientas", icon: <Wand2 className="w-4 h-4" /> },
  { id: "privacy", label: "Privacidad", icon: <Shield className="w-4 h-4" /> },
  { id: "workspace", label: "Espacio de trabajo", icon: <Layers className="w-4 h-4" /> },
  { id: "focus", label: "Focus Mode", icon: <Brain className="w-4 h-4" />, badge: "Nuevo", badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  { id: "notes", label: "Notas rápidas", icon: <StickyNote className="w-4 h-4" /> },
  { id: "tasks", label: "Tareas", icon: <ListTodo className="w-4 h-4" /> },
  { id: "media", label: "Media Center", icon: <MonitorPlay className="w-4 h-4" /> },
  { id: "devtools", label: "Desarrollador", icon: <Code2 className="w-4 h-4" /> },
  { id: "stats", label: "Mi actividad", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "share", label: "Compartir", icon: <Share2 className="w-4 h-4" /> },
  { id: "settings", label: "Configuración", icon: <Settings className="w-4 h-4" /> },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export const BrowserMenu = ({
  isOpen,
  onClose,
  onNavigate,
  currentUrl,
  currentZoom = 100,
  onZoomChange,
  onFocusChange,
}: BrowserMenuProps) => {
  const [activeSection, setActiveSection] = useState<string>("tools");
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [focusTimer, setFocusTimer] = useState<number | null>(null);
  const [focusElapsed, setFocusElapsed] = useState(0);
  const [focusSessionId, setFocusSessionId] = useState<string | null>(null);
  const [newBlockedSite, setNewBlockedSite] = useState("");
  const [searchMenu, setSearchMenu] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const formatTimer = (ms: number) => {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── Real data from backend via hook ──
  const {
    loading,
    notes,
    tasks,
    blockedSites,
    stats,
    prefs,
    addNote,
    deleteNote,
    addTask,
    toggleTask,
    deleteTask,
    addBlockedSite,
    removeBlockedSite,
    startFocusSession,
    endFocusSession,
    updatePreference,
  } = useMenuData(isOpen);

  // Dynamic badge for privacy section based on real stats
  const privacyBadge = stats?.trackersBlocked?.toString() || "0";
  const dynamicSections = MENU_SECTIONS.map((s) => {
    if (s.id === "privacy") {
      return { ...s, badge: privacyBadge, badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
    }
    return s;
  });

  // Focus timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (focusMode && focusTimer) {
      interval = setInterval(() => {
        setFocusElapsed((prev) => {
          if (prev + 1000 >= focusTimer) {
            setFocusMode(false);
            if (focusSessionId) {
              endFocusSession(focusSessionId, focusTimer, true);
            }
            toast({ title: "🧠 Sesión de focus terminada", description: "¡Buen trabajo! Toma un descanso." });
            return 0;
          }
          return prev + 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusMode, focusTimer, focusSessionId, endFocusSession, toast]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      setTimeout(() => document.addEventListener("mousedown", handle), 0);
    }
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, onClose]);

  // ── Notificar cambios de focus al parent ──
  useEffect(() => {
    if (onFocusChange) {
      const remaining =
        focusMode && focusTimer ? formatTimer(focusTimer - focusElapsed) : "";
      onFocusChange(focusMode, blockedSites, remaining);
    }
  }, [focusMode, focusElapsed, focusTimer, blockedSites, onFocusChange]);

  if (!isOpen) return null;

  /* ── Handlers using real API ── */
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const color = NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
      await addNote(newNote.trim(), currentUrl, color);
      setNewNote("");
      toast({ title: "Nota guardada" });
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (err: unknown) {
      toast({ title: "Error al eliminar nota", description: getErrorMessage(err) });
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      await addTask(newTask.trim());
      setNewTask("");
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      await toggleTask(id);
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleAddBlockedSite = async () => {
    const site = newBlockedSite.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!site) return;
    try {
      await addBlockedSite(site);
      setNewBlockedSite("");
      toast({ title: "Sitio bloqueado en Focus Mode", description: site });
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleRemoveBlockedSite = async (id: string) => {
    try {
      await removeBlockedSite(id);
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleStartFocus = async (minutes: number) => {
    try {
      const durationMs = minutes * 60 * 1000;
      const session = await startFocusSession(durationMs);
      setFocusMode(true);
      setFocusTimer(durationMs);
      setFocusElapsed(0);
      setFocusSessionId(session.id);
      toast({
        title: `Focus: ${minutes} minutos`,
        description: "Sitios distractores bloqueados",
      });
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleStopFocus = async () => {
    if (focusSessionId) {
      await endFocusSession(focusSessionId, focusElapsed, false).catch(() => {});
    }
    setFocusMode(false);
    setFocusElapsed(0);
    setFocusSessionId(null);
    toast({ title: "Focus mode desactivado" });
  };

  const handleUpdatePrivacyPref = async (key: string, value: boolean) => {
    try {
      await updatePreference(key, value);
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const handleThemeChange = async (themeId: string) => {
    try {
      await updatePreference("theme", themeId);
      toast({ title: `Tema: ${themeId}` });
    } catch (err: unknown) {
      toast({ title: "Error", description: getErrorMessage(err) });
    }
  };

  const completedTasks = tasks.filter((t) => t.completed).length;

  const filteredSections = searchMenu
    ? dynamicSections.filter(
        (s) =>
          s.label.toLowerCase().includes(searchMenu.toLowerCase()) ||
          s.id.toLowerCase().includes(searchMenu.toLowerCase())
      )
    : dynamicSections;

  // ── Stats from real data ──
  const todayMinutes = stats?.minutesBrowsed || 0;
  const sitesVisited = stats?.sitesVisited || 0;
  const trackersBlocked = stats?.trackersBlocked || 0;
  const dataSaved = stats ? `${(parseInt(stats.dataSavedBytes) / (1024 * 1024)).toFixed(1)} MB` : "0 MB";
  const topSite = stats?.topSites?.[0];
  const hourlyUsage = stats?.hourlyUsage || [];

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="absolute top-2 right-2 w-[720px] max-h-[calc(100vh-16px)] bg-[#0a0e17] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex animate-menu-in"
      >
        {/* ═══ LEFT SIDEBAR ═══ */}
        <div className="w-56 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
          {/* Logo & Search */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Orion</p>
                <p className="text-[10px] text-slate-600">v1.0.0</p>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <input
                type="text"
                placeholder="Buscar en menú…"
                value={searchMenu}
                onChange={(e) => setSearchMenu(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
              />
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <div className="grid grid-cols-4 gap-1.5">
              <QuickActionBtn icon={<Plus className="w-3.5 h-3.5" />} label="Pestaña" onClick={() => { toast({ title: "Nueva pestaña abierta" }); onClose(); }} />
              <QuickActionBtn icon={<History className="w-3.5 h-3.5" />} label="Historial" onClick={() => { onNavigate("orion://history"); onClose(); }} />
              <QuickActionBtn icon={<Download className="w-3.5 h-3.5" />} label="Descargas" onClick={() => { onNavigate("orion://downloads"); onClose(); }} />
              <QuickActionBtn icon={<Bookmark className="w-3.5 h-3.5" />} label="Favoritos" onClick={() => { onNavigate("orion://bookmarks"); onClose(); }} />
            </div>
          </div>

          {/* Section List */}
          <div className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 mb-0.5 group
                  ${activeSection === section.id
                    ? "bg-cyan-500/10 border border-cyan-500/15 text-cyan-400"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent"
                  }
                `}
              >
                <span className={`flex-shrink-0 transition-colors ${
                  activeSection === section.id ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                }`}>
                  {section.icon}
                </span>
                <span className="text-xs font-medium flex-1 truncate">{section.label}</span>
                {section.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${section.badgeColor}`}>
                    {section.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Focus mode mini status */}
          {focusMode && (
            <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/15">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Focus activo</span>
              </div>
              <p className="text-lg font-mono font-bold text-white">
                {formatTimer(focusTimer! - focusElapsed)}
              </p>
              <button
                onClick={handleStopFocus}
                className="text-[10px] text-violet-400/60 hover:text-violet-400 mt-1 transition-colors"
              >
                Detener
              </button>
            </div>
          )}

          {/* Bottom info */}
          <div className="p-3 border-t border-white/[0.06]">
            <button
              onClick={() => { onNavigate("orion://help"); onClose(); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/[0.04] text-slate-600 hover:text-slate-300 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="text-xs">Ayuda y feedback</span>
            </button>
          </div>
        </div>

        {/* ═══ RIGHT CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
          )}

          {/* ── TOOLS ── */}
          {!loading && activeSection === "tools" && (
            <MenuContent title="Herramientas" subtitle="Potencia tu navegación">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard icon={<Camera className="w-5 h-5 text-sky-400" />} title="Captura de pantalla" desc="Capturar página completa o zona" accent="sky" onClick={() => { toast({ title: "Modo captura activado", description: "Selecciona el área" }); onClose(); }} />
                <ToolCard icon={<Sparkles className="w-5 h-5 text-violet-400" />} title="Modo lectura" desc="Leer sin distracciones" accent="violet" onClick={() => { toast({ title: "Modo lectura activado" }); onClose(); }} />
                <ToolCard icon={<Palette className="w-5 h-5 text-rose-400" />} title="Color Picker" desc="Extraer colores de la página" accent="rose" onClick={() => { toast({ title: "Color picker activado", description: "Click en cualquier elemento" }); onClose(); }} />
                <ToolCard icon={<Ruler className="w-5 h-5 text-amber-400" />} title="Medidor de página" desc="Medir distancias en la web" accent="amber" onClick={() => { toast({ title: "Modo medición activado" }); onClose(); }} />
                <ToolCard icon={<ScanLine className="w-5 h-5 text-emerald-400" />} title="Texto de imagen (OCR)" desc="Extraer texto de imágenes" accent="emerald" onClick={() => { toast({ title: "OCR activado", description: "Selecciona una imagen" }); onClose(); }} />
                <ToolCard icon={<FileText className="w-5 h-5 text-cyan-400" />} title="Guardar como PDF" desc="Exportar página a PDF" accent="cyan" onClick={() => { toast({ title: "Generando PDF…" }); onClose(); }} />
                <ToolCard icon={<PenTool className="w-5 h-5 text-orange-400" />} title="Anotar en página" desc="Dibujar y subrayar contenido" accent="orange" onClick={() => { toast({ title: "Modo anotación activado" }); onClose(); }} />
                <ToolCard icon={<Globe className="w-5 h-5 text-indigo-400" />} title="Traducir página" desc="Traducción automática completa" accent="indigo" onClick={() => { toast({ title: "Traduciendo página…" }); onClose(); }} />
              </div>

              {/* Zoom control */}
              <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-bold text-slate-300 mb-3">Zoom de página</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => onZoomChange?.(Math.max(50, currentZoom - 10))} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] relative">
                    <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-200" style={{ width: `${((currentZoom - 50) / 150) * 100}%` }} />
                  </div>
                  <button onClick={() => onZoomChange?.(Math.min(200, currentZoom + 10))} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button onClick={() => onZoomChange?.(100)} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 font-mono font-bold hover:bg-white/[0.08] transition-all min-w-[48px] text-center">
                    {currentZoom}%
                  </button>
                </div>
              </div>
            </MenuContent>
          )}

          {/* ── PRIVACY ── */}
          {!loading && activeSection === "privacy" && (
            <MenuContent title="Privacidad & Seguridad" subtitle="Tu datos, tu control">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-500/10 border border-emerald-500/15 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Protección activa</p>
                    <p className="text-[11px] text-slate-500">{trackersBlocked} rastreadores bloqueados hoy</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Trackers" value={trackersBlocked.toString()} color="emerald" />
                  <MiniStat label="Cookies" value="89" color="amber" />
                  <MiniStat label="Datos ahorrados" value={dataSaved} color="cyan" />
                </div>
              </div>

              <div className="space-y-2">
                <PrivacyToggle icon={<Eye className="w-4 h-4" />} title="Bloquear rastreadores" desc="Evita que los sitios te sigan" initialOn={prefs?.blockTrackers ?? true} onChange={(on) => handleUpdatePrivacyPref("blockTrackers", on)} />
                <PrivacyToggle icon={<Cookie className="w-4 h-4" />} title="Bloquear cookies de terceros" desc="Solo cookies del sitio actual" initialOn={prefs?.blockThirdPartyCookies ?? true} onChange={(on) => handleUpdatePrivacyPref("blockThirdPartyCookies", on)} />
                <PrivacyToggle icon={<Fingerprint className="w-4 h-4" />} title="Anti-fingerprinting" desc="Evita la identificación por huella digital" initialOn={prefs?.antiFingerprint ?? true} onChange={(on) => handleUpdatePrivacyPref("antiFingerprint", on)} />
                <PrivacyToggle icon={<Lock className="w-4 h-4" />} title="Forzar HTTPS" desc="Conexiones siempre cifradas" initialOn={prefs?.forceHttps ?? true} onChange={(on) => handleUpdatePrivacyPref("forceHttps", on)} />
                <PrivacyToggle icon={<AlertTriangle className="w-4 h-4" />} title="Bloquear scripts de minería" desc="Prevenir cryptojacking" initialOn={prefs?.blockMining ?? true} onChange={(on) => handleUpdatePrivacyPref("blockMining", on)} />
              </div>

              <div className="mt-4 p-4 rounded-xl bg-red-500/[0.04] border border-red-500/10">
                <button onClick={() => toast({ title: "🗑️ Datos de navegación eliminados" })} className="flex items-center gap-3 w-full text-left group">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center group-hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400">Limpiar datos de navegación</p>
                    <p className="text-[11px] text-slate-600">Historial, cookies, caché, contraseñas</p>
                  </div>
                </button>
              </div>
            </MenuContent>
          )}

          {/* ── WORKSPACE ── */}
          {!loading && activeSection === "workspace" && (
            <MenuContent title="Espacio de trabajo" subtitle="Organiza tu pantalla">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard icon={<Columns className="w-5 h-5 text-cyan-400" />} title="Vista dividida" desc="Dos páginas lado a lado" accent="cyan" onClick={() => { toast({ title: "Vista dividida activada" }); onClose(); }} />
                <ToolCard icon={<PanelLeft className="w-5 h-5 text-violet-400" />} title="Panel lateral" desc="Panel con segunda página" accent="violet" onClick={() => { toast({ title: "Panel lateral abierto" }); onClose(); }} />
                <ToolCard icon={<Maximize2 className="w-5 h-5 text-amber-400" />} title="Pantalla completa" desc="Ocultar todo el UI" accent="amber" onClick={() => { document.documentElement.requestFullscreen?.(); onClose(); }} />
                <ToolCard icon={<Layers className="w-5 h-5 text-emerald-400" />} title="Grupos de pestañas" desc="Organizar pestañas por tema" accent="emerald" onClick={() => toast({ title: "Gestor de grupos abierto" })} />
              </div>

              {/* Theme selector */}
              <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-bold text-slate-300 mb-3">Tema de colores</p>
                <div className="flex gap-2">
                  {[
                    { id: "dark", icon: <Moon className="w-4 h-4" />, label: "Oscuro" },
                    { id: "light", icon: <Sun className="w-4 h-4" />, label: "Claro" },
                    { id: "system", icon: <Monitor className="w-4 h-4" />, label: "Sistema" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                        prefs?.theme === t.id
                          ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                          : "bg-white/[0.02] border-white/[0.06] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
                      }`}
                    >
                      {t.icon}
                      <span className="text-[10px] font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </MenuContent>
          )}

          {/* ── FOCUS MODE ── */}
          {!loading && activeSection === "focus" && (
            <MenuContent title="Focus Mode" subtitle="Concentración sin distracciones">
              {!focusMode ? (
                <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-indigo-500/10 border border-violet-500/15 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-8 h-8 text-violet-400" />
                    <div>
                      <p className="text-base font-bold text-white">Iniciar sesión de focus</p>
                      <p className="text-xs text-slate-500">Bloquea sitios distractores y cuenta tu tiempo</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[15, 25, 45, 60].map((min) => (
                      <button
                        key={min}
                        onClick={() => handleStartFocus(min)}
                        className="py-3 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-300 font-bold text-sm hover:bg-violet-500/25 transition-all"
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-indigo-500/15 border border-violet-500/20 mb-4 text-center">
                  <Brain className="w-10 h-10 text-violet-400 mx-auto mb-3" />
                  <p className="text-3xl font-mono font-bold text-white mb-1">
                    {formatTimer(focusTimer! - focusElapsed)}
                  </p>
                  <p className="text-xs text-violet-400/60 mb-4">Focus en progreso</p>
                  <button onClick={handleStopFocus} className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/15 text-xs text-red-400 hover:bg-red-500/20 transition-all">
                    Detener sesión
                  </button>
                </div>
              )}

              {/* Blocked sites management */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-bold text-slate-300 mb-3">Sitios bloqueados durante focus</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Agregar sitio (ej: twitter.com)"
                    value={newBlockedSite}
                    onChange={(e) => setNewBlockedSite(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBlockedSite()}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/30"
                  />
                  <button onClick={handleAddBlockedSite} className="px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/20 text-xs text-violet-400 font-medium hover:bg-violet-500/25 transition-all">
                    Agregar
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {blockedSites.map((site) => (
                    <div key={site.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] group">
                      <span className="text-xs text-slate-400">{site.domain}</span>
                      <button onClick={() => handleRemoveBlockedSite(site.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </MenuContent>
          )}

          {/* ── NOTES ── */}
          {!loading && activeSection === "notes" && (
            <MenuContent title="Notas rápidas" subtitle="Guarda ideas mientras navegas">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Escribe una nota…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/30"
                />
                <button onClick={handleAddNote} className="px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/20 text-sm text-amber-400 font-medium hover:bg-amber-500/25 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {notes.length === 0 ? (
                <EmptyState icon={<StickyNote className="w-8 h-8" />} text="No tienes notas aún" />
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {notes.map((note) => (
                    <div key={note.id} className={`p-3 rounded-xl bg-gradient-to-br border group transition-all duration-200 hover:scale-[1.01] ${note.color || NOTE_COLORS[0]}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm text-slate-300 leading-relaxed">{note.text}</p>
                        <button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all flex-shrink-0 mt-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-slate-600" />
                        <span className="text-[10px] text-slate-600 truncate max-w-[200px]">
                          {note.url.replace(/^https?:\/\//, "").split("/")[0]}
                        </span>
                        <span className="text-[10px] text-slate-700">•</span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(note.createdAt).toLocaleString("es-ES", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </MenuContent>
          )}

          {/* ── TASKS ── */}
          {!loading && activeSection === "tasks" && (
            <MenuContent
              title="Tareas"
              subtitle={tasks.length > 0 ? `${completedTasks}/${tasks.length} completadas` : "Organiza tu pendiente"}
            >
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nueva tarea…"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                />
                <button onClick={handleAddTask} className="px-4 py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-sm text-cyan-400 font-medium hover:bg-cyan-500/25 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {tasks.length > 0 && (
                <div className="mb-4">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${(completedTasks / tasks.length) * 100}%` }} />
                  </div>
                </div>
              )}

              {tasks.length === 0 ? (
                <EmptyState icon={<ListTodo className="w-8 h-8" />} text="No tienes tareas pendientes" />
              ) : (
                <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group ${
                        task.completed
                          ? "bg-emerald-500/[0.03] border-emerald-500/10"
                          : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]"
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                          task.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-cyan-500"
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm transition-all ${task.completed ? "text-slate-600 line-through" : "text-slate-300"}`}>
                        {task.text}
                      </span>
                      <button onClick={() => handleDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </MenuContent>
          )}

          {/* ── MEDIA CENTER ── */}
          {!loading && activeSection === "media" && (
            <MenuContent title="Media Center" subtitle="Control multimedia">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard icon={<Video className="w-5 h-5 text-red-400" />} title="Picture in Picture" desc="Video flotante mientras navegas" accent="red" onClick={() => { toast({ title: "PiP activado" }); onClose(); }} />
                <ToolCard icon={<VolumeX className="w-5 h-5 text-amber-400" />} title="Silenciar pestaña" desc="Silenciar audio de esta página" accent="amber" onClick={() => { toast({ title: "Pestaña silenciada" }); onClose(); }} />
                <ToolCard icon={<Cast className="w-5 h-5 text-indigo-400" />} title="Enviar a dispositivo" desc="Chromecast, TV u otro equipo" accent="indigo" onClick={() => toast({ title: "📺 Buscando dispositivos…" })} />
                <ToolCard icon={<Image className="w-5 h-5 text-emerald-400" />} title="Galería de medios" desc="Ver todas las imágenes/videos" accent="emerald" onClick={() => toast({ title: "Galería abierta" })} />
                <ToolCard icon={<Music className="w-5 h-5 text-pink-400" />} title="Detectar canción" desc="Identifica la música que suena" accent="pink" onClick={() => toast({ title: "Escuchando…", description: "Identificando canción" })} />
                <ToolCard icon={<Download className="w-5 h-5 text-sky-400" />} title="Descargar medios" desc="Descargar videos e imágenes" accent="sky" onClick={() => toast({ title: "Analizando medios disponibles…" })} />
              </div>
            </MenuContent>
          )}

          {/* ── DEVTOOLS ── */}
          {!loading && activeSection === "devtools" && (
            <MenuContent title="Desarrollador" subtitle="Para creadores de la web">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard icon={<Code2 className="w-5 h-5 text-emerald-400" />} title="Inspector" desc="Examinar elementos y CSS" accent="emerald" onClick={() => { toast({ title: "Inspector abierto" }); onClose(); }} />
                <ToolCard icon={<Terminal className="w-5 h-5 text-slate-300" />} title="Consola" desc="JavaScript console" accent="slate" onClick={() => { toast({ title: "Consola abierta" }); onClose(); }} />
                <ToolCard icon={<Wifi className="w-5 h-5 text-cyan-400" />} title="Red" desc="Monitor de peticiones HTTP" accent="cyan" onClick={() => toast({ title: "Network monitor abierto" })} />
                <ToolCard icon={<Bug className="w-5 h-5 text-red-400" />} title="Debugger" desc="Depurador JavaScript" accent="red" onClick={() => toast({ title: "Debugger abierto" })} />
                <ToolCard icon={<Activity className="w-5 h-5 text-violet-400" />} title="Performance" desc="Perfilar rendimiento" accent="violet" onClick={() => toast({ title: "Performance profiler abierto" })} />
                <ToolCard icon={<Smartphone className="w-5 h-5 text-amber-400" />} title="Vista responsiva" desc="Simular dispositivos móviles" accent="amber" onClick={() => { toast({ title: "Vista responsiva activada" }); onClose(); }} />
              </div>

              <button
                onClick={() => { onNavigate(`view-source:${currentUrl}`); onClose(); }}
                className="mt-4 w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-left group"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">Ver código fuente</p>
                  <p className="text-[11px] text-slate-600">HTML de la página actual</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 ml-auto group-hover:text-slate-400 transition-colors" />
              </button>
            </MenuContent>
          )}

          {/* ── STATS ── */}
          {!loading && activeSection === "stats" && (
            <MenuContent title="Mi actividad" subtitle="Resumen de hoy">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard icon={<Clock className="w-5 h-5 text-cyan-400" />} label="Tiempo navegando" value={`${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`} accent="cyan" />
                <StatCard icon={<Globe className="w-5 h-5 text-violet-400" />} label="Sitios visitados" value={sitesVisited.toString()} accent="violet" />
                <StatCard icon={<Flame className="w-5 h-5 text-orange-400" />} label="Sitio más visitado" value={topSite?.domain || "—"} subtitle={topSite ? `${topSite.minutes}m` : undefined} accent="orange" />
                <StatCard icon={<Shield className="w-5 h-5 text-emerald-400" />} label="Trackers bloqueados" value={trackersBlocked.toString()} accent="emerald" />
              </div>

              {/* Usage by hour chart */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-bold text-slate-300 mb-4">Uso por hora</p>
                <div className="flex items-end gap-1 h-24">
                  {(hourlyUsage.length > 0
                    ? hourlyUsage
                    : Array.from({ length: 24 }, (_, i) => ({ hour: i, percentage: 0 }))
                  ).map((h) => {
                    const current = new Date().getHours() === h.hour;
                    return (
                      <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-sm transition-all duration-300 ${
                            current
                              ? "bg-gradient-to-t from-cyan-500 to-teal-400"
                              : "bg-white/[0.08] hover:bg-white/[0.15]"
                          }`}
                          style={{ height: `${h.percentage}%` }}
                          title={`${h.hour}:00 - ${h.percentage}%`}
                        />
                        {h.hour % 6 === 0 && (
                          <span className="text-[8px] text-slate-700">{h.hour}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </MenuContent>
          )}

          {/* ── SHARE ── */}
          {!loading && activeSection === "share" && (
            <MenuContent title="Compartir" subtitle="Enviar esta página">
              <div className="space-y-2">
                <ShareOption icon={<Copy className="w-4 h-4 text-slate-300" />} title="Copiar enlace" desc={currentUrl.replace(/^https?:\/\//, "").substring(0, 40)} onClick={() => { navigator.clipboard.writeText(currentUrl); toast({ title: "📋 URL copiada" }); }} />
                <ShareOption icon={<QrCode className="w-4 h-4 text-violet-400" />} title="Código QR" desc="Genera un QR para compartir" onClick={() => toast({ title: "🔲 QR generado" })} />
                <ShareOption icon={<Mail className="w-4 h-4 text-sky-400" />} title="Enviar por email" desc="Abrir en tu cliente de correo" onClick={() => { window.open(`mailto:?subject=Mira%20esto&body=${currentUrl}`); onClose(); }} />
                <ShareOption icon={<Send className="w-4 h-4 text-emerald-400" />} title="Enviar a mi teléfono" desc="Continuar en otro dispositivo" onClick={() => toast({ title: "Enlace enviado a tu teléfono" })} />
                <ShareOption icon={<FileDown className="w-4 h-4 text-amber-400" />} title="Guardar página completa" desc="Descargar como archivo HTML" onClick={() => toast({ title: "Página guardada" })} />
                <ShareOption icon={<Printer className="w-4 h-4 text-slate-400" />} title="Imprimir" desc="Enviar a impresora" onClick={() => { window.print(); onClose(); }} />
              </div>
            </MenuContent>
          )}

          {/* ── SETTINGS ── */}
          {!loading && activeSection === "settings" && (
            <MenuContent title="Configuración" subtitle="Personaliza Orion">
              <div className="space-y-2">
                <SettingsLink icon={<Settings className="w-4 h-4 text-slate-300" />} title="Configuración general" onClick={() => { onNavigate("orion://settings"); onClose(); }} />
                <SettingsLink icon={<Keyboard className="w-4 h-4 text-cyan-400" />} title="Atajos de teclado" onClick={() => { onNavigate("orion://settings/shortcuts"); onClose(); }} />
                <SettingsLink icon={<Palette className="w-4 h-4 text-violet-400" />} title="Apariencia y temas" onClick={() => { onNavigate("orion://settings/appearance"); onClose(); }} />
                <SettingsLink icon={<Shield className="w-4 h-4 text-emerald-400" />} title="Privacidad y seguridad" onClick={() => { onNavigate("orion://settings/privacy"); onClose(); }} />
                <SettingsLink icon={<Globe className="w-4 h-4 text-amber-400" />} title="Motor de búsqueda" onClick={() => { onNavigate("orion://settings/search"); onClose(); }} />
                <SettingsLink icon={<Download className="w-4 h-4 text-sky-400" />} title="Descargas" onClick={() => { onNavigate("orion://settings/downloads"); onClose(); }} />
                <SettingsLink icon={<Smartphone className="w-4 h-4 text-rose-400" />} title="Sincronización" onClick={() => { onNavigate("orion://settings/sync"); onClose(); }} />
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <SettingsLink icon={<Info className="w-4 h-4 text-slate-500" />} title="Acerca de Orion" onClick={() => { onNavigate("orion://about"); onClose(); }} />
                </div>
              </div>
            </MenuContent>
          )}
        </div>
      </div>

      <style>{`
        @keyframes menu-in {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-menu-in {
          animation: menu-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════ */

function MenuContent({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function QuickActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all text-slate-500 hover:text-slate-200 group">
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function ToolCard({ icon, title, desc, accent, onClick }: { icon: React.ReactNode; title: string; desc: string; accent: string; onClick: () => void }) {
  const borderColors: Record<string, string> = {
    sky: "hover:border-sky-500/20", violet: "hover:border-violet-500/20", rose: "hover:border-rose-500/20",
    amber: "hover:border-amber-500/20", emerald: "hover:border-emerald-500/20", cyan: "hover:border-cyan-500/20",
    orange: "hover:border-orange-500/20", indigo: "hover:border-indigo-500/20", red: "hover:border-red-500/20",
    pink: "hover:border-pink-500/20", slate: "hover:border-slate-500/20",
  };
  return (
    <button onClick={onClick} className={`flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] ${borderColors[accent] || ""} transition-all duration-200 text-left group`}>
      <div className="mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{title}</p>
        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = { emerald: "text-emerald-400", amber: "text-amber-400", cyan: "text-cyan-400" };
  return (
    <div className="text-center">
      <p className={`text-sm font-bold ${colors[color] || "text-slate-300"}`}>{value}</p>
      <p className="text-[10px] text-slate-600">{label}</p>
    </div>
  );
}

function PrivacyToggle({ icon, title, desc, initialOn = false, onChange }: { icon: React.ReactNode; title: string; desc: string; initialOn?: boolean; onChange?: (on: boolean) => void }) {
  const [on, setOn] = useState(initialOn);

  useEffect(() => {
    setOn(initialOn);
  }, [initialOn]);

  const handleToggle = () => {
    const newVal = !on;
    setOn(newVal);
    onChange?.(newVal);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <span className="text-slate-500 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{title}</p>
        <p className="text-[10px] text-slate-600">{desc}</p>
      </div>
      <button
        onClick={handleToggle}
        className={`w-10 rounded-full transition-all duration-300 flex-shrink-0 relative ${on ? "bg-emerald-500" : "bg-white/[0.1]"}`}
        style={{ height: 22 }}
      >
        <div
          className={`absolute rounded-full bg-white shadow-sm transition-all duration-300 ${on ? "left-[calc(100%-20px)]" : "left-0.5"}`}
          style={{ width: 18, height: 18, top: 2 }}
        />
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, accent }: { icon: React.ReactNode; label: string; value: string; subtitle?: string; accent: string }) {
  const bgColors: Record<string, string> = {
    cyan: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/15",
    violet: "from-violet-500/10 to-violet-500/5 border-violet-500/15",
    orange: "from-orange-500/10 to-orange-500/5 border-orange-500/15",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/15",
  };
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br border ${bgColors[accent] || ""}`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-lg font-bold text-white">{value}</p>
      {subtitle && <p className="text-[10px] text-slate-500">{subtitle}</p>}
      <p className="text-[11px] text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function ShareOption({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 text-left group">
      <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">{title}</p>
        <p className="text-[11px] text-slate-600 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </button>
  );
}

function SettingsLink({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 text-left group">
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">{title}</span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
    </button>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-700">
      {icon}
      <p className="text-sm mt-3">{text}</p>
    </div>
  );
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}