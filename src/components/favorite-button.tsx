import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites, type FavoriteItem } from "@/lib/use-favorites";

/**
 * Tactile "save to favourites" heart used on salon/service cards.
 * Optimistic, animated, works for guests (device-local).
 */
export function FavoriteButton({
  item,
  className = "",
}: {
  item: FavoriteItem;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const [pop, setPop] = useState(false);
  const active = isFavorite(item.id);

  return (
    <button
      type="button"
      aria-label={active ? "Pašalinti iš mėgstamų" : "Įtraukti į mėgstamus"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggle(item);
        setPop(true);
        setTimeout(() => setPop(false), 400);
        toast.success(added ? "Įtraukta į mėgstamus" : "Pašalinta iš mėgstamų");
      }}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border/60 bg-background/80 backdrop-blur-md transition-all duration-300 active:scale-90 ${
        active ? "text-destructive" : "text-muted-foreground"
      } ${className}`}
    >
      <Heart className={`h-[18px] w-[18px] ${active ? "fill-current" : ""} ${pop ? "animate-spring-in" : ""}`} />
    </button>
  );
}
