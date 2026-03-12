import { Video, VolumeX, Volume2, Cast, Image, Music, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { MenuContent, ToolCard } from "./ShareSectionUtils";
import { MediaGalleryModal } from "./MediaGalleryModal";
import { SongDetectorModal } from "./SongDetectorModal";
import { useMediaGallery } from "@/hooks/useMediaGallery";

interface MediaSectionProps {
  currentUrl: string;
  currentTitle?: string;
  onClose: () => void;
  tabs: { id: string; title: string; url: string; favicon?: string }[];
}

export function MediaSection({ currentUrl, currentTitle, onClose, tabs }: MediaSectionProps) {
  const { toast } = useToast();
  const [isMuted, setIsMuted] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showSongDetector, setShowSongDetector] = useState(false);
  const { media, scanPage, downloadSelected, selectAll, selected } = useMediaGallery();

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

  const handleCast = async () => {
    // Generar QR con la URL actual para enviar a otro dispositivo
    let url = window.location.href;
    if (window.electron?.getCurrentUrl) {
      url = await window.electron.getCurrentUrl();
    }
    // Copiar URL al portapapeles + mostrar toast con instrucción
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL copiada al portapapeles",
        description: "Pégala en tu TV, móvil u otro dispositivo",
      });
    } catch {
      toast({ title: "No se pudo copiar la URL" });
    }
    onClose();
  };

  const handleOpenGallery = () => {
    setShowGallery(true);
  };

  const handleOpenSongDetector = () => {
    setShowSongDetector(true);
  };

  const handleDownloadMedia = async () => {
    // Escanear y descargar todo en un paso
    await scanPage();
    if (media.length > 0) {
      selectAll();
      await downloadSelected();
      toast({ title: `${media.length} medios encontrados`, description: "Selecciona los que quieras descargar" });
    } else {
      // Si no hay medios aún, abrir la galería para que seleccione
      setShowGallery(true);
    }
  };

  return (
    <>
      <MenuContent title="Media Center" subtitle="Control multimedia">
        <div className="grid grid-cols-2 gap-2">
          <ToolCard
            icon={<Video className="w-5 h-5 text-red-400" />}
            title="Picture in Picture"
            desc="Video flotante mientras navegas"
            accent="red"
            onClick={handlePip}
          />
          <ToolCard
            icon={isMuted ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-amber-400" />}
            title={isMuted ? "Restaurar audio" : "Silenciar pestaña"}
            desc={isMuted ? "Activar audio" : "Silenciar audio de esta página"}
            accent="amber"
            onClick={handleToggleMute}
          />
          <ToolCard
            icon={<Cast className="w-5 h-5 text-indigo-400" />}
            title="Enviar a dispositivo"
            desc="Copia URL para otro equipo"
            accent="indigo"
            onClick={handleCast}
          />
          <ToolCard
            icon={<Image className="w-5 h-5 text-emerald-400" />}
            title="Galería de medios"
            desc="Ver todas las imágenes/videos"
            accent="emerald"
            onClick={handleOpenGallery}
          />
          <ToolCard
            icon={<Music className="w-5 h-5 text-pink-400" />}
            title="Detectar canción"
            desc="Identifica la música que suena"
            accent="pink"
            onClick={handleOpenSongDetector}
          />
          <ToolCard
            icon={<Download className="w-5 h-5 text-sky-400" />}
            title="Descargar medios"
            desc="Descargar videos e imágenes"
            accent="sky"
            onClick={handleDownloadMedia}
          />
        </div>
      </MenuContent>

      {/* Modales */}
      <MediaGalleryModal open={showGallery} onClose={() => setShowGallery(false)} />
      <SongDetectorModal
        open={showSongDetector}
        onClose={() => setShowSongDetector(false)}
        currentUrl={currentUrl}
        currentTitle={currentTitle}
        tabs={tabs}
      />
    </>
  );
}