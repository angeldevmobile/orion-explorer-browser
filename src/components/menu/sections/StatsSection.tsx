import { Clock, Globe, Flame, Shield } from "lucide-react";
import { MenuContent, StatCard } from "./ShareSectionUtils";
import type { TodayStats } from "@/hooks/useMenuData";

interface StatsSectionProps {
  stats: TodayStats | null;
}

export function StatsSection({ stats }: StatsSectionProps) {
  const todayMinutes = stats?.minutesBrowsed || 0;
  const sitesVisited = stats?.sitesVisited || 0;
  const trackersBlocked = stats?.trackersBlocked || 0;
  const topSite = stats?.topSites?.[0];
  const hourlyUsage = stats?.hourlyUsage || [];

  return (
    <MenuContent title="Mi actividad" subtitle="Resumen de hoy">
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard icon={<Clock className="w-5 h-5 text-cyan-400" />} label="Tiempo navegando" value={`${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`} accent="cyan" />
        <StatCard icon={<Globe className="w-5 h-5 text-violet-400" />} label="Sitios visitados" value={sitesVisited.toString()} accent="violet" />
        <StatCard icon={<Flame className="w-5 h-5 text-orange-400" />} label="Sitio más visitado" value={topSite?.domain || "—"} subtitle={topSite ? `${topSite.minutes}m` : undefined} accent="orange" />
        <StatCard icon={<Shield className="w-5 h-5 text-emerald-400" />} label="Trackers bloqueados" value={trackersBlocked.toString()} accent="emerald" />
      </div>

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
  );
}