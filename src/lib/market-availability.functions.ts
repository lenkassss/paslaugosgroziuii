import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { earliestBookableMinute, localNow } from "@/lib/availability-time";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toStr = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export type MarketDay = {
  date: string;
  status: "past" | "closed" | "full" | "open";
  slotCount: number;
  salonCount: number;
};

export type MarketSlot = { time: string; salonCount: number };

/**
 * Month-wide availability across ALL matching providers (Booking.com style).
 * Returns one entry per calendar day + free time slots per day (union across salons).
 */
export const getMarketMonthAvailability = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    city: z.string().optional(),
    category: z.string().optional(),
    serviceId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const [yearStr, monthStr] = data.month.split("-");
    const year = Number(yearStr);
    const monthIdx = Number(monthStr) - 1;
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const first = `${data.month}-01`;
    const last = `${data.month}-${String(daysInMonth).padStart(2, "0")}`;

    const emptyDays = (): MarketDay[] => {
      const todayStr = new Date().toISOString().slice(0, 10);
      return Array.from({ length: daysInMonth }, (_, i) => {
        const date = `${data.month}-${String(i + 1).padStart(2, "0")}`;
        return { date, status: date < todayStr ? "past" : "closed", slotCount: 0, salonCount: 0 } as MarketDay;
      });
    };

    let q = s.from("profiles")
      .select("id, business_name, city, category")
      .eq("suspended", false)
      .is("blocked_at", null)
      .or("is_approved.eq.true,subscription_active.eq.true")
      .not("business_name", "is", null);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.category) q = q.eq("category", data.category);
    const { data: rows } = await q.limit(200);
    if (!rows?.length) return { month: data.month, days: emptyDays(), slotsByDate: {} as Record<string, MarketSlot[]> };

    const { data: roles } = await s.rpc("list_provider_roles");
    const roleById = new Map((roles ?? []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]));
    let ids = rows.filter((r) => roleById.has(r.id)).map((r) => r.id);

    if (data.brandId) {
      const { data: pb } = await s.from("provider_brands").select("profile_id").eq("brand_id", data.brandId);
      const allowed = new Set((pb ?? []).map((r) => r.profile_id));
      ids = ids.filter((id) => allowed.has(id));
    }

    // Service duration per salon (when a specific standard service is requested)
    const durationBySalon = new Map<string, number>();
    if (data.serviceId) {
      const { data: servs } = await s.from("services")
        .select("salon_id, duration_mins")
        .in("salon_id", ids)
        .eq("standard_service_id", data.serviceId);
      for (const sv of servs ?? []) {
        if (!durationBySalon.has(sv.salon_id)) durationBySalon.set(sv.salon_id, sv.duration_mins ?? 60);
      }
      ids = ids.filter((id) => durationBySalon.has(id));
    }
    if (!ids.length) return { month: data.month, days: emptyDays(), slotsByDate: {} as Record<string, MarketSlot[]> };

    const [hoursRes, apptRes, blocksRes] = await Promise.all([
      s.from("working_hours").select("salon_id, weekday, start_time, end_time, is_closed, staff_id").in("salon_id", ids),
      s.from("appointments").select("salon_id, appointment_date, time_slot, duration_mins")
        .in("salon_id", ids).gte("appointment_date", first).lte("appointment_date", last)
        .in("status", ["pending", "confirmed"]),
      s.from("time_blocks").select("salon_id, block_date, start_time, end_time")
        .in("salon_id", ids).gte("block_date", first).lte("block_date", last),
    ]);

    const hoursMap = new Map<string, Map<number, { start: number; end: number; closed: boolean }>>();
    for (const h of hoursRes.data ?? []) {
      if (h.staff_id) continue;
      const m = hoursMap.get(h.salon_id) ?? new Map();
      m.set(h.weekday, { start: toMin(h.start_time), end: toMin(h.end_time), closed: !!h.is_closed });
      hoursMap.set(h.salon_id, m);
    }

    const busy = new Map<string, Array<[number, number]>>(); // key `${salon}|${date}`
    const pushBusy = (key: string, range: [number, number]) => {
      const arr = busy.get(key) ?? [];
      arr.push(range);
      busy.set(key, arr);
    };
    for (const a of apptRes.data ?? []) {
      const st = toMin(a.time_slot);
      pushBusy(`${a.salon_id}|${a.appointment_date}`, [st, st + (a.duration_mins ?? 60)]);
    }
    for (const b of blocksRes.data ?? []) {
      pushBusy(`${b.salon_id}|${b.block_date}`, [toMin(b.start_time), toMin(b.end_time)]);
    }

    const todayStr = localNow().date;
    const days: MarketDay[] = [];
    const slotsByDate: Record<string, MarketSlot[]> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${data.month}-${String(d).padStart(2, "0")}`;
      if (date < todayStr) { days.push({ date, status: "past", slotCount: 0, salonCount: 0 }); continue; }
      const weekday = new Date(`${date}T00:00:00`).getDay();
      const earliest = earliestBookableMinute({ date, minAdvanceMins: 0 }) ?? Number.POSITIVE_INFINITY;
      const counts = new Map<string, number>(); // time -> salons free
      let salonCount = 0;
      let anyOpen = false;

      for (const id of ids) {
        const hours = hoursMap.get(id)?.get(weekday);
        if (!hours || hours.closed) continue;
        anyOpen = true;
        const duration = durationBySalon.get(id) ?? 60;
        const ranges = busy.get(`${id}|${date}`) ?? [];
        let salonHasSlot = false;
        for (let m = hours.start; m + duration <= hours.end; m += 30) {
          if (m < earliest) continue;
          const end = m + duration;
          if (ranges.some(([a, b]) => m < b && end > a)) continue;
          salonHasSlot = true;
          const key = toStr(m);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        if (salonHasSlot) salonCount++;
      }

      const slots: MarketSlot[] = Array.from(counts.entries())
        .map(([time, salonCount]) => ({ time, salonCount }))
        .sort((a, b) => a.time.localeCompare(b.time));
      const slotCount = slots.reduce((sum, sl) => sum + sl.salonCount, 0);
      if (slots.length) slotsByDate[date] = slots;
      days.push({
        date,
        status: slots.length ? "open" : anyOpen ? "full" : "closed",
        slotCount,
        salonCount,
      });
    }

    return { month: data.month, days, slotsByDate };
  });
