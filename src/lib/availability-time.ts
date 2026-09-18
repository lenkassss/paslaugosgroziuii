/**
 * Vienintelis „dabar" šaltinis laisvų laikų skaičiavimui.
 *
 * Serveris veikia UTC laiku, todėl `new Date().getHours()` Vilniuje rodydavo
 * 2–3 val. ankstesnį laiką ir jau praėję laikai (pvz. 17:00, kai jau 17:40)
 * vis dar būdavo rodomi laisvi. Čia visada skaičiuojame pagal Europe/Vilnius.
 */
const TZ = "Europe/Vilnius";

const fmt = new Intl.DateTimeFormat("lt-LT", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export type LocalNow = {
  /** „YYYY-MM-DD" pagal Vilniaus laiką. */
  date: string;
  /** Minutės nuo vidurnakčio pagal Vilniaus laiką. */
  minutes: number;
};

export function localNow(now: Date = new Date()): LocalNow {
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  const hour = Number(get("hour")) % 24;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: hour * 60 + Number(get("minute")),
  };
}

/** JS weekday (0 = sekmadienis) pagal Vilniaus datą. */
export function localWeekday(now: Date = new Date()): number {
  const local = localNow(now).date;
  return new Date(`${local}T12:00:00Z`).getUTCDay();
}

/** Vilniaus šiandiena ir rytojus, nepriklausomai nuo serverio laiko zonos. */
export function localDayRange(now: Date = new Date()) {
  const today = localNow(now).date;
  const next = new Date(`${today}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const tomorrow = next.toISOString().slice(0, 10);
  return [
    { date: today, weekday: new Date(`${today}T12:00:00Z`).getUTCDay(), isToday: true },
    { date: tomorrow, weekday: next.getUTCDay(), isToday: false },
  ];
}

/**
 * Ankstyviausia minutė, kurią dar galima rezervuoti nurodytą dieną.
 * Grąžina `null`, jei diena visai uždaryta (praeitis arba „uždaryta šiandien").
 */
export function earliestBookableMinute(opts: {
  date: string;
  minAdvanceMins?: number | null;
  sameDayClosedOn?: string | null;
  now?: Date;
}): number | null {
  const n = localNow(opts.now);
  if (opts.date < n.date) return null;
  if (opts.date > n.date) return 0;
  if (opts.sameDayClosedOn && opts.sameDayClosedOn === n.date) return null;
  return n.minutes + Math.max(0, opts.minAdvanceMins ?? 0);
}

/** Minimalaus išankstinio laiko variantai nustatymų ekrane. */
export const MIN_ADVANCE_OPTIONS = [
  { mins: 0, label: "Be apribojimų" },
  { mins: 30, label: "Bent 30 min. prieš" },
  { mins: 60, label: "Bent 1 val. prieš" },
  { mins: 120, label: "Bent 2 val. prieš" },
  { mins: 180, label: "Bent 3 val. prieš" },
  { mins: 1440, label: "Bent 1 dieną prieš" },
] as const;
