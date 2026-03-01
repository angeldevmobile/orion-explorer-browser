import { Minus, Square, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export const WindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.electron) {
      window.electron.isMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = () => {
    window.electron?.minimizeWindow();
  };

  const handleMaximize = async () => {
    await window.electron?.maximizeWindow();
    const maximized = await window.electron?.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = () => {
    window.electron?.closeWindow();
  };

  // No mostrar controles si no estamos en Electron
  if (!window.electron) return null;

  return (
    <div className="flex items-center gap-1 ml-auto">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMinimize}
        className="h-8 w-10 hover:bg-muted rounded-none"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleMaximize}
        className="h-8 w-10 hover:bg-muted rounded-none"
      >
        {isMaximized ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-8 w-10 hover:bg-destructive hover:text-destructive-foreground rounded-none"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};