import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Registracijų uždarymas realiu laiku.
 * Salonas / meistrė pasirenka dieną ir laiką – nuo to laiko iki dienos galo
 * naujos registracijos nebegalimos (naudojami esami `time_blocks`).
 */

const CUTOFF_REASON = "Registracijos uždarytos";
const DAY_END = "23:59";

async function scopeFor(supabase: any, userId: string, staffId?: string | null) {
  const { data: staffRow } = await supabase.from("salon_staff")
    .select("id, salon_id").eq("user_id", userId).eq("is_active", true).maybeSingle();
  return {
    salonId: staffRow?.salon_id ?? userId,
    staffId: staffRow?.id ?? staffId ?? null,
  };
}

export const listBookingCutoffs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ date: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { salonId } = await scopeFor(context.supabase, context.userId);
    const { data: rows } = await context.supabase.from("time_blocks")
      .select("id, block_date, start_time, end_time, reason, staff_id")
      .eq("salon_id", salonId)
      .eq("block_date", data.date)
      .order("start_time", { ascending: true });
    return { blocks: rows ?? [] };
  });

export const closeBookingsFrom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    date: z.string(),
    from_time: z.string().regex(/^\d{2}:\d{2}$/),
    staff_id: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.from_time >= DAY_END) throw new Error("Pasirink ankstesnį laiką.");
    const { salonId, staffId } = await scopeFor(context.supabase, context.userId, data.staff_id);
    const { error } = await context.supabase.from("time_blocks").insert({
      salon_id: salonId,
      staff_id: staffId,
      block_date: data.date,
      start_time: data.from_time,
      end_time: DAY_END,
      reason: CUTOFF_REASON,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reopenBookings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ blockId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { salonId } = await scopeFor(context.supabase, context.userId);
    const { error } = await context.supabase.from("time_blocks")
      .delete().eq("id", data.blockId).eq("salon_id", salonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
