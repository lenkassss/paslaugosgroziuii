import { uiText } from "@/lib/ui-copy";

/**
 * Fiksuotos aktualijų kategorijos: Visi · Naujienos · Tendencijos · Specialūs pasiūlymai · Patarimai.
 * Kiekviena apima kelis įrašų kategorijų pavadinimus (senus ir naujus).
 */
export const FEED_CATEGORIES: Array<{ key: string; label: string; match: string[] }> = [
  { key: "all", label: "Visi", match: [] },
  { key: "naujienos", label: "Naujienos", match: ["naujienos", "aktualijos", "news"] },
  { key: "tendencijos", label: "Tendencijos", match: ["tendencijos", "trends"] },
  { key: "pasiulymai", label: "Specialūs pasiūlymai", match: ["specialūs pasiūlymai", "akcijos", "pasiūlymai", "promo"] },
  { key: "patarimai", label: "Patarimai", match: ["patarimai", "tips", "gidas"] },
];

/** Ar įrašo kategorija patenka į pasirinktą skiltį. */
export function matchesFeedCategory(key: string, category?: string | null) {
  if (key === "all") return true;
  const group = FEED_CATEGORIES.find((c) => c.key === key);
  if (!group) return true;
  const value = String(category ?? "").toLowerCase();
  return group.match.some((m) => value.includes(m));
}

export function FeedCategoryFilter({ active, onChange }: { active: string; onChange: (next: string) => void }) {
  const language = typeof document === "undefined" ? "lt" : document.documentElement.lang;
  return (
    <div data-drag-scroll className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {FEED_CATEGORIES.map((c) => {
        const isActive = c.key === active;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all active:scale-95 ${
              isActive
                ? "gradient-gold border-transparent text-primary-foreground shadow-glow"
                : "border-border/60 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {uiText(c.label, language)}
          </button>
        );
      })}
    </div>
  );
}
