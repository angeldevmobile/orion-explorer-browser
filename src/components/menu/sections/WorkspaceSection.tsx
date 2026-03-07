import { Columns, PanelLeft, Maximize2, Layers, Moon, Sun, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MenuContent, ToolCard } from "./ShareSectionUtils";
import type { UserPrefs } from "@/hooks/useMenuData";

interface WorkspaceSectionProps {
  prefs: UserPrefs | null;
  onThemeChange: (themeId: string) => Promise<void>;
  onClose: () => void;
}

export function WorkspaceSection({ prefs, onThemeChange, onClose }: WorkspaceSectionProps) {
  const { toast } = useToast();

  return (
    <MenuContent title="Espacio de trabajo" subtitle="Organiza tu pantalla">
      <div className="grid grid-cols-2 gap-2">
        <ToolCard icon={<Columns className="w-5 h-5 text-cyan-400" />} title="Vista dividida" desc="Dos páginas lado a lado" accent="cyan" onClick={() => { toast({ title: "Vista dividida activada" }); onClose(); }} />
        <ToolCard icon={<PanelLeft className="w-5 h-5 text-violet-400" />} title="Panel lateral" desc="Panel con segunda página" accent="violet" onClick={() => { toast({ title: "Panel lateral abierto" }); onClose(); }} />
        <ToolCard icon={<Maximize2 className="w-5 h-5 text-amber-400" />} title="Pantalla completa" desc="Ocultar todo el UI" accent="amber" onClick={() => { document.documentElement.requestFullscreen?.(); onClose(); }} />
        <ToolCard icon={<Layers className="w-5 h-5 text-emerald-400" />} title="Grupos de pestañas" desc="Organizar pestañas por tema" accent="emerald" onClick={() => toast({ title: "Gestor de grupos abierto" })} />
      </div>

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
              onClick={() => onThemeChange(t.id)}
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
  );
}