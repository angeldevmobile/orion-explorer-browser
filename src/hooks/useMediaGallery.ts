import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { mediaService, type MediaItem } from "@/services/api";

export function useMediaGallery() {
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const scanPage = useCallback(async (activeUrl?: string) => {
    setLoading(true);
    try {
      if (window.electron?.getPageMedia) {
        const items = await window.electron.getPageMedia(activeUrl);
        setMedia(items);
        if (items.length === 0) {
          toast({ title: "No se encontraron medios en esta página" });
        }
      } else {
        // Fallback web: escanear DOM local
        const imgs = Array.from(document.querySelectorAll("img[src]"))
          .filter((img) => (img as HTMLImageElement).naturalWidth > 80)
          .map((img) => ({
            type: "image" as const,
            src: (img as HTMLImageElement).src,
            alt: (img as HTMLImageElement).alt,
            width: (img as HTMLImageElement).naturalWidth,
            height: (img as HTMLImageElement).naturalHeight,
          }));
        setMedia(imgs);
        if (imgs.length === 0) {
          toast({ title: "No se encontraron medios en esta página" });
        }
      }
    } catch {
      toast({ title: "Error escaneando medios" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleSelect = useCallback((index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(media.map((_, i) => i)));
  }, [media]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const downloadSingle = useCallback(async (item: MediaItem) => {
    if (window.electron?.downloadMedia) {
      const result = await window.electron.downloadMedia({
        url: item.src,
        filename: item.alt,
      });
      if (result.success) {
        toast({ title: "Descarga completada" });
        const currentUrl = (await window.electron.getCurrentUrl?.()) || "";
        mediaService
          .recordDownload({
            url: item.src,
            title: item.alt || "media",
            type: item.type,
            size: result.size,
            sourceUrl: currentUrl,
          })
          .catch(() => {});
      } else {
        toast({
          title: "No se pudo descargar",
          description:
            item.src.startsWith("blob:")
              ? "Este recurso es un stream protegido de la página"
              : "Error al descargar el archivo",
          variant: "destructive",
        });
      }
    } else {
      if (item.src.startsWith("blob:")) {
        toast({
          title: "No disponible",
          description:
            "Los streams solo pueden descargarse desde la app de escritorio",
          variant: "destructive",
        });
      } else {
        window.open(item.src, "_blank");
      }
    }
  }, [toast]);

  const downloadSelected = useCallback(async () => {
    const items = Array.from(selected).map((i) => media[i]);
    if (items.length === 0) {
      toast({ title: "Selecciona al menos un archivo" });
      return;
    }

    if (window.electron?.downloadMediaBulk) {
      const result = await window.electron.downloadMediaBulk(items);
      if (result.success) {
        toast({ title: `${result.downloaded}/${result.total} archivos descargados` });
      }
    } else {
      // Fallback: descargar uno a uno
      for (const item of items) {
        await downloadSingle(item);
      }
    }
    clearSelection();
  }, [selected, media, toast, downloadSingle, clearSelection]);

  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");
  const audios = media.filter((m) => m.type === "audio");

  return {
    media, images, videos, audios,
    loading, selected, scanPage,
    toggleSelect, selectAll, clearSelection,
    downloadSingle, downloadSelected,
  };
}