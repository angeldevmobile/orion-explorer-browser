import { Video, VolumeX, Volume2, Cast, Image, Music, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MenuContent, ToolCard } from "./ShareSectionUtils";

interface MediaSectionProps {
  onClose: () => void;
}

export function MediaSection({ onClose }: MediaSectionProps) {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    window.electron?.isMuted().then(setIsMuted).catch(() => {});
  }, []);

  const handlePip = async () => {
    try {
      const video = document.querySelector("video");
      if (video && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          toast({ title: "PiP desactivado" });
        } else {
          await video.requestPictureInPicture();
          toast({ title: "PiP activado" });
        }
      } else {
        toast({ title: "No hay video disponible en esta página" });
      }
    } catch {
      toast({ title: "No se pudo activar PiP" });
    }
    onClose();
  };

  const handleToggleMute = async () => {
    if (window.electron?.toggleMute) {
      const muted = await window.electron.toggleMute();
      setIsMuted(muted);
      toast({ title: muted ? "Pestaña silenciada" : "Audio restaurado" });
    } else {
      toast({ title: "Solo disponible en app de escritorio" });
    }
    onClose();
  };

  return (
    <MenuContent title="Media Center" subtitle="Control multimedia">
      <div className="grid grid-cols-2 gap-2">
        <ToolCard icon={<Video className="w-5 h-5 text-red-400" />} title="Picture in Picture" desc="Video flotante mientras navegas" accent="red" onClick={handlePip} />
        <ToolCard
          icon={isMuted ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-amber-400" />}
          title={isMuted ? "Restaurar audio" : "Silenciar pestaña"}
          desc={isMuted ? "Activar audio" : "Silenciar audio de esta página"}
          accent="amber"
          onClick={handleToggleMute}
        />
        <ToolCard icon={<Cast className="w-5 h-5 text-indigo-400" />} title="Enviar a dispositivo" desc="Chromecast, TV u otro equipo" accent="indigo" onClick={() => toast({ title: "Buscando dispositivos…" })} />
        <ToolCard icon={<Image className="w-5 h-5 text-emerald-400" />} title="Galería de medios" desc="Ver todas las imágenes/videos" accent="emerald" onClick={() => toast({ title: "Galería abierta" })} />
        <ToolCard icon={<Music className="w-5 h-5 text-pink-400" />} title="Detectar canción" desc="Identifica la música que suena" accent="pink" onClick={() => toast({ title: "Escuchando…", description: "Identificando canción" })} />
        <ToolCard icon={<Download className="w-5 h-5 text-sky-400" />} title="Descargar medios" desc="Descargar videos e imágenes" accent="sky" onClick={() => toast({ title: "Analizando medios disponibles…" })} />
      </div>
    </MenuContent>
  );
}