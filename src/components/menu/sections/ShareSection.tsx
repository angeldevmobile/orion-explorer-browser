import { useState } from "react";
import { Copy, QrCode, Mail, Send, FileDown, Printer, Download, Share2, X, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MenuContent, ShareOption } from "./ShareSectionUtils";

interface ShareSectionProps {
  currentUrl: string;
  onClose: () => void;
}

export function ShareSection({ currentUrl, onClose }: ShareSectionProps) {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleQr = () => {
    const size = 200;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(currentUrl)}&bgcolor=0a0e17&color=22d3ee`;
    setQrDataUrl(qrUrl);
    toast({ title: "QR generado" });
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = "qr-code.png";
    link.click();
    toast({ title: "QR descargado" });
  };

  const handleShareQr = async () => {
    if (!navigator.share) {
      navigator.clipboard.writeText(currentUrl);
      toast({ title: "URL copiada al portapapeles" });
      return;
    }
    try {
      await navigator.share({ title: "Compartir enlace", url: currentUrl });
    } catch {
      /* usuario canceló */
    }
  };

  const handleSendToPhone = () => {
    if (!phoneNumber.trim()) {
      toast({ title: "Ingresa un número de teléfono" });
      return;
    }
    // Enviar via WhatsApp como método más universal
    const message = encodeURIComponent(`Mira este enlace: ${currentUrl}`);
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, "_blank");
    toast({ title: "Enlace enviado por WhatsApp" });
    setShowPhoneInput(false);
    setPhoneNumber("");
  };

  const handleSaveHtml = async () => {
    if (window.electron?.savePageHtml) {
      const filePath = await window.electron.savePageHtml();
      if (filePath) {
        toast({ title: "Página guardada", description: filePath });
      }
    } else {
      const html = document.documentElement.outerHTML;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "pagina.html";
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Página guardada" });
    }
    onClose();
  };

  return (
    <MenuContent title="Compartir" subtitle="Enviar esta página">
      <div className="space-y-2">
        <ShareOption icon={<Copy className="w-4 h-4 text-slate-300" />} title="Copiar enlace" desc={currentUrl.replace(/^https?:\/\//, "").substring(0, 40)} onClick={() => { navigator.clipboard.writeText(currentUrl); toast({ title: "URL copiada" }); }} />
        <ShareOption icon={<QrCode className="w-4 h-4 text-violet-400" />} title="Código QR" desc="Genera un QR para compartir" onClick={handleQr} />
        <ShareOption icon={<Mail className="w-4 h-4 text-sky-400" />} title="Enviar por email" desc="Abrir en tu cliente de correo" onClick={() => { window.open(`mailto:?subject=Mira%20esto&body=${encodeURIComponent(currentUrl)}`); onClose(); }} />
        <ShareOption icon={<Send className="w-4 h-4 text-emerald-400" />} title="Enviar a mi teléfono" desc="Continuar en otro dispositivo" onClick={() => setShowPhoneInput(!showPhoneInput)} />
        <ShareOption icon={<FileDown className="w-4 h-4 text-amber-400" />} title="Guardar página completa" desc="Descargar como archivo HTML" onClick={handleSaveHtml} />
        <ShareOption icon={<Printer className="w-4 h-4 text-slate-400" />} title="Imprimir" desc="Enviar a impresora" onClick={() => { window.print(); onClose(); }} />
      </div>

      {/* Phone Input */}
      {showPhoneInput && (
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-slate-300">Enviar por WhatsApp</span>
            </div>
            <button onClick={() => setShowPhoneInput(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+52 123 456 7890"
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/30"
              onKeyDown={(e) => e.key === "Enter" && handleSendToPhone()}
            />
            <button
              onClick={handleSendToPhone}
              className="px-4 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-all"
            >
              Enviar
            </button>
          </div>
          <p className="text-[10px] text-slate-600">Incluye el código de país (ej: +52, +1, +34)</p>
        </div>
      )}

      {/* QR Preview */}
      {qrDataUrl && (
        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center gap-3">
          <img src={qrDataUrl} alt="QR Code" className="w-40 h-40 rounded-lg" />
          <p className="text-[10px] text-slate-600 truncate max-w-full">{currentUrl}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(currentUrl); toast({ title: "URL copiada" }); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
            >
              <Copy className="w-3 h-3" />
              Copiar
            </button>
            <button
              onClick={handleDownloadQr}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
            >
              <Download className="w-3 h-3" />
              Descargar
            </button>
            <button
              onClick={handleShareQr}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-all"
            >
              <Share2 className="w-3 h-3" />
              Compartir
            </button>
          </div>
          <button
            onClick={() => setQrDataUrl(null)}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}
    </MenuContent>
  );
}