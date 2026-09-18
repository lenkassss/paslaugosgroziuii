import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2, CalendarCheck } from "lucide-react";
import { getMonthAvailability } from "@/lib/platform.functions";
import { Button } from "@/components/ui/button";

const WEEK_LABELS = ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function prettyDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("lt-LT", {
    weekday: "long", day: "numeric", month: "long",
  });
}

/**
 * Booking.com-style full-month availability grid.
 * - Fully booked / closed days: red badge, not tappable.
 * - Open days: neutral surface + green availability dot and free-slot count.
 * - No date chosen: shows an instant month-wide availability overview.
 * - Tapping an open day slides up a bottom drawer with all free time slots.
 */
export function BookingCalendar({
  salonId,
  duration,
  staffId,
  selectedDate,
  onSelectDate,
  children,
}: {
  salonId: string;
  duration: number;
  staffId?: string | null;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  children?: React.ReactNode;
}) {
  const [cursor, setCursor] = useState(() => (selectedDate ? new Date(selectedDate + "T00:00:00") : new Date()));
  const month = monthKey(cursor);

  const { data, isLoading } = useQuery({
    queryKey: ["month-availability", salonId, month, duration, staffId ?? null],
    queryFn: () => getMonthAvailability({ data: { salonId, month, duration, staffId: staffId ?? null } }),
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const byDate = useMemo(() => new Map((data?.days ?? []).map((d) => [d.date, d])), [data]);

  const overview = useMemo(() => {
    const days = (data?.days ?? []).filter((d) => d.status !== "past");
    const openDays = days.filter((d) => d.status === "open");
    return {
      openDays: openDays.length,
      totalSlots: openDays.reduce((sum, d) => sum + d.freeCount, 0),
      blockedDays: days.filter((d) => d.status === "full" || d.status === "closed").length,
      nextOpen: openDays[0]?.date ?? null,
    };
  }, [data]);

  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const thisMonth = monthKey(new Date());
  const canGoBack = month > thisMonth;

  const shift = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const pick = (date: string) => {
    onSelectDate(date);
  };

  return (
    <div className="overflow-hidden rounded-2xl glass">
      <div className="flex items-center justify-between border-b border-border/60 px-2 py-2">
        <Button
          type="button" variant="ghost" size="icon"
          className="touch-target rounded-full active:scale-95"
          onClick={() => shift(-1)} disabled={!canGoBack} aria-label="Ankstesnis mėnuo"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-sm font-semibold capitalize">
          {cursor.toLocaleDateString("lt-LT", { month: "long", year: "numeric" })}
        </div>
        <Button
          type="button" variant="ghost" size="icon"
          className="touch-target rounded-full active:scale-95"
          onClick={() => shift(1)} aria-label="Kitas mėnuo"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Instant month-wide overview when nothing is picked yet */}
      {!selectedDate && !isLoading && (
        <div className="animate-fade-in border-b border-border/60 bg-accent/40 px-3 py-2.5 text-xs">
          {overview.openDays > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                <span className="h-2 w-2 rounded-full bg-success" />
                {overview.openDays} laisvos dienos · {overview.totalSlots} laisvų laikų
              </span>
              {overview.nextOpen && (
                <button
                  type="button"
                 onClick={() => overview.nextOpen && pick(overview.nextOpen)}
                  className="font-medium text-primary underline-offset-2 hover:underline active:scale-95"
                >
                  Artimiausias: {prettyDate(overview.nextOpen)}
                </button>
              )}
            </div>
          ) : (
            <span className="font-medium text-destructive">Šį mėnesį laisvų laikų nėra — pabandyk kitą mėnesį.</span>
          )}
        </div>
      )}

      <div className="p-3">
        <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {WEEK_LABELS.map((w) => <div key={w}>{w}</div>)}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Kraunamas kalendorius…
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={`b-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = `${month}-${String(day).padStart(2, "0")}`;
              const info = byDate.get(date);
              const status = info?.status ?? "closed";
              const disabled = status !== "open";
              const isSelected = selectedDate === date;

              const base =
                "relative flex h-12 min-h-[44px] flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-300 ease-out";
              const style =
                isSelected
                  ? "gradient-gold text-primary-foreground shadow-glow scale-[1.03]"
                  : status === "open"
                    ? "bg-card/70 border border-border text-foreground hover:border-primary/40 hover:bg-accent active:scale-95"
                    : status === "full" || status === "closed"
                      ? "bg-red-500/15 text-red-600 font-semibold cursor-not-allowed"
                      : "text-muted-foreground/40 cursor-not-allowed";

              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(date)}
                  aria-label={`${date}${status === "open" ? ` – ${info?.freeCount} laisvi laikai` : " – nėra laisvų laikų"}`}
                  className={`${base} ${style}`}
                >
                  {day}
                  {status === "open" && !isSelected && (
                    <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-success" />
                  )}
                  {(status === "full" || status === "closed") && (
                    <span className="absolute bottom-1 h-1 w-3 rounded-full bg-red-500/60" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Laisva</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-3 rounded-full bg-red-500/60" />Užimta / nedirba</span>
        </div>

        {selectedDate && (
          <div className="mt-3 rounded-2xl border border-border/60 bg-accent/25 p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold capitalize">
              <CalendarCheck className="h-4 w-4 text-primary" /> {prettyDate(selectedDate)}
            </div>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
