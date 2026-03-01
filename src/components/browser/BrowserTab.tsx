import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrowserTabProps {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  favicon?: string;
}

export const BrowserTab = ({ 
  title, 
  url, 
  isActive, 
  onSelect, 
  onClose,
  favicon 
}: BrowserTabProps) => {
  return (
    <div
      onClick={onSelect}
      className={`
        group relative flex items-center gap-3 px-5 py-3 min-w-[180px] max-w-[240px]
        rounded-t-xl cursor-pointer transition-all duration-300
        ${isActive 
          ? 'bg-tab-active shadow-medium scale-105 -mb-[2px]' 
          : 'bg-tab-inactive hover:bg-tab-active/60'
        }
      `}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {favicon ? (
          <img src={favicon} alt="" className="w-5 h-5 rounded-sm flex-shrink-0" />
        ) : (
          <div className="relative w-5 h-5 rounded-sm bg-gradient-primary flex-shrink-0 shadow-soft">
            {isActive && (
              <div className="absolute inset-0 bg-gradient-primary rounded-sm blur animate-glow-pulse" />
            )}
          </div>
        )}
        <span className="text-sm font-medium truncate">
          {title}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 flex-shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
