import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Sun, Sunset, Moon, CalendarDays } from "lucide-react";
import { getMarketMonthAvailability, type MarketSlot } from "@/lib/market-availability.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const WEEK_LABELS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const prettyDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("lt-LT", { weekday: "long", day: "numeric", month: "long" });

function bucket(time: string) {
  const h = Number(time.slice(0, 2));
  if (h < 12) return "morning" as const;
  if (h < 17) return "day" as const;
  return "evening" as const;
}

const BUCKETS = [
  { key: "morning", label: "Rytas", sub: "iki 12:00", Icon: Sun },
  { key: "day", label: "Diena", sub: "12:00–17:00", Icon: Sunset },
  { key: "evening", label: "Vakaras", sub: "nuo 17:00", Icon: Moon },
] as const;

/**
 * Booking.com-style month-wide availability across ALL providers.
 * No date selection needed — the whole month is shown at once:
 * red = fully booked / closed, light = free (with slot counts).
 * Tapping a free day slides up every free time in the city.
 */
export function MarketCalendar({
  city,
  category,
  serviceId,
  brandId,
  compact = false,
  onPick,
}: {
  city?: string;
  category?: string;
  serviceId?: string;
  brandId?: string;
  compact?: boolean;
  /** When provided, picking a day/time reports it instead of navigating to /search. */
  onPick?: (date: string, time?: string) => void;
}) {
  const nav = useNavigate();

  const [cursor, setCursor] = useState(() => new Date());
  const [openDate, setOpenDate] = useState<string | null>(null);
  const month = monthKey(cursor);

  const { data, isLoading } = useQuery({
    queryKey: ["market-month", month, city ?? "", category ?? "", serviceId ?? "", brandId ?? ""],
    queryFn: () => getMarketMonthAvailability({
      data: {
        month,
        city: city || undefined,
        category: category || undefined,
        serviceId: serviceId || undefined,
        brandId: brandId || undefined,
      },
    }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const byDate = useMemo(() => new Map((data?.days ?? []).map((d) => [d.date, d])), [data]);
  const overview = useMemo(() => {
    const days = (data?.days ?? []).filter((d) => d.status !== "past");
    const open = days.filter((d) => d.status === "open");
    return {
      openDays: open.length,
      slots: open.reduce((sum, d) => sum + d.slotCount, 0),
      blocked: days.filter((d) => d.status !== "open").length,
      nextOpen: open[0]?.date ?? null,
    };
  }, [data]);

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const canGoBack = month > monthKey(new Date());
  const shift = (delta: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const slots: MarketSlot[] = (openDate && data?.slotsByDate?.[openDate]) || [];
  const grouped = BUCKETS.map((b) => ({ ...b, items: slots.filter((s) => bucket(s.time) === b.key) }));

  const goto = (date: string, time?: string) => {
    setOpenDate(null);
    if (onPick) { onPick(date, time); return; }
    nav({
      to: "/search",
      search: {
        q: "",
        city: city || "Visi",
        category: category || "Visos",
        service: "",
        serviceId: serviceId || "",
        brandId: brandId || "",
        date,
        from: time ?? "",
        to: time ? `${String(Number(time.slice(0, 2)) + 2).padStart(2, "0")}:00` : "",
        onlyAvailable: true,
      },
    });
  };


  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-elegant backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-2 border-b border-border/60 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl gradient-gold text-primary-foreground">
            <CalendarDays className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold capitalize">
              {cursor.toLocaleDateString("lt-LT", { month: "long", year: "numeric" })}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {city ? city : "Visa Lietuva"} · viso mėnesio laisvi laikai
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full active:scale-95"
            onClick={() => shift(-1)} disabled={!canGoBack} aria-label="Ankstesnis mėnuo">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-full active:scale-95"
            onClick={() => shift(1)} aria-label="Kitas mėnuo">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Instant month overview — no date picking required */}
      <div className="relative border-b border-border/60 bg-accent/30 px-3 py-2.5 text-xs">
        {isLoading ? (
          <Skeleton className="h-4 w-56" />
        ) : overview.openDays > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              {overview.openDays} laisvos dienos · {overview.slots} laisvų laikų
            </span>
            {overview.blocked > 0 && (
              <span className="text-muted-foreground">{overview.blocked} d. užimta</span>
            )}
            {overview.nextOpen && (
              <button type="button" onClick={() => setOpenDate(overview.nextOpen)}
                className="font-medium text-primary underline-offset-2 hover:underline active:scale-95">
                Artimiausia: {prettyDate(overview.nextOpen)}
              </button>
            )}
          </div>
        ) : (
          <span className="font-medium text-destructive">Šį mėnesį laisvų laikų nėra — pažiūrėk kitą mėnesį.</span>
        )}
      </div>

      <div className="relative p-3">
        <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {WEEK_LABELS.map((w) => <div key={w}>{w}</div>)}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className={compact ? "h-11 rounded-xl" : "h-14 rounded-xl"} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = `${month}-${String(day).padStart(2, "0")}`;
              const info = byDate.get(date);
              const status = info?.status ?? "closed";
              const open = status === "open";
              const past = status === "past";
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!open}
                  onClick={() => { setOpenDate(date); onPick?.(date); }}
                  aria-label={open ? `${date} – ${info?.slotCount} laisvų laikų` : `${date} – nėra laisvų laikų`}
                  className={[
                    "relative flex flex-col items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300 ease-out",
                    compact ? "h-11 min-h-[44px]" : "h-14 min-h-[44px]",
                    open
                      ? "border border-border bg-background/70 text-foreground hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow active:scale-95"
                      : past
                        ? "text-muted-foreground/30"
                        : "bg-destructive/10 text-destructive/80",
                  ].join(" ")}
                >
                  <span>{day}</span>
                  {open ? (
                    <span className="mt-0.5 text-[10px] font-medium text-success">
                      {compact ? "•" : `${info!.slotCount} laik.`}
                    </span>
                  ) : !past ? (
                    <span className="mt-1 h-1 w-3.5 rounded-full bg-destructive/50" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Laisva</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3.5 rounded-full bg-destructive/50" />Užimta / nedirba</span>
          <span className="ml-auto hidden sm:inline">Paspausk dieną — pamatysi visus laisvus laikus</span>
        </div>
      </div>

      {openDate && (
        <div className="relative border-t border-border/60 bg-accent/20 px-3 pb-4 pt-3 animate-fade-in">
          <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-lg capitalize">{prettyDate(openDate)}</h3>
              <p className="text-xs text-muted-foreground">
                {slots.length > 0
                  ? `${byDate.get(openDate)?.salonCount ?? 0} salonų · ${byDate.get(openDate)?.slotCount ?? 0} laisvų laikų`
                  : "Šią dieną laisvų laikų nėra."}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => setOpenDate(null)} aria-label="Uždaryti laikus">
              <span aria-hidden>×</span>
            </Button>
          </div>
            {grouped.map(({ key, label, sub, Icon, items }) => items.length > 0 && (
              <div key={key} className="mb-4 animate-fade-in">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" /> {label}
                  <span className="font-normal normal-case tracking-normal">{sub}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {items.map((sl) => (
                    <button
                      key={sl.time}
                      type="button"
                      onClick={() => goto(openDate!, sl.time)}
                      className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-border bg-background/70 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-glow active:scale-95"
                    >
                      {sl.time}
                      <span className="text-[10px] font-normal text-muted-foreground">{sl.salonCount} salon.</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          <Button className="mt-1 h-12 w-full rounded-xl gradient-gold text-primary-foreground active:scale-95"
            onClick={() => goto(openDate)}>
            <Sparkles className="mr-2 h-4 w-4" />
            {onPick ? "Pasirinkti šią dieną" : "Rodyti visus salonus šią dieną"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function MarketCalendarHeading({ count }: { count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-xl font-semibold sm:text-2xl">
        Laisvi laikai <span className="text-gradient-gold">visą mėnesį</span>
      </h2>
      {typeof count === "number" && <Badge variant="secondary" className="shrink-0">{count} salonų</Badge>}
    </div>
  );
}
