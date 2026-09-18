import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Zap, Clock, MapPin } from "lucide-react";
import { listLastMinuteDeals, type LastMinuteDeal } from "@/lib/lastminute.functions";
import { useTranslation } from "react-i18next";

const eur = (n: number) => `${n.toFixed(2).replace(/\.00$/, "")} €`;

export function LastMinuteDeals() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["last-minute-deals"],
    queryFn: () => listLastMinuteDeals(),
    staleTime: 60_000,
  });

  const deals = data?.deals ?? [];
  if (!isLoading && deals.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
            <Zap className="h-3.5 w-3.5 shrink-0" /> {t("deals.eyebrow")}
          </div>
          <h2 className="mt-1 font-display text-xl sm:text-2xl md:text-3xl">{t("deals.title")}</h2>
          <p className="mt-1 hidden max-w-xl text-sm text-muted-foreground sm:block">{t("deals.sub")}</p>
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/search" search={{ q: "", city: "Visi", category: "Visos", service: "", serviceId: "", date: "", from: "", to: "", onlyAvailable: true }}>
            {t("deals.all")}
          </Link>
        </Button>
      </div>

      <div data-drag-scroll className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="min-w-[260px] snap-start p-4 md:min-w-0">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
                <Skeleton className="mt-4 h-10 w-full" />
              </Card>
            ))
          : deals.map((d: LastMinuteDeal) => <DealCard key={`${d.salonId}-${d.serviceId}-${d.time}`} deal={d} />)}
      </div>
    </section>
  );
}

function DealCard({ deal }: { deal: LastMinuteDeal }) {
  const { t } = useTranslation();
  const when = `${deal.isToday ? t("deals.today") : t("deals.tomorrow")} ${deal.time}`;
  return (
    <Card className="group relative flex min-w-[260px] snap-start flex-col overflow-hidden border-border/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant md:min-w-0">
      {deal.discountPct > 0 && (
        <Badge className="absolute right-3 top-3 gradient-gold border-0 text-primary-foreground">-{deal.discountPct}%</Badge>
      )}

      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0 border border-primary/20">
          <AvatarImage src={deal.avatarUrl ?? undefined} alt={deal.salonName} />
          <AvatarFallback className="bg-primary/10 text-xs text-primary">{deal.salonName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium">{deal.salonName}</p>
          {deal.city && (
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" /> {deal.city}
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm text-foreground/90">{deal.serviceName}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <Clock className="h-3 w-3" /> {when}
        </span>
        <span className="text-xs text-muted-foreground">{deal.durationMins} min</span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        {deal.discountPct > 0 && <span className="text-sm text-muted-foreground line-through">{eur(deal.price)}</span>}
        <span className="font-display text-xl text-primary">{eur(deal.finalPrice)}</span>
      </div>

      <Button asChild className="mt-4 h-11 w-full gradient-gold text-primary-foreground btn-press hover:opacity-90">
        <Link to="/salon/$id" params={{ id: deal.salonId }}>{t("deals.book")}</Link>
      </Button>
    </Card>
  );
}
