interface CategoryCardProps {
  title: string;
  url: string;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryCard = ({ 
  title, 
  url, 
  onClick,
  className = "",
  style
}: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`group relative p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-strong transition-all duration-300 hover:scale-105 overflow-hidden ${className}`}
      style={style}
    >
      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="p-4 rounded-xl bg-gradient-primary shadow-medium group-hover:shadow-glow transition-all duration-300 group-hover:scale-110">
          <div className="h-6 w-6 text-white" />
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