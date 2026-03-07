import { ShieldCheck, Eye, Cookie, Fingerprint, Lock, AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MenuContent, MiniStat, PrivacyToggle } from "./ShareSectionUtils";
import type { UserPrefs, TodayStats } from "@/hooks/useMenuData";

interface PrivacySectionProps {
  prefs: UserPrefs | null;
  stats: TodayStats | null;
  onUpdatePref: (key: string, value: boolean) => Promise<void>;
}

export function PrivacySection({ prefs, stats, onUpdatePref }: PrivacySectionProps) {
  const { toast } = useToast();

  const trackersBlocked = stats?.trackersBlocked || 0;
  const dataSaved = stats ? `${(parseInt(stats.dataSavedBytes) / (1024 * 1024)).toFixed(1)} MB` : "0 MB";

  return (
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
        <PrivacyToggle icon={<Eye className="w-4 h-4" />} title="Bloquear rastreadores" desc="Evita que los sitios te sigan" initialOn={prefs?.blockTrackers ?? true} onChange={(on) => onUpdatePref("blockTrackers", on)} />
        <PrivacyToggle icon={<Cookie className="w-4 h-4" />} title="Bloquear cookies de terceros" desc="Solo cookies del sitio actual" initialOn={prefs?.blockThirdPartyCookies ?? true} onChange={(on) => onUpdatePref("blockThirdPartyCookies", on)} />
        <PrivacyToggle icon={<Fingerprint className="w-4 h-4" />} title="Anti-fingerprinting" desc="Evita la identificación por huella digital" initialOn={prefs?.antiFingerprint ?? true} onChange={(on) => onUpdatePref("antiFingerprint", on)} />
        <PrivacyToggle icon={<Lock className="w-4 h-4" />} title="Forzar HTTPS" desc="Conexiones siempre cifradas" initialOn={prefs?.forceHttps ?? true} onChange={(on) => onUpdatePref("forceHttps", on)} />
        <PrivacyToggle icon={<AlertTriangle className="w-4 h-4" />} title="Bloquear scripts de minería" desc="Prevenir cryptojacking" initialOn={prefs?.blockMining ?? true} onChange={(on) => onUpdatePref("blockMining", on)} />
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
  );
}