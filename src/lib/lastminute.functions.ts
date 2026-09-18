import { createServerFn } from "@tanstack/react-start";
import { localDayRange, localNow } from "@/lib/availability-time";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toStr = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export type LastMinuteDeal = {
  salonId: string;
  salonName: string;
  city: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  serviceId: string;
  serviceName: string;
  durationMins: number;
  price: number;
  finalPrice: number;
  discountPct: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  isToday: boolean;
};

const dateStr = (d: Date) => d.toISOString().slice(0, 10);

function activeDiscount(sv: {
  price: number | string;
  discount_percent: number | null;
  discount_price: number | string | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}) {
  const price = Number(sv.price);
  const now = Date.now();
  const started = !sv.discount_starts_at || new Date(sv.discount_starts_at).getTime() <= now;
  const notEnded = !sv.discount_ends_at || new Date(sv.discount_ends_at).getTime() >= now;
  if (started && notEnded) {
    if (sv.discount_price !== null && Number(sv.discount_price) > 0 && Number(sv.discount_price) < price) {
      const fin = Number(sv.discount_price);
      return { finalPrice: fin, discountPct: Math.round(((price - fin) / price) * 100) };
    }
    if (sv.discount_percent && sv.discount_percent > 0) {
      const pct = Math.min(90, sv.discount_percent);
      return { finalPrice: Math.round(price * (1 - pct / 100) * 100) / 100, discountPct: pct };
    }
  }
  return { finalPrice: price, discountPct: 0 };
}

export const listLastMinuteDeals = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();

  const { data: rows } = await s
    .from("profiles")
    .select("id, business_name, city, avatar_url, cover_url")
    .eq("suspended", false)
    .is("blocked_at", null)
    .or("is_approved.eq.true,subscription_active.eq.true")
    .not("business_name", "is", null)
    .limit(150);
  if (!rows?.length) return { deals: [] as LastMinuteDeal[] };

  const { data: roles } = await s.rpc("list_provider_roles");
  const providerIds = new Set((roles ?? []).map((r: { user_id: string }) => r.user_id));
  const salons = rows.filter((r) => providerIds.has(r.id));
  if (!salons.length) return { deals: [] as LastMinuteDeal[] };
  const ids = salons.map((r) => r.id);

  const days = localDayRange();

  const [svcRes, hoursRes, apptRes, blockRes] = await Promise.all([
    s.from("services")
      .select("id, salon_id, name, price, duration_mins, discount_percent, discount_price, discount_starts_at, discount_ends_at")
      .in("salon_id", ids)
      .limit(1500),
    s.from("working_hours").select("salon_id, weekday, start_time, end_time, is_closed, staff_id").in("salon_id", ids).is("staff_id", null),
    s.from("appointments").select("salon_id, appointment_date, time_slot, duration_mins")
      .in("salon_id", ids).in("appointment_date", days.map((d) => d.date)).in("status", ["confirmed", "pending"]),
    s.from("time_blocks").select("salon_id, block_date, start_time, end_time")
      .in("salon_id", ids).in("block_date", days.map((d) => d.date)),
  ]);

  const svcBySalon = new Map<string, NonNullable<typeof svcRes.data>>();
  for (const sv of svcRes.data ?? []) {
    const arr = svcBySalon.get(sv.salon_id) ?? [];
    arr.push(sv);
    svcBySalon.set(sv.salon_id, arr);
  }

  const hoursKey = (salon: string, wd: number) => `${salon}|${wd}`;
  const hoursMap = new Map((hoursRes.data ?? []).map((h) => [hoursKey(h.salon_id, h.weekday), h]));

  const busyKey = (salon: string, date: string) => `${salon}|${date}`;
  const busyMap = new Map<string, Array<[number, number]>>();
  const pushBusy = (k: string, span: [number, number]) => {
    const arr = busyMap.get(k) ?? [];
    arr.push(span);
    busyMap.set(k, arr);
  };
  for (const a of apptRes.data ?? []) {
    pushBusy(busyKey(a.salon_id, a.appointment_date), [toMin(a.time_slot), toMin(a.time_slot) + (a.duration_mins ?? 60)]);
  }
  for (const b of blockRes.data ?? []) {
    pushBusy(busyKey(b.salon_id, b.block_date), [toMin(b.start_time), toMin(b.end_time)]);
  }

  const nowMin = localNow().minutes;
  const deals: LastMinuteDeal[] = [];

  for (const salon of salons) {
    const svcs = (svcBySalon.get(salon.id) ?? []).slice();
    if (!svcs.length) continue;
    // Discounted services first — those are the real "hot deals".
    svcs.sort((a, b) => (b.discount_percent ?? 0) - (a.discount_percent ?? 0));

    for (const sv of svcs.slice(0, 2)) {
      const duration = sv.duration_mins ?? 60;
      let found: { date: string; time: string; isToday: boolean } | null = null;
      for (const day of days) {
        const hours = hoursMap.get(hoursKey(salon.id, day.weekday));
        if (!hours || hours.is_closed) continue;
        const busy = busyMap.get(busyKey(salon.id, day.date)) ?? [];
        const start = toMin(hours.start_time);
        const end = toMin(hours.end_time);
        for (let m = start; m + duration <= end; m += 30) {
          if (day.isToday && m <= nowMin + 60) continue;
          const slotEnd = m + duration;
          if (busy.some(([a, b]) => m < b && slotEnd > a)) continue;
          found = { date: day.date, time: toStr(m), isToday: day.isToday };
          break;
        }
        if (found) break;
      }
      if (!found) continue;
      const { finalPrice, discountPct } = activeDiscount(sv);
      deals.push({
        salonId: salon.id,
        salonName: salon.business_name ?? "",
        city: salon.city,
        avatarUrl: salon.avatar_url,
        coverUrl: salon.cover_url,
        serviceId: sv.id,
        serviceName: sv.name,
        durationMins: duration,
        price: Number(sv.price),
        finalPrice,
        discountPct,
        date: found.date,
        time: found.time,
        isToday: found.isToday,
      });
    }
  }

  deals.sort((a, b) => {
    if (b.discountPct !== a.discountPct) return b.discountPct - a.discountPct;
    return `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
  });

  return { deals: deals.slice(0, 12) };
});
