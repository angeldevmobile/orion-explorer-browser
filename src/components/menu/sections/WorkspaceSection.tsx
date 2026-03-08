import { Columns, PanelLeft, Maximize2, Layers, Moon, Sun, Monitor, Plus, X, ChevronDown } from "lucide-react";
import { MenuContent, ToolCard } from "./ShareSectionUtils";
import type { UserPrefs } from "@/hooks/useMenuData";
import { useState } from "react";

const GROUP_COLORS = ["#22d3ee", "#a78bfa", "#fb923c", "#f472b6", "#34d399", "#facc15"];

interface WorkspaceSectionProps {
  prefs: UserPrefs | null;
  onThemeChange: (themeId: string) => Promise<void>;
  onClose: () => void;
  onSplitView?: () => void;
  onSidePanel?: () => void;
  onTabGroups?: () => void;
  workspaceMode?: "normal" | "split" | "sidebar";
  tabGroups?: { id: string; name: string; color: string; tabIds: string[]; collapsed: boolean }[];
  tabs?: { id: string; title: string; url: string; groupId?: string }[];
  activeTabId?: string;
  onCreateTabGroup?: (name: string, color: string) => void;
  onAddTabToGroup?: (tabId: string, groupId: string) => void;
  onRemoveTabFromGroup?: (tabId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
}

export function WorkspaceSection({
  prefs,
  onThemeChange,
  onClose,
  onSplitView,
  onSidePanel,
  onTabGroups,
  workspaceMode = "normal",
  tabGroups = [],
  tabs = [],
  activeTabId = "",
  onCreateTabGroup,
  onAddTabToGroup,
  onRemoveTabFromGroup,
  onDeleteGroup,
}: WorkspaceSectionProps) {
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(GROUP_COLORS[0]);
  const [showGroupManager, setShowGroupManager] = useState(false);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    onCreateTabGroup?.(newGroupName.trim(), newGroupColor);
    setNewGroupName("");
    setNewGroupColor(GROUP_COLORS[0]);
    setShowNewGroup(false);
  };

  const ungroupedTabs = tabs.filter((t) => !t.groupId);

  return (
    <MenuContent title="Espacio de trabajo" subtitle="Organiza tu pantalla">
      {/* Layout tools */}
      <div className="grid grid-cols-2 gap-2">
        <ToolCard
          icon={<Columns className={`w-5 h-5 ${workspaceMode === "split" ? "text-cyan-300" : "text-cyan-400"}`} />}
          title="Vista dividida"
          desc={workspaceMode === "split" ? "Activa — clic para cerrar" : "Dos páginas lado a lado"}
          accent="cyan"
          onClick={() => onSplitView?.()}
        />
        <ToolCard
          icon={<PanelLeft className={`w-5 h-5 ${workspaceMode === "sidebar" ? "text-violet-300" : "text-violet-400"}`} />}
          title="Panel lateral"
          desc={workspaceMode === "sidebar" ? "Activo — clic para cerrar" : "Panel con segunda página"}
          accent="violet"
          onClick={() => onSidePanel?.()}
        />
        <ToolCard
          icon={<Maximize2 className="w-5 h-5 text-amber-400" />}
          title="Pantalla completa"
          desc="Ocultar todo el UI"
          accent="amber"
          onClick={() => { document.documentElement.requestFullscreen?.(); onClose(); }}
        />
        <ToolCard
          icon={<Layers className="w-5 h-5 text-emerald-400" />}
          title="Grupos de pestañas"
          desc={tabGroups.length > 0 ? `${tabGroups.length} grupo(s)` : "Organizar pestañas por tema"}
          accent="emerald"
          onClick={() => setShowGroupManager(!showGroupManager)}
        />
      </div>

      {/* Indicador de modo activo */}
      {workspaceMode !== "normal" && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] text-cyan-400 font-medium">
            {workspaceMode === "split" ? "Vista dividida activa" : "Panel lateral activo"}
          </span>
          <button
            onClick={() => { if (workspaceMode === "split") onSplitView?.(); else onSidePanel?.(); }}
            className="ml-auto text-[10px] text-cyan-500 hover:text-cyan-300 transition-colors"
          >
            Desactivar
          </button>
        </div>
      )}

      {/* ── Gestor de grupos de pestañas ── */}
      {showGroupManager && (
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-300">Grupos de pestañas</p>
            <button
              onClick={() => setShowNewGroup(!showNewGroup)}
              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Plus className="w-3 h-3" /> Nuevo grupo
            </button>
          </div>

          {/* Formulario nuevo grupo */}
          {showNewGroup && (
            <div className="mb-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.08]">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
                placeholder="Nombre del grupo..."
                className="w-full text-xs bg-transparent border-b border-white/10 pb-1.5 mb-2 text-slate-300 placeholder-slate-600 outline-none focus:border-cyan-500/30"
                maxLength={20}
              />
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {GROUP_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewGroupColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        newGroupColor === c ? "border-white scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="ml-auto px-3 py-1 text-[10px] font-medium rounded-md bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Crear
                </button>
              </div>
            </div>
          )}

          {/* Lista de grupos existentes */}
          {tabGroups.length === 0 ? (
            <p className="text-[11px] text-slate-600 text-center py-3">
              No hay grupos creados. Crea uno para organizar tus pestañas.
            </p>
          ) : (
            <div className="space-y-2">
              {tabGroups.map((group) => {
                const groupTabs = tabs.filter((t) => t.groupId === group.id);
                return (
                  <div key={group.id} className="rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-[11px] font-medium text-slate-300 flex-1">{group.name}</span>
                      <span className="text-[9px] text-slate-600">{groupTabs.length} tabs</span>
                      <button
                        onClick={() => onDeleteGroup?.(group.id)}
                        className="text-slate-700 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {groupTabs.length > 0 && (
                      <div className="px-3 pb-2 space-y-1">
                        {groupTabs.map((tab) => (
                          <div key={tab.id} className="flex items-center gap-2 text-[10px]">
                            <span className="text-slate-500 truncate flex-1">{tab.title}</span>
                            <button
                              onClick={() => onRemoveTabFromGroup?.(tab.id)}
                              className="text-slate-700 hover:text-slate-400 flex-shrink-0"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Agregar tab al grupo */}
                    {ungroupedTabs.length > 0 && (
                      <div className="px-3 pb-2">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              onAddTabToGroup?.(e.target.value, group.id);
                              e.target.value = "";
                            }
                          }}
                          className="w-full text-[10px] bg-white/[0.04] border border-white/[0.08] rounded px-2 py-1 text-slate-400 outline-none"
                          defaultValue=""
                        >
                          <option value="" disabled>+ Agregar pestaña...</option>
                          {ungroupedTabs.map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tema de colores ── */}
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