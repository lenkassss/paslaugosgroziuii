import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { pickDayHours, type DayHours, type WorkingHourRow } from "@/lib/working-hours";
import { earliestBookableMinute } from "@/lib/availability-time";


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

export type AvailabilitySalon = {
  id: string;
  business_name: string | null;
  city: string | null;
  address: string | null;
  category: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  lat: number | null;
  lng: number | null;
  kind: "salon" | "specialist";
  service: { id: string; name: string; price: number; duration_mins: number; category: string } | null;
  brands: string[];
  slots: string[];
  nextSlot: string | null;
  nextSlotDate: string | null;
  todayHours: DayHours | null;
};

// Compute up to `limit` free slots for a salon on given date within [fromMin, toMin] window.
function computeSlots(opts: {
  workStart: number; workEnd: number;
  fromMin: number; toMin: number;
  duration: number; step: number;
  busy: Array<[number, number]>;
  earliest: number;
  limit: number;
}): string[] {
  const { workStart, workEnd, fromMin, toMin, duration, step, busy, earliest, limit } = opts;
  const rangeStart = Math.max(workStart, fromMin);
  const rangeEnd = Math.min(workEnd, toMin);
  const out: string[] = [];
  for (let m = rangeStart; m + duration <= rangeEnd; m += step) {
    if (m < earliest) continue;
    const slotEnd = m + duration;
    const overlaps = busy.some(([a, b]) => m < b && slotEnd > a);
    if (!overlaps) {
      out.push(toStr(m));
      if (out.length >= limit) break;
    }
  }
  return out;
}

