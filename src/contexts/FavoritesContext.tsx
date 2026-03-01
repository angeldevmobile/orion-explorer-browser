import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { favoriteService, authService, Favorite as ApiFavorite } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Favorite {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  addFavorite: (favorite: Omit<Favorite, "id">) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  isFavorite: (url: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    if (!authService.isAuthenticated()) return;
    
    try {
      setLoading(true);
      const data = await favoriteService.getFavorites();
      setFavorites(data.map(fav => ({
        id: fav.id,
        title: fav.title,
        url: fav.url,
        icon: fav.icon || undefined,
      })));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFavorite = async (favorite: Omit<Favorite, "id">) => {
    if (!authService.isAuthenticated()) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para guardar favoritos",
        variant: "destructive",
      });
      return;
    }

    try {
      const newFav = await favoriteService.addFavorite(favorite);
      setFavorites([...favorites, {
        id: newFav.id,
        title: newFav.title,
        url: newFav.url,
        icon: newFav.icon || undefined,
      }]);
    } catch (error: unknown) {
      let errorMessage = "Error al agregar favorito";
      if (error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "error" in error.response.data) {
        errorMessage = (error.response as { data?: { error?: string } }).data?.error || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await favoriteService.deleteFavorite(id);
      setFavorites(favorites.filter((f) => f.id !== id));
    } catch (error: unknown) {
      let errorMessage = "Error al eliminar favorito";
      if (error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response && error.response.data && typeof error.response.data === "object" && "error" in error.response.data) {
        errorMessage = (error.response as { data?: { error?: string } }).data?.error || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const isFavorite = (url: string) => {
    return favorites.some((f) => f.url === url);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};
