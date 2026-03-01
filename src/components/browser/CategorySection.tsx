import { LucideIcon, Code, BookOpen, Wrench, Calendar, FileText, Cloud, Palette, Image, Sparkles } from "lucide-react";

interface CategoryItem {
  title: string;
  url: string;
  icon: string;
}

interface CategorySectionProps {
  title: string;
  items: CategoryItem[];
  onNavigate: (url: string) => void;
}

const iconMap: Record<string, LucideIcon> = {
  Code, BookOpen, Wrench, Calendar, FileText, Cloud, Palette, Image, Sparkles
};

export const CategorySection = ({ title, items, onNavigate }: CategorySectionProps) => {
  return (
    <div className="animate-in fade-in duration-700">
      <h3 className="text-xl font-bold mb-4 text-foreground">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item, i) => {
          const IconComponent = iconMap[item.icon] || Code;
          return (
            <button
              key={i}
              onClick={() => onNavigate(`https://${item.url}`)}
              className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-md transition-all duration-300 hover:scale-102 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="relative p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div className="relative text-left flex-1">
                <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.url}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};