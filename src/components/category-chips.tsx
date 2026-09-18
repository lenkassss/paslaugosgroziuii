import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listStandardServices } from "@/lib/services.functions";
import { SERVICE_CATEGORY_LABELS } from "@/lib/service-taxonomy";
import { Sparkles } from "lucide-react";

/**
 * Kategorijų eilė = vienas šaltinis (`SERVICE_CATEGORY_LABELS`) ta pačia tvarka kaip
 * paieškoje, kad naršymas būtų vienodas visur.
 */
export function CategoryChips() {
  const { data } = useQuery({
    queryKey: ["standard-services"],
    queryFn: () => listStandardServices(),
    staleTime: 10 * 60_000,
  });
  const available = new Set((data?.services ?? []).map((s) => s.category));
  const categories = available.size
    ? SERVICE_CATEGORY_LABELS.filter((c) => available.has(c))
    : SERVICE_CATEGORY_LABELS;
  if (!categories.length) return null;

  return (
    <div className="border-y border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
        <div className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />Paslaugų sritys
        </div>
        <div data-drag-scroll className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {categories.map((c) => (
            <Link
              key={c}
              to="/search"
              search={{ q: "", city: "Visi", category: c, service: "", serviceId: "", brandId: "", date: "", from: "", to: "", onlyAvailable: false } as never}
              className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-border bg-background/60 px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
