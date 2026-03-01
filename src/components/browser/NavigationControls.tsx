import { ChevronLeft, ChevronRight, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationControlsProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onHome: () => void;
  onMenu: () => void;
}

export const NavigationControls = ({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onHome,
  onMenu
}: NavigationControlsProps) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        disabled={!canGoBack}
        className="h-10 w-10 transition-all duration-200 hover:scale-110 disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onForward}
        disabled={!canGoForward}
        className="h-10 w-10 transition-all duration-200 hover:scale-110 disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onHome}
        className="h-10 w-10 transition-all duration-200 hover:scale-110"
      >
        <Home className="h-5 w-5" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenu}
        className="h-10 w-10 transition-all duration-200 hover:scale-110"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
};
