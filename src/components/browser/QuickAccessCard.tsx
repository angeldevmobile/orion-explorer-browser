import { LucideIcon } from "lucide-react";

interface QuickAccessCardProps {
  title: string;
  url: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
}

export const QuickAccessCard = ({ title, url, icon: Icon, gradient, onClick }: QuickAccessCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group relative p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-strong transition-all duration-300 hover:scale-105 overflow-hidden"
    >
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className={`p-4 rounded-xl ${gradient} shadow-medium group-hover:shadow-glow transition-all duration-300 group-hover:scale-110`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        <div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{url}</p>
        </div>
      </div>
    </button>
  );
};
