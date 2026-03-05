import { useState, useEffect, useRef } from "react";
import {
  // Navigation & Core
  Plus,
  Copy,
  Scissors,
  ClipboardPaste,
  History,
  Download,
  Bookmark,
  Settings,
  // Tools
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
  // Privacy & Security
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Fingerprint,
  Trash2,
  Cookie,
  // Media & Content
  Image,
  Camera,
  Video,
  Music,
  Volume2,
  VolumeX,
  Cast,
  MonitorPlay,
  // Productivity
  Timer,
  Clock,
  CalendarDays,
  ListTodo,
  StickyNote,
  Brain,
  BarChart3,
  Activity,
  Target,
  // Layout & View
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  Columns,
  PanelLeft,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  // Share & Social
  Share2,
  QrCode,
  Send,
  Mail,
  Link2,
  ExternalLink,
  // Files
  FolderOpen,
  Save,
  Printer,
  FileDown,
  FileUp,
  // Misc
  HelpCircle,
  Info,
  MessageSquare,
  Heart,
  Zap,
  Flame,
  Globe,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  AlertTriangle,
  Wifi,
  WifiOff,
  Smartphone,
  Laptop,
  Keyboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

interface MenuSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

/* ═══════════════════════════════════════════
   FOCUS STATS (mock — replace with real data)
   ═══════════════════════════════════════════ */
interface FocusStats {
  todayMinutes: number;
  sitesVisited: number;
  topSite: string;
  topSiteMinutes: number;
  trackersBlocked: number;
  dataSaved: string;
}

const MOCK_STATS: FocusStats = {
  todayMinutes: 127,
  sitesVisited: 34,
  topSite: "github.com",
  topSiteMinutes: 42,
  trackersBlocked: 243,
  dataSaved: "18.4 MB",
};

/* ═══════════════════════════════════════════
   NOTES (persisted in localStorage)
   ═══════════════════════════════════════════ */
interface QuickNote {
  id: string;
  text: string;
  url: string;
  timestamp: number;
  color: string;
}

const NOTE_COLORS = [
  "from-amber-500/15 to-yellow-500/10 border-amber-500/20",
  "from-cyan-500/15 to-teal-500/10 border-cyan-500/20",
  "from-violet-500/15 to-purple-500/10 border-violet-500/20",
  "from-rose-500/15 to-pink-500/10 border-rose-500/20",
  "from-emerald-500/15 to-green-500/10 border-emerald-500/20",
];

/* ═══════════════════════════════════════════
   TASK TYPES
   ═══════════════════════════════════════════ */
interface QuickTask {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
}

/* ═══════════════════════════════════════════
   MENU SECTIONS CONFIG
   ═══════════════════════════════════════════ */
const MENU_SECTIONS: MenuSection[] = [
  { id: "tools", label: "Herramientas", icon: <Wand2 className="w-4 h-4" /> },
  { id: "privacy", label: "Privacidad", icon: <Shield className="w-4 h-4" />, badge: "243", badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
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
}: BrowserMenuProps) => {
  const [activeSection, setActiveSection] = useState<string>("tools");
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [tasks, setTasks] = useState<QuickTask[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [focusTimer, setFocusTimer] = useState<number | null>(null);
  const [focusElapsed, setFocusElapsed] = useState(0);
  const [blockedSites, setBlockedSites] = useState<string[]>(["twitter.com", "reddit.com", "instagram.com"]);
  const [newBlockedSite, setNewBlockedSite] = useState("");
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [searchMenu, setSearchMenu] = useState("");

  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load notes & tasks from localStorage
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem("orion-quick-notes");
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      const savedTasks = localStorage.getItem("orion-quick-tasks");
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      const savedBlocked = localStorage.getItem("orion-blocked-sites");
      if (savedBlocked) setBlockedSites(JSON.parse(savedBlocked));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save notes
  useEffect(() => {
    localStorage.setItem("orion-quick-notes", JSON.stringify(notes));
  }, [notes]);

  // Save tasks
  useEffect(() => {
    localStorage.setItem("orion-quick-tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Save blocked sites
  useEffect(() => {
    localStorage.setItem("orion-blocked-sites", JSON.stringify(blockedSites));
  }, [blockedSites]);

  // Focus timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (focusMode && focusTimer) {
      interval = setInterval(() => {
        setFocusElapsed((prev) => {
          if (prev + 1000 >= focusTimer) {
            setFocusMode(false);
            toast({ title: "🧠 Sesión de focus terminada", description: "¡Buen trabajo! Toma un descanso." });
            return 0;
          }
          return prev + 1000;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusMode, focusTimer, toast]);

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

  if (!isOpen) return null;

  /* ── Helpers ── */
  const addNote = () => {
    if (!newNote.trim()) return;
    const note: QuickNote = {
      id: Date.now().toString(),
      text: newNote.trim(),
      url: currentUrl,
      timestamp: Date.now(),
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    };
    setNotes([note, ...notes]);
    setNewNote("");
    toast({ title: "Nota guardada" });
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: QuickTask = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      timestamp: Date.now(),
    };
    setTasks([task, ...tasks]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const addBlockedSite = () => {
    const site = newBlockedSite.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!site || blockedSites.includes(site)) return;
    setBlockedSites([...blockedSites, site]);
    setNewBlockedSite("");
    toast({ title: "Sitio bloqueado en Focus Mode", description: site });
  };

  const removeBlockedSite = (site: string) => {
    setBlockedSites(blockedSites.filter((s) => s !== site));
  };

  const formatTimer = (ms: number) => {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const completedTasks = tasks.filter((t) => t.completed).length;

  // Filter sections by search
  const filteredSections = searchMenu
    ? MENU_SECTIONS.filter(
        (s) =>
          s.label.toLowerCase().includes(searchMenu.toLowerCase()) ||
          s.id.toLowerCase().includes(searchMenu.toLowerCase())
      )
    : MENU_SECTIONS;

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

            {/* Search within menu */}
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
              <QuickActionBtn
                icon={<Plus className="w-3.5 h-3.5" />}
                label="Pestaña"
                onClick={() => { toast({ title: "Nueva pestaña abierta" }); onClose(); }}
              />
              <QuickActionBtn
                icon={<History className="w-3.5 h-3.5" />}
                label="Historial"
                onClick={() => { onNavigate("orion://history"); onClose(); }}
              />
              <QuickActionBtn
                icon={<Download className="w-3.5 h-3.5" />}
                label="Descargas"
                onClick={() => { onNavigate("orion://downloads"); onClose(); }}
              />
              <QuickActionBtn
                icon={<Bookmark className="w-3.5 h-3.5" />}
                label="Favoritos"
                onClick={() => { onNavigate("orion://bookmarks"); onClose(); }}
              />
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
                onClick={() => {
                  setFocusMode(false);
                  setFocusElapsed(0);
                  toast({ title: "Focus mode desactivado" });
                }}
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
          {/* ── TOOLS ── */}
          {activeSection === "tools" && (
            <MenuContent title="Herramientas" subtitle="Potencia tu navegación">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard
                  icon={<Camera className="w-5 h-5 text-sky-400" />}
                  title="Captura de pantalla"
                  desc="Capturar página completa o zona"
                  accent="sky"
                  onClick={() => {
                    toast({ title: "Modo captura activado", description: "Selecciona el área" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Sparkles className="w-5 h-5 text-violet-400" />}
                  title="Modo lectura"
                  desc="Leer sin distracciones"
                  accent="violet"
                  onClick={() => {
                    toast({ title: "Modo lectura activado" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Palette className="w-5 h-5 text-rose-400" />}
                  title="Color Picker"
                  desc="Extraer colores de la página"
                  accent="rose"
                  onClick={() => {
                    toast({ title: "Color picker activado", description: "Click en cualquier elemento" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Ruler className="w-5 h-5 text-amber-400" />}
                  title="Medidor de página"
                  desc="Medir distancias en la web"
                  accent="amber"
                  onClick={() => {
                    toast({ title: "Modo medición activado" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<ScanLine className="w-5 h-5 text-emerald-400" />}
                  title="Texto de imagen (OCR)"
                  desc="Extraer texto de imágenes"
                  accent="emerald"
                  onClick={() => {
                    toast({ title: "OCR activado", description: "Selecciona una imagen" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<FileText className="w-5 h-5 text-cyan-400" />}
                  title="Guardar como PDF"
                  desc="Exportar página a PDF"
                  accent="cyan"
                  onClick={() => {
                    toast({ title: "Generando PDF…" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<PenTool className="w-5 h-5 text-orange-400" />}
                  title="Anotar en página"
                  desc="Dibujar y subrayar contenido"
                  accent="orange"
                  onClick={() => {
                    toast({ title: "Modo anotación activado" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Globe className="w-5 h-5 text-indigo-400" />}
                  title="Traducir página"
                  desc="Traducción automática completa"
                  accent="indigo"
                  onClick={() => {
                    toast({ title: "Traduciendo página…" });
                    onClose();
                  }}
                />
              </div>

              {/* Zoom control */}
              <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-bold text-slate-300 mb-3">Zoom de página</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onZoomChange?.(Math.max(50, currentZoom - 10))}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] relative">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-200"
                      style={{ width: `${((currentZoom - 50) / 150) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => onZoomChange?.(Math.min(200, currentZoom + 10))}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onZoomChange?.(100)}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 font-mono font-bold hover:bg-white/[0.08] transition-all min-w-[48px] text-center"
                  >
                    {currentZoom}%
                  </button>
                </div>
              </div>
            </MenuContent>
          )}

          {/* ── PRIVACY ── */}
          {activeSection === "privacy" && (
            <MenuContent title="Privacidad & Seguridad" subtitle="Tu datos, tu control">
              {/* Status card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-emerald-500/10 border border-emerald-500/15 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Protección activa</p>
                    <p className="text-[11px] text-slate-500">
                      {MOCK_STATS.trackersBlocked} rastreadores bloqueados hoy
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MiniStat label="Trackers" value={MOCK_STATS.trackersBlocked.toString()} color="emerald" />
                  <MiniStat label="Cookies" value="89" color="amber" />
                  <MiniStat label="Datos ahorrados" value={MOCK_STATS.dataSaved} color="cyan" />
                </div>
              </div>

              <div className="space-y-2">
                <PrivacyToggle
                  icon={<Eye className="w-4 h-4" />}
                  title="Bloquear rastreadores"
                  desc="Evita que los sitios te sigan"
                  defaultOn
                />
                <PrivacyToggle
                  icon={<Cookie className="w-4 h-4" />}
                  title="Bloquear cookies de terceros"
                  desc="Solo cookies del sitio actual"
                  defaultOn
                />
                <PrivacyToggle
                  icon={<Fingerprint className="w-4 h-4" />}
                  title="Anti-fingerprinting"
                  desc="Evita la identificación por huella digital"
                  defaultOn
                />
                <PrivacyToggle
                  icon={<Lock className="w-4 h-4" />}
                  title="Forzar HTTPS"
                  desc="Conexiones siempre cifradas"
                  defaultOn
                />
                <PrivacyToggle
                  icon={<AlertTriangle className="w-4 h-4" />}
                  title="Bloquear scripts de minería"
                  desc="Prevenir cryptojacking"
                  defaultOn
                />
              </div>

              {/* Clear data */}
              <div className="mt-4 p-4 rounded-xl bg-red-500/[0.04] border border-red-500/10">
                <button
                  onClick={() => {
                    toast({ title: "🗑️ Datos de navegación eliminados" });
                  }}
                  className="flex items-center gap-3 w-full text-left group"
                >
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
          {activeSection === "workspace" && (
            <MenuContent title="Espacio de trabajo" subtitle="Organiza tu pantalla">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard
                  icon={<Columns className="w-5 h-5 text-cyan-400" />}
                  title="Vista dividida"
                  desc="Dos páginas lado a lado"
                  accent="cyan"
                  onClick={() => {
                    toast({ title: "Vista dividida activada" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<PanelLeft className="w-5 h-5 text-violet-400" />}
                  title="Panel lateral"
                  desc="Panel con segunda página"
                  accent="violet"
                  onClick={() => {
                    toast({ title: "Panel lateral abierto" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Maximize2 className="w-5 h-5 text-amber-400" />}
                  title="Pantalla completa"
                  desc="Ocultar todo el UI"
                  accent="amber"
                  onClick={() => {
                    document.documentElement.requestFullscreen?.();
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Layers className="w-5 h-5 text-emerald-400" />}
                  title="Grupos de pestañas"
                  desc="Organizar pestañas por tema"
                  accent="emerald"
                  onClick={() => {
                    toast({ title: "Gestor de grupos abierto" });
                  }}
                />
              </div>

              {/* Theme selector */}
              <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-bold text-slate-300 mb-3">Tema de colores</p>
                <div className="flex gap-2">
                  {[
                    { id: "dark" as const, icon: <Moon className="w-4 h-4" />, label: "Oscuro" },
                    { id: "light" as const, icon: <Sun className="w-4 h-4" />, label: "Claro" },
                    { id: "system" as const, icon: <Monitor className="w-4 h-4" />, label: "Sistema" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        toast({ title: `Tema: ${t.label}` });
                      }}
                      className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200 ${
                        theme === t.id
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
          {activeSection === "focus" && (
            <MenuContent title="Focus Mode" subtitle="Concentración sin distracciones">
              {/* Timer start */}
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
                        onClick={() => {
                          setFocusMode(true);
                          setFocusTimer(min * 60 * 1000);
                          setFocusElapsed(0);
                          toast({
                            title: `Focus: ${min} minutos`,
                            description: "Sitios distractores bloqueados",
                          });
                        }}
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
                  <button
                    onClick={() => {
                      setFocusMode(false);
                      setFocusElapsed(0);
                      toast({ title: "Focus mode desactivado" });
                    }}
                    className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/15 text-xs text-red-400 hover:bg-red-500/20 transition-all"
                  >
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
                    onKeyDown={(e) => e.key === "Enter" && addBlockedSite()}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/30"
                  />
                  <button
                    onClick={addBlockedSite}
                    className="px-3 py-2 rounded-lg bg-violet-500/15 border border-violet-500/20 text-xs text-violet-400 font-medium hover:bg-violet-500/25 transition-all"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {blockedSites.map((site) => (
                    <div
                      key={site}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] group"
                    >
                      <span className="text-xs text-slate-400">{site}</span>
                      <button
                        onClick={() => removeBlockedSite(site)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </MenuContent>
          )}

          {/* ── NOTES ── */}
          {activeSection === "notes" && (
            <MenuContent title="Notas rápidas" subtitle="Guarda ideas mientras navegas">
              {/* New note input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Escribe una nota…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/30"
                />
                <button
                  onClick={addNote}
                  className="px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-500/20 text-sm text-amber-400 font-medium hover:bg-amber-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {notes.length === 0 ? (
                <EmptyState icon={<StickyNote className="w-8 h-8" />} text="No tienes notas aún" />
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl bg-gradient-to-br border group transition-all duration-200 hover:scale-[1.01] ${note.color}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <p className="text-sm text-slate-300 leading-relaxed">{note.text}</p>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                        >
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
                          {new Date(note.timestamp).toLocaleString("es-ES", {
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
          {activeSection === "tasks" && (
            <MenuContent
              title="Tareas"
              subtitle={
                tasks.length > 0
                  ? `${completedTasks}/${tasks.length} completadas`
                  : "Organiza tu pendiente"
              }
            >
              {/* New task input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Nueva tarea…"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/30"
                />
                <button
                  onClick={addTask}
                  className="px-4 py-3 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-sm text-cyan-400 font-medium hover:bg-cyan-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar */}
              {tasks.length > 0 && (
                <div className="mb-4">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${(completedTasks / tasks.length) * 100}%` }}
                    />
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
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                          task.completed
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-600 hover:border-cyan-500"
                        }`}
                      >
                        {task.completed && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm transition-all ${
                        task.completed ? "text-slate-600 line-through" : "text-slate-300"
                      }`}>
                        {task.text}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </MenuContent>
          )}

          {/* ── MEDIA CENTER ── */}
          {activeSection === "media" && (
            <MenuContent title="Media Center" subtitle="Control multimedia">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard
                  icon={<Video className="w-5 h-5 text-red-400" />}
                  title="Picture in Picture"
                  desc="Video flotante mientras navegas"
                  accent="red"
                  onClick={() => {
                    toast({ title: "PiP activado" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<VolumeX className="w-5 h-5 text-amber-400" />}
                  title="Silenciar pestaña"
                  desc="Silenciar audio de esta página"
                  accent="amber"
                  onClick={() => {
                    toast({ title: "Pestaña silenciada" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Cast className="w-5 h-5 text-indigo-400" />}
                  title="Enviar a dispositivo"
                  desc="Chromecast, TV u otro equipo"
                  accent="indigo"
                  onClick={() => toast({ title: "📺 Buscando dispositivos…" })}
                />
                <ToolCard
                  icon={<Image className="w-5 h-5 text-emerald-400" />}
                  title="Galería de medios"
                  desc="Ver todas las imágenes/videos"
                  accent="emerald"
                  onClick={() => toast({ title: "Galería abierta" })}
                />
                <ToolCard
                  icon={<Music className="w-5 h-5 text-pink-400" />}
                  title="Detectar canción"
                  desc="Identifica la música que suena"
                  accent="pink"
                  onClick={() => toast({ title: "Escuchando…", description: "Identificando canción" })}
                />
                <ToolCard
                  icon={<Download className="w-5 h-5 text-sky-400" />}
                  title="Descargar medios"
                  desc="Descargar videos e imágenes"
                  accent="sky"
                  onClick={() => toast({ title: "Analizando medios disponibles…" })}
                />
              </div>
            </MenuContent>
          )}

          {/* ── DEVTOOLS ── */}
          {activeSection === "devtools" && (
            <MenuContent title="Desarrollador" subtitle="Para creadores de la web">
              <div className="grid grid-cols-2 gap-2">
                <ToolCard
                  icon={<Code2 className="w-5 h-5 text-emerald-400" />}
                  title="Inspector"
                  desc="Examinar elementos y CSS"
                  accent="emerald"
                  onClick={() => {
                    toast({ title: "Inspector abierto" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Terminal className="w-5 h-5 text-slate-300" />}
                  title="Consola"
                  desc="JavaScript console"
                  accent="slate"
                  onClick={() => {
                    toast({ title: "Consola abierta" });
                    onClose();
                  }}
                />
                <ToolCard
                  icon={<Wifi className="w-5 h-5 text-cyan-400" />}
                  title="Red"
                  desc="Monitor de peticiones HTTP"
                  accent="cyan"
                  onClick={() => toast({ title: "Network monitor abierto" })}
                />
                <ToolCard
                  icon={<Bug className="w-5 h-5 text-red-400" />}
                  title="Debugger"
                  desc="Depurador JavaScript"
                  accent="red"
                  onClick={() => toast({ title: "Debugger abierto" })}
                />
                <ToolCard
                  icon={<Activity className="w-5 h-5 text-violet-400" />}
                  title="Performance"
                  desc="Perfilar rendimiento"
                  accent="violet"
                  onClick={() => toast({ title: "Performance profiler abierto" })}
                />
                <ToolCard
                  icon={<Smartphone className="w-5 h-5 text-amber-400" />}
                  title="Vista responsiva"
                  desc="Simular dispositivos móviles"
                  accent="amber"
                  onClick={() => {
                    toast({ title: "Vista responsiva activada" });
                    onClose();
                  }}
                />
              </div>

              {/* View source */}
              <button
                onClick={() => {
                  onNavigate(`view-source:${currentUrl}`);
                  onClose();
                }}
                className="mt-4 w-full flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-left group"
              >
                <FileText className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                    Ver código fuente
                  </p>
                  <p className="text-[11px] text-slate-600">HTML de la página actual</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 ml-auto group-hover:text-slate-400 transition-colors" />
              </button>
            </MenuContent>
          )}

          {/* ── STATS ── */}
          {activeSection === "stats" && (
            <MenuContent title="Mi actividad" subtitle="Resumen de hoy">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard
                  icon={<Clock className="w-5 h-5 text-cyan-400" />}
                  label="Tiempo navegando"
                  value={`${Math.floor(MOCK_STATS.todayMinutes / 60)}h ${MOCK_STATS.todayMinutes % 60}m`}
                  accent="cyan"
                />
                <StatCard
                  icon={<Globe className="w-5 h-5 text-violet-400" />}
                  label="Sitios visitados"
                  value={MOCK_STATS.sitesVisited.toString()}
                  accent="violet"
                />
                <StatCard
                  icon={<Flame className="w-5 h-5 text-orange-400" />}
                  label="Sitio más visitado"
                  value={MOCK_STATS.topSite}
                  subtitle={`${MOCK_STATS.topSiteMinutes}m`}
                  accent="orange"
                />
                <StatCard
                  icon={<Shield className="w-5 h-5 text-emerald-400" />}
                  label="Trackers bloqueados"
                  value={MOCK_STATS.trackersBlocked.toString()}
                  accent="emerald"
                />
              </div>

              {/* Usage by hour chart (simplified) */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-bold text-slate-300 mb-4">Uso por hora</p>
                <div className="flex items-end gap-1 h-24">
                  {Array.from({ length: 24 }, (_, i) => {
                    const height = i < 7 ? 5 : i < 9 ? 40 : i < 12 ? 70 : i < 14 ? 50 : i < 18 ? 85 : i < 21 ? 60 : 30;
                    const current = new Date().getHours() === i;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-sm transition-all duration-300 ${
                            current
                              ? "bg-gradient-to-t from-cyan-500 to-teal-400"
                              : "bg-white/[0.08] hover:bg-white/[0.15]"
                          }`}
                          style={{ height: `${height}%` }}
                          title={`${i}:00 - ${height}%`}
                        />
                        {i % 6 === 0 && (
                          <span className="text-[8px] text-slate-700">{i}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </MenuContent>
          )}

          {/* ── SHARE ── */}
          {activeSection === "share" && (
            <MenuContent title="Compartir" subtitle="Enviar esta página">
              <div className="space-y-2">
                <ShareOption
                  icon={<Copy className="w-4 h-4 text-slate-300" />}
                  title="Copiar enlace"
                  desc={currentUrl.replace(/^https?:\/\//, "").substring(0, 40)}
                  onClick={() => {
                    navigator.clipboard.writeText(currentUrl);
                    toast({ title: "📋 URL copiada" });
                  }}
                />
                <ShareOption
                  icon={<QrCode className="w-4 h-4 text-violet-400" />}
                  title="Código QR"
                  desc="Genera un QR para compartir"
                  onClick={() => toast({ title: "🔲 QR generado" })}
                />
                <ShareOption
                  icon={<Mail className="w-4 h-4 text-sky-400" />}
                  title="Enviar por email"
                  desc="Abrir en tu cliente de correo"
                  onClick={() => {
                    window.open(`mailto:?subject=Mira%20esto&body=${currentUrl}`);
                    onClose();
                  }}
                />
                <ShareOption
                  icon={<Send className="w-4 h-4 text-emerald-400" />}
                  title="Enviar a mi teléfono"
                  desc="Continuar en otro dispositivo"
                  onClick={() => toast({ title: "Enlace enviado a tu teléfono" })}
                />
                <ShareOption
                  icon={<FileDown className="w-4 h-4 text-amber-400" />}
                  title="Guardar página completa"
                  desc="Descargar como archivo HTML"
                  onClick={() => toast({ title: "Página guardada" })}
                />
                <ShareOption
                  icon={<Printer className="w-4 h-4 text-slate-400" />}
                  title="Imprimir"
                  desc="Enviar a impresora"
                  onClick={() => {
                    window.print();
                    onClose();
                  }}
                />
              </div>
            </MenuContent>
          )}

          {/* ── SETTINGS ── */}
          {activeSection === "settings" && (
            <MenuContent title="Configuración" subtitle="Personaliza Orion">
              <div className="space-y-2">
                <SettingsLink
                  icon={<Settings className="w-4 h-4 text-slate-300" />}
                  title="Configuración general"
                  onClick={() => { onNavigate("orion://settings"); onClose(); }}
                />
                <SettingsLink
                  icon={<Keyboard className="w-4 h-4 text-cyan-400" />}
                  title="Atajos de teclado"
                  onClick={() => { onNavigate("orion://settings/shortcuts"); onClose(); }}
                />
                <SettingsLink
                  icon={<Palette className="w-4 h-4 text-violet-400" />}
                  title="Apariencia y temas"
                  onClick={() => { onNavigate("orion://settings/appearance"); onClose(); }}
                />
                <SettingsLink
                  icon={<Shield className="w-4 h-4 text-emerald-400" />}
                  title="Privacidad y seguridad"
                  onClick={() => { onNavigate("orion://settings/privacy"); onClose(); }}
                />
                <SettingsLink
                  icon={<Globe className="w-4 h-4 text-amber-400" />}
                  title="Motor de búsqueda"
                  onClick={() => { onNavigate("orion://settings/search"); onClose(); }}
                />
                <SettingsLink
                  icon={<Download className="w-4 h-4 text-sky-400" />}
                  title="Descargas"
                  onClick={() => { onNavigate("orion://settings/downloads"); onClose(); }}
                />
                <SettingsLink
                  icon={<Laptop className="w-4 h-4 text-rose-400" />}
                  title="Sincronización"
                  onClick={() => { onNavigate("orion://settings/sync"); onClose(); }}
                />

                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <SettingsLink
                    icon={<Info className="w-4 h-4 text-slate-500" />}
                    title="Acerca de Orion"
                    onClick={() => { onNavigate("orion://about"); onClose(); }}
                  />
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

function MenuContent({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
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

function QuickActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-white/[0.06] transition-all text-slate-500 hover:text-slate-200 group"
    >
      <span className="group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[9px] font-medium">{label}</span>
    </button>
  );
}

function ToolCard({
  icon,
  title,
  desc,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  accent: string;
  onClick: () => void;
}) {
  const borderColors: Record<string, string> = {
    sky: "hover:border-sky-500/20",
    violet: "hover:border-violet-500/20",
    rose: "hover:border-rose-500/20",
    amber: "hover:border-amber-500/20",
    emerald: "hover:border-emerald-500/20",
    cyan: "hover:border-cyan-500/20",
    orange: "hover:border-orange-500/20",
    indigo: "hover:border-indigo-500/20",
    red: "hover:border-red-500/20",
    pink: "hover:border-pink-500/20",
    slate: "hover:border-slate-500/20",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] ${
        borderColors[accent] || ""
      } transition-all duration-200 text-left group`}
    >
      <div className="mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </button>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
  };

  return (
    <div className="text-center">
      <p className={`text-sm font-bold ${colors[color] || "text-slate-300"}`}>{value}</p>
      <p className="text-[10px] text-slate-600">{label}</p>
    </div>
  );
}

function PrivacyToggle({
  icon,
  title,
  desc,
  defaultOn = false,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <span className="text-slate-500 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-300">{title}</p>
        <p className="text-[10px] text-slate-600">{desc}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`w-10 h-5.5 rounded-full transition-all duration-300 flex-shrink-0 relative ${
          on ? "bg-emerald-500" : "bg-white/[0.1]"
        }`}
      >
        <div
          className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all duration-300 ${
            on ? "left-[calc(100%-20px)]" : "left-0.5"
          }`}
          style={{ width: 18, height: 18, top: 2 }}
        />
      </button>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  accent: string;
}) {
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

function ShareOption({
  icon,
  title,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-200 text-left group"
    >
      <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-slate-600 truncate">{desc}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors flex-shrink-0" />
    </button>
  );
}

function SettingsLink({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl hover:bg-white/[0.04] transition-all duration-200 text-left group"
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-sm text-slate-300 group-hover:text-white transition-colors flex-1">
        {title}
      </span>
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