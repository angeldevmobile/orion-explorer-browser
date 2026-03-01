import { useState, useEffect } from "react";
import { Search, Lock, Star, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useToast } from "@/hooks/use-toast";

interface AddressBarProps {
  url: string;
  onNavigate: (url: string) => void;
  onRefresh: () => void;
  isSecure?: boolean;
}

export const AddressBar = ({ url, onNavigate, onRefresh, isSecure = true }: AddressBarProps) => {
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);
  const { addFavorite, removeFavorite, isFavorite, favorites } = useFavorites();
  const { toast } = useToast();
  
  const isCurrentFavorite = isFavorite(url);

  // Función para convertir URL real a formato Orion
  const toOrionFormat = (realUrl: string): string => {
    if (realUrl.startsWith('orion://')) {
      return realUrl;
    }
    if (realUrl.startsWith('https://')) {
      return 'orion://' + realUrl.replace('https://', '');
    }
    if (realUrl.startsWith('http://')) {
      return 'orion://' + realUrl.replace('http://', '');
    }
    return realUrl;
  };

  // Función para convertir formato Orion a URL real
  const toRealUrl = (orionUrl: string): string => {
    if (orionUrl.startsWith('orion://welcome') || orionUrl.startsWith('orion://newtab')) {
      return orionUrl; // Mantener URLs internas
    }
    if (orionUrl.startsWith('orion://')) {
      return 'https://' + orionUrl.replace('orion://', '');
    }
    return orionUrl;
  };

  useEffect(() => {
    // Mostrar formato Orion en el input
    setInputValue(toOrionFormat(url));
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convertir de vuelta a URL real antes de navegar
    const realUrl = toRealUrl(inputValue);
    onNavigate(realUrl);
    setIsFocused(false);
  };

  const handleToggleFavorite = () => {
    if (isCurrentFavorite) {
      const fav = favorites.find(f => f.url === url);
      if (fav) {
        removeFavorite(fav.id);
        toast({
          title: "Eliminado de favoritos",
          description: toOrionFormat(url),
        });
      }
    } else {
      addFavorite({
        title: url.includes("://") ? url.split("://")[1].split('/')[0] : url,
        url: url,
      });
      toast({
        title: "Añadido a favoritos",
        description: toOrionFormat(url),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full">
      <div className={`
        flex-1 flex items-center gap-3 bg-toolbar rounded-2xl px-5 py-3 
        border-2 transition-all duration-300
        ${isFocused 
          ? 'border-primary shadow-strong scale-[1.02]' 
          : 'border-border/30 shadow-soft hover:shadow-medium hover:border-border'
        }
      `}>
        <div className="relative">
          {isSecure ? (
            <Lock className="h-5 w-5 text-primary flex-shrink-0 animate-in zoom-in duration-200" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          )}
          {isFocused && (
            <div className="absolute -inset-1 bg-primary/20 rounded-full blur animate-glow-pulse" />
          )}
        </div>
        
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base"
          placeholder="Buscar con Orion o ingresar URL"
        />
        
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 transition-all duration-200 hover:scale-110"
            onClick={handleToggleFavorite}
          >
            <Star className={`h-5 w-5 transition-all duration-300 ${
              isCurrentFavorite 
                ? 'fill-accent text-accent scale-110' 
                : 'text-muted-foreground hover:text-accent'
            }`} />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 transition-all duration-200 hover:scale-110"
          >
            <Sparkles className="h-5 w-5 text-secondary hover:text-secondary/80" />
          </Button>
        </div>
      </div>
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        className="h-11 w-11 transition-all duration-200 hover:scale-110 hover:rotate-180"
      >
        <RotateCw className="h-5 w-5" />
      </Button>
    </form>
  );
};
