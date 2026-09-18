import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { useHydrated } from "@/hooks/use-hydrated";

export type WorkingHour = {
  weekday: number;
  is_closed: boolean | null;
  start_time: string;
  end_time: string;
};

const DAYS: Record<string, string[]> = {
  lt: ["Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis", "Sekmadienis"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  ru: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
};

const SHORT: Record<string, string[]> = {
  lt: ["Pr", "An", "Tr", "Kt", "Pn", "Št", "Sk"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};

/** Rows render Monday-first; the DB stores JS `getDay()` (0 = Sunday). */
function dbWeekday(mondayFirstIndex: number) {
  return (mondayFirstIndex + 1) % 7;
}

/** JS Date.getDay() (0 = Sunday) → our Monday-first index. */
function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

/**
 * Luxury "Working hours" card — one row per weekday, today highlighted,
 * closed days clearly marked in red, missing days muted.
 */
export function WorkingHoursCard({ hours }: { hours: WorkingHour[] }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage ?? "lt").slice(0, 2);
  const names = DAYS[lang] ?? DAYS["lt"]!;
  const short = SHORT[lang] ?? SHORT["lt"]!;
  // Server and client can sit in different time zones, so only highlight
  // "today" after hydration to keep SSR markup identical.
  const hydrated = useHydrated();
  const today = hydrated ? todayIndex() : -1;

  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 p-0 shadow-elegant">
      <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/60 px-5 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl gradient-gold text-primary-foreground shadow-glow">
          <Clock className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg leading-tight">{t("salon.schedule")}</h3>
          <p className="truncate text-[11px] text-muted-foreground">{t("salon.scheduleHint")}</p>
        </div>
      </div>

      <ul className="divide-y divide-border/50">
        {names.map((name, i) => {
          const h = hours.find((x) => x.weekday === dbWeekday(i));
          const closed = !h || !!h.is_closed;
          const isToday = i === today;
          return (
            <li
              key={i}
              className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 ${
                isToday ? "bg-primary/5" : ""
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${
                    isToday ? "gradient-gold text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {short[i]}
                </span>
                <span className={`truncate text-sm ${isToday ? "font-semibold" : "text-muted-foreground"}`}>
                  {name}
                </span>
              </span>

              {closed ? (
                <span className="shrink-0 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                  {t("salon.closed")}
                </span>
              ) : (
                <span className="shrink-0 font-mono text-sm tabular-nums">
                  {h!.start_time.slice(0, 5)} – {h!.end_time.slice(0, 5)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
