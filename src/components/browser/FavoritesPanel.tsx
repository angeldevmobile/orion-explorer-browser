import { Star, Trash2, ExternalLink } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface FavoritesPanelProps {
  onNavigate: (url: string) => void;
}

export const FavoritesPanel = ({ onNavigate }: FavoritesPanelProps) => {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 transition-all duration-200 hover:scale-110 relative"
        >
          <Star className="h-5 w-5" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold animate-in zoom-in">
              {favorites.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-accent text-accent" />
            Favoritos
          </SheetTitle>
          <SheetDescription>
            {favorites.length} sitios guardados
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Star className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-center">No hay favoritos guardados</p>
              <p className="text-sm text-center mt-2">Haz clic en la estrella para guardar sitios</p>
            </div>
          ) : (
            <div className="space-y-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="group flex items-center gap-3 p-4 rounded-lg bg-card border border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-medium"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                      {fav.title}
                    </h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {fav.url}
                    </p>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onNavigate(fav.url)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:text-destructive"
                      onClick={() => removeFavorite(fav.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
