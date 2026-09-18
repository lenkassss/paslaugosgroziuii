/**
 * Vienintelis darbo laiko šaltinis visai sistemai.
 *
 * `working_hours` eilutės saugomos su `salon_id` + neobligatoriu `staff_id`:
 * salono bendras grafikas turi `staff_id = null`, o kiekviena meistrė – savo
 * eilutes su `staff_id`. Anksčiau paieška visas eilutes dėdavo į `Map` pagal
 * `salon_id`, todėl meistrės grafikas perrašydavo salono grafiką ir kortelėse
 * matydavosi ne tie laikai. Čia atranka visada aiški.
 */
export type WorkingHourRow = {
  salon_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_closed: boolean | null;
  staff_id?: string | null;
};

export type DayHours = { start: string; end: string; closed: boolean };

export const timeToMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

export const minToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Trumpas „HH:MM“ be sekundžių. */
export const hhmm = (t: string) => t.slice(0, 5);

/**
 * Atrenka tos dienos grafiką: meistrės eilutė, kai `staffId` nurodytas,
 * kitu atveju – salono bendra eilutė (`staff_id = null`).
 */
export function pickDayHours(
  rows: WorkingHourRow[],
  opts: { weekday: number; staffId?: string | null },
): DayHours | null {
  const sameDay = rows.filter((r) => r.weekday === opts.weekday);
  const row = opts.staffId
    ? (sameDay.find((r) => r.staff_id === opts.staffId) ?? sameDay.find((r) => !r.staff_id))
    : sameDay.find((r) => !r.staff_id);
  if (!row) return null;
  return { start: hhmm(row.start_time), end: hhmm(row.end_time), closed: !!row.is_closed };
}

/** Lietuviška „atidaryta / uždaryta“ eilutė kortelėms. */
export function openStatusLabel(
  hours: DayHours | null | undefined,
  nowMinutes?: number,
): { text: string; open: boolean } | null {
  if (!hours) return null;
  if (hours.closed) return { text: "Šiandien uždaryta", open: false };
  const nowMin = nowMinutes ?? (() => {
    const parts = new Intl.DateTimeFormat("lt-LT", {
      timeZone: "Europe/Vilnius",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    return (read("hour") % 24) * 60 + read("minute");
  })();
  const start = timeToMin(hours.start);
  const end = timeToMin(hours.end);
  if (nowMin < start) return { text: `Atidaro ${hours.start}`, open: false };
  if (nowMin >= end) return { text: "Šiandien jau uždaryta", open: false };
  return { text: `Atidaryta iki ${hours.end}`, open: true };
}
