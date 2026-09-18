import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Calendar, MapPin, Tag, Clock, Search, Sparkles } from "lucide-react";
import { listSearchOptions } from "@/lib/availability.functions";

export function QuickSearch({ compact = false }: { compact?: boolean }) {
  const nav = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const [service, setService] = useState("");
  const [city, setCity] = useState("");

  const { data: opts } = useQuery({
    queryKey: ["search-options"],
    queryFn: () => listSearchOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const submit = () => {
    nav({ to: "/search", search: { q: "", city: city || "Visi", category: "Visos", service, date: "", from: "", to: "", onlyAvailable: !!service } });
  };

  const serviceOptions = (opts?.services ?? []).map((s) => ({ value: s, label: s }));
  const cityOptions = (opts?.cities ?? []).map((c) => ({ value: c, label: c }));
  const popular = (opts?.services ?? []).slice(0, 5);

  return (
    <Card className={`${compact ? "p-3" : "p-4 md:p-5"} border-primary/30 bg-background/80 backdrop-blur shadow-elegant`}>
      {!compact && (
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-semibold flex items-center gap-1.5 mb-3">
          <Sparkles className="h-3.5 w-3.5" />Ką norite užsisakyti?
        </div>
      )}
      <div className="grid md:grid-cols-[1.8fr_1fr_auto] gap-2 items-end">
        <div>
          <Label className="text-xs">Paslauga</Label>
          <Combobox
            options={serviceOptions}
            value={service}
            onChange={setService}
            placeholder="Pvz. Manikiūras..."
            searchPlaceholder="Rašyk paslaugą..."
          />
        </div>
        <div>
          <Label className="text-xs">Miestas</Label>
          <Combobox
            options={cityOptions}
            value={city}
            onChange={setCity}
            placeholder="Visi miestai"
            searchPlaceholder="Ieškoti..."
          />
        </div>
        <Button onClick={submit} className="gradient-gold text-primary-foreground btn-press hover:opacity-90 h-10 whitespace-nowrap">
          <Search className="h-4 w-4 mr-1.5" />Ieškoti
        </Button>
      </div>
      {!compact && popular.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground self-center mr-1">Populiaru:</span>
          {popular.map((s) => (
            <button
              key={s}
              onClick={() => { setService(s); }}
              className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary transition"
            >{s}</button>
          ))}
        </div>
      )}
    </Card>
  );
}



type WeekItem = {
  id: string; slug: string; title: string; cover_url: string | null; category: string; kind: string;
  event_starts_at?: string | null; event_location?: string | null; event_price_eur?: number | string | null;
  promo_discount_pct?: number | null; promo_ends_at?: string | null;
};

export function WeeklyStrip({ events, promos }: { events: WeekItem[]; promos: WeekItem[] }) {
  const items = [...events.slice(0, 4), ...promos.slice(0, 4)];
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl font-semibold">Šią savaitę</h2>
        <div className="flex gap-3 text-xs">
          <Link to="/feed/renginiai" className="text-primary hover:underline">Visi renginiai →</Link>
          <Link to="/feed/akcijos" className="text-primary hover:underline">Visos akcijos →</Link>
        </div>
      </div>
      <div data-drag-scroll className="no-scrollbar flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 md:mx-0 md:px-0 snap-x">
        {items.map((it) => (
          <Link key={it.id} to="/article/$slug" params={{ slug: it.slug }} className="snap-start shrink-0 w-64 group">
            <Card className="overflow-hidden h-full border-border/60 hover:border-primary/40 hover:shadow-elegant transition-all">
              {it.cover_url && (
                <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                  <img src={it.cover_url} alt={it.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-2 left-2">
                    {it.kind === "event" ? (
                      <Badge className="gradient-gold text-primary-foreground border-0"><Calendar className="h-3 w-3 mr-1" />Renginys</Badge>
                    ) : (
                      <Badge className="bg-destructive/90 text-destructive-foreground border-0"><Tag className="h-3 w-3 mr-1" />-{it.promo_discount_pct}%</Badge>
                    )}
                  </div>
                </div>
              )}
              <div className="p-3">
                <div className="font-display font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition">{it.title}</div>
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  {it.kind === "event" && it.event_starts_at ? (
                    <><Calendar className="h-3 w-3" />{new Date(it.event_starts_at).toLocaleDateString("lt-LT", { day: "numeric", month: "short" })}
                    {it.event_location && <><MapPin className="h-3 w-3 ml-1" />{it.event_location.split(",")[0]}</>}</>
                  ) : (
                    <><Clock className="h-3 w-3" />iki {it.promo_ends_at && new Date(it.promo_ends_at).toLocaleDateString("lt-LT", { day: "numeric", month: "short" })}</>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
