import { TrendingUp, Clock, Search } from "lucide-react";

interface SearchSuggestionProps {
  text: string;
  type: "trending" | "recent" | "suggestion";
  onClick: () => void;
}

export const SearchSuggestion = ({ text, type, onClick }: SearchSuggestionProps) => {
  const Icon = type === "trending" ? TrendingUp : type === "recent" ? Clock : Search;
  
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-muted/50 transition-all duration-200"
    >
      <div className={`
        p-2 rounded-lg transition-all duration-200
        ${type === "trending" ? "bg-gradient-accent" : "bg-muted"}
        group-hover:scale-110
      `}>
        <Icon className={`h-4 w-4 ${type === "trending" ? "text-white" : "text-muted-foreground"}`} />
      </div>
      
      <span className="text-sm text-foreground flex-1 text-left group-hover:text-primary transition-colors">
        {text}
      </span>
    </button>
  );
};