export const searchAvailability = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    query: z.string().optional(),
    city: z.string().optional(),
    category: z.string().optional(),
    service: z.string().optional(),
    standardServiceId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    date: z.string().optional(), // YYYY-MM-DD
    fromTime: z.string().optional(),
    toTime: z.string().optional(),
    onlyAvailable: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    // 1. Candidate salons — approved OR paying, not blocked/suspended
    let q = s.from("profiles")
      .select("id, business_name, city, address, phone, lat, lng, avatar_url, cover_url, category, min_advance_mins, same_day_closed_on, subscription_active, membership_level")
      .eq("suspended", false)
      .is("blocked_at", null)
      .or("is_approved.eq.true,subscription_active.eq.true")
      .not("business_name", "is", null);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.category) q = q.eq("category", data.category);
    if (data.query) q = q.ilike("business_name", `%${data.query}%`);
    const { data: rows } = await q.limit(200);
    if (!rows?.length) return { salons: [] as AvailabilitySalon[], date: data.date ?? null };
    void rows.length;
    const { data: roles } = await s.rpc("list_provider_roles");
    const roleById = new Map((roles ?? []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]));
    let candidates = rows.filter((r) => roleById.has(r.id));
    if (data.brandId) {
      const { data: pb } = await s.from("provider_brands").select("profile_id").eq("brand_id", data.brandId);
      const allowed = new Set((pb ?? []).map((r) => r.profile_id));
      candidates = candidates.filter((c) => allowed.has(c.id));
    }
    if (!candidates.length) return { salons: [] as AvailabilitySalon[], date: data.date ?? null };

    // 2. Match service per salon (by standard_service_id, then name/synonyms)
    const finalIds = candidates.map((c) => c.id);
    let servQ = s.from("services")
      .select("id, salon_id, name, price, duration_mins, category, standard_service_id")
      .in("salon_id", finalIds);
    if (data.standardServiceId) {
      // First try exact FK match; if none, we'll still fall back to name below.
      servQ = servQ.eq("standard_service_id", data.standardServiceId);
    } else if (data.service) {
      servQ = servQ.ilike("name", `%${data.service}%`);
    }
    let servs = (await servQ).data ?? [];

    // Fallback: when standard id matched nothing, try synonyms/name lookup
    if (data.standardServiceId && servs.length === 0) {
      const { data: std } = await s.from("standard_services").select("name, synonyms").eq("id", data.standardServiceId).maybeSingle();
      if (std) {
        const names = [std.name, ...(std.synonyms ?? [])].filter(Boolean);
        const orExpr = names.map((n) => `name.ilike.%${n.replace(/[%,]/g, "")}%`).join(",");
        if (orExpr) {
          const { data: alt } = await s.from("services")
            .select("id, salon_id, name, price, duration_mins, category, standard_service_id")
            .in("salon_id", finalIds).or(orExpr);
          servs = alt ?? [];
        }
      }
    }

    const svcBySalon = new Map<string, typeof servs>();
    for (const sv of servs) {
      const arr = svcBySalon.get(sv.salon_id) ?? [];
      arr.push(sv);
      svcBySalon.set(sv.salon_id, arr);
    }

    // Salons must have a matching service if `service` filter given
    const searchDate = data.date ?? new Date().toISOString().slice(0, 10);
    const dObj = new Date(searchDate + "T00:00:00");
    const weekday = dObj.getDay();
    const fromMin = data.fromTime ? toMin(data.fromTime) : 0;
    const toMinWin = data.toTime ? toMin(data.toTime) : 24 * 60;

    // 3. Meistrių (staff) susiejimas: jų grafikas gyvena po salono ID + staff_id.
    const { data: staffRows } = await s.from("salon_staff")
      .select("id, salon_id, user_id")
      .in("user_id", finalIds)
      .eq("is_active", true);
    const staffByProfile = new Map<string, { salonId: string; staffId: string }>();
    for (const r of staffRows ?? []) {
      if (r.user_id) staffByProfile.set(r.user_id, { salonId: r.salon_id, staffId: r.id });
    }
    // Grafiko / užimtumo raktas kiekvienam kandidatui.
    const scopeFor = (id: string) => staffByProfile.get(id) ?? { salonId: id, staffId: null as string | null };
    const scopeIds = Array.from(new Set(finalIds.map((id) => scopeFor(id).salonId)));

    // 3a. Bulk load hours, appointments, blocks for that date
    const [hoursRes, apptRes, blocksRes] = await Promise.all([
      s.from("working_hours").select("salon_id, weekday, start_time, end_time, is_closed, staff_id").in("salon_id", scopeIds).eq("weekday", weekday),
      s.from("appointments").select("salon_id, staff_id, time_slot, duration_mins").in("salon_id", scopeIds).eq("appointment_date", searchDate).in("status", ["confirmed", "pending"]),
      s.from("time_blocks").select("salon_id, staff_id, start_time, end_time").in("salon_id", scopeIds).eq("block_date", searchDate),
    ]);
    const hoursBySalon = new Map<string, WorkingHourRow[]>();
    for (const h of hoursRes.data ?? []) {
      const arr = hoursBySalon.get(h.salon_id) ?? [];
      arr.push(h as WorkingHourRow);
      hoursBySalon.set(h.salon_id, arr);
    }
    const busyFor = (salonId: string, staffId: string | null): Array<[number, number]> => {
      const out: Array<[number, number]> = [];
      for (const a of apptRes.data ?? []) {
        if (a.salon_id !== salonId) continue;
        if (staffId && a.staff_id && a.staff_id !== staffId) continue;
        out.push([toMin(a.time_slot), toMin(a.time_slot) + (a.duration_mins ?? 60)]);
      }
      for (const b of blocksRes.data ?? []) {
        if (b.salon_id !== salonId) continue;
        if (staffId && b.staff_id && b.staff_id !== staffId) continue;
        out.push([toMin(b.start_time), toMin(b.end_time)]);
      }
      return out;
    };


    // 3b. Product brands per provider
    const brandsBySalon = new Map<string, string[]>();
    {
      const { data: pbRows } = await s.from("provider_brands")
        .select("profile_id, global_brands(name)")
        .in("profile_id", finalIds);
      for (const r of pbRows ?? []) {
        const name = (r.global_brands as unknown as { name: string } | null)?.name;
        if (!name) continue;
        const arr = brandsBySalon.get(r.profile_id) ?? [];
        arr.push(name);
        brandsBySalon.set(r.profile_id, arr);
      }
    }

    // 4. Compute slots per salon
    const out: AvailabilitySalon[] = [];
    for (const c of candidates) {
      const svcs = svcBySalon.get(c.id) ?? [];
      // Only require a matching service when a specific service was requested
      if ((data.service || data.standardServiceId) && !svcs.length) continue;
      const svc = svcs[0] ?? null;
      const duration = svc?.duration_mins ?? 60;
      const scope = scopeFor(c.id);
      const hours = pickDayHours(hoursBySalon.get(scope.salonId) ?? [], { weekday, staffId: scope.staffId });
      let slots: string[] = [];
      const canBook = c.subscription_active && c.membership_level === "pro";
      const earliestMin = earliestBookableMinute({
        date: searchDate,
        minAdvanceMins: c.min_advance_mins ?? 60,
        sameDayClosedOn: c.same_day_closed_on,
      });
      if (canBook && hours && !hours.closed && earliestMin !== null) {
        const busy = busyFor(scope.salonId, scope.staffId);
        slots = computeSlots({
          workStart: toMin(hours.start),
          workEnd: toMin(hours.end),
          fromMin, toMin: toMinWin,
          duration, step: 30, busy, earliest: earliestMin, limit: 4,
        });
      }

      if (data.onlyAvailable && slots.length === 0) continue;
      out.push({
        id: c.id,
        kind: roleById.get(c.id) === "staff" ? "specialist" : "salon",
        business_name: c.business_name,
        city: c.city,
        address: c.address,
        category: c.category,
        avatar_url: c.avatar_url,
        cover_url: c.cover_url,
        lat: c.lat,
        lng: c.lng,
        brands: (brandsBySalon.get(c.id) ?? []).sort((a, b) => a.localeCompare(b, "lt")).slice(0, 4),
        service: svc ? { id: svc.id, name: svc.name, price: Number(svc.price), duration_mins: svc.duration_mins, category: svc.category } : null,
        slots,
        nextSlot: slots[0] ?? null,
        nextSlotDate: slots[0] ? searchDate : null,
        todayHours: hours,
      });
    }

    // Sort: those with slots first, then by earliest slot time
    out.sort((a, b) => {
      if (a.slots.length && !b.slots.length) return -1;
      if (!a.slots.length && b.slots.length) return 1;
      if (a.nextSlot && b.nextSlot) return a.nextSlot.localeCompare(b.nextSlot);
      return 0;
    });

    return { salons: out, date: searchDate };
  });

// ------------- PUBLIC: filter options (services / categories / cities) -------------
export const listSearchOptions = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const [svcRes, profRes] = await Promise.all([
    s.from("services").select("name, category").limit(2000),
    s.from("profiles").select("city, category").not("business_name", "is", null).eq("suspended", false).limit(2000),
  ]);
  const services = Array.from(new Set((svcRes.data ?? []).map((r) => r.name).filter(Boolean))).sort((a, b) => a.localeCompare(b, "lt"));
  const serviceCats = Array.from(new Set((svcRes.data ?? []).map((r) => r.category).filter(Boolean)));
  const profCats = Array.from(new Set((profRes.data ?? []).map((r) => r.category).filter((v): v is string => !!v)));
  const categories = Array.from(new Set([...serviceCats, ...profCats])).sort((a, b) => a.localeCompare(b, "lt"));
  const cities = Array.from(new Set((profRes.data ?? []).map((r) => r.city).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, "lt"));
  return { services, categories, cities };
});
