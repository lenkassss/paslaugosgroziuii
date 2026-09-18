import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// SALON / MEISTRO POLITIKOS + PATOGUMAI
// ============================================================
export const updateSalonPolicies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    accept_app_payments: z.boolean(),
    accept_onsite_payments: z.boolean(),
    cancellation_fee_percent: z.number().int().min(0).max(100),
    cancellation_window_mins: z.number().int().min(0).max(10080),
    amenities: z.array(z.string().max(40)).max(40),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (!data.accept_app_payments && !data.accept_onsite_payments) {
      throw new Error("Bent vienas atsiskaitymo būdas turi būti įjungtas.");
    }
    const { error } = await context.supabase.from("profiles").update({
      accept_app_payments: data.accept_app_payments,
      accept_onsite_payments: data.accept_onsite_payments,
      cancellation_fee_percent: data.cancellation_fee_percent,
      cancellation_window_mins: data.cancellation_window_mins,
      amenities: data.amenities,
    }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


// ============================================================
// REZERVACIJŲ TAISYKLĖS (minimalus išankstinis laikas, šiandienos uždarymas)
// ============================================================
export const updateBookingRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    min_advance_mins: z.number().int().min(0).max(10080),
    close_today: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    // Vietinė (Vilniaus) data — kad „uždaryti šiandien" veiktų teisingai.
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vilnius" }).format(new Date());
    const { error } = await context.supabase.from("profiles").update({
      min_advance_mins: data.min_advance_mins,
      same_day_closed_on: data.close_today ? today : null,
    }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, same_day_closed_on: data.close_today ? today : null };
  });

// ============================================================
// DEMO STRIPE — kortelių „saugojimas“ (tik paskutiniai 4 skaitmenys)
// ============================================================
export const listMyCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("payment_cards")
      .select("id, brand, last4, exp_month, exp_year, holder, is_default")
      .eq("user_id", context.userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    return { cards: data ?? [] };
  });

export const addDemoCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    cardNumber: z.string().min(12).max(25),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int().min(2026).max(2100),
    holder: z.string().min(2).max(80),
    makeDefault: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const digits = data.cardNumber.replace(/\D/g, "");
    if (digits !== "4242424242424242") throw new Error("DEMO_INVALID_CARD");
    if (data.makeDefault) {
      await context.supabase.from("payment_cards").update({ is_default: false }).eq("user_id", context.userId);
    }
    const { data: card, error } = await context.supabase.from("payment_cards").insert({
      user_id: context.userId,
      brand: "Visa",
      last4: digits.slice(-4),
      exp_month: data.expMonth,
      exp_year: data.expYear,
      holder: data.holder,
      is_default: data.makeDefault,
    }).select("id, brand, last4, exp_month, exp_year, holder, is_default").maybeSingle();
    if (error) throw new Error(error.message);
    return { card };
  });

export const setDefaultCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ cardId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase.from("payment_cards").update({ is_default: false }).eq("user_id", context.userId);
    await context.supabase.from("payment_cards").update({ is_default: true }).eq("id", data.cardId).eq("user_id", context.userId);
    return { ok: true };
  });

export const deleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ cardId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("payment_cards").delete().eq("id", data.cardId).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// ATŠAUKIMO POLITIKA — peržiūra ir vykdymas
// ============================================================
type Policy = { fee_percent: number; window_mins: number };

function computeFee(opts: {
  date: string; time: string; price: number; policy: Policy;
}) {
  const start = new Date(`${opts.date}T${opts.time}`);
  const minsLeft = Math.round((start.getTime() - Date.now()) / 60000);
  const late = opts.policy.window_mins > 0 && opts.policy.fee_percent > 0 && minsLeft <= opts.policy.window_mins;
  const fee = late ? Math.round(opts.price * (opts.policy.fee_percent / 100) * 100) / 100 : 0;
  return { minsLeft, late, fee };
}

export const previewCancellation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: appt } = await context.supabase.from("appointments")
      .select("id, salon_id, appointment_date, time_slot, service_price, deposit_amount, status")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt) throw new Error("Vizitas nerastas");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: salon } = await supabaseAdmin.from("profiles")
      .select("business_name, cancellation_fee_percent, cancellation_window_mins")
      .eq("id", appt.salon_id).maybeSingle();
    const policy: Policy = {
      fee_percent: salon?.cancellation_fee_percent ?? 0,
      window_mins: salon?.cancellation_window_mins ?? 0,
    };
    const price = Number(appt.service_price ?? 0) || Number(appt.deposit_amount ?? 0);
    const calc = computeFee({ date: appt.appointment_date, time: appt.time_slot, price, policy });
    const { data: cards } = await context.supabase.from("payment_cards")
      .select("id, brand, last4, is_default").eq("user_id", context.userId)
      .order("is_default", { ascending: false });
    return {
      salonName: salon?.business_name ?? "Salonas",
      price,
      feePercent: policy.fee_percent,
      windowMins: policy.window_mins,
      ...calc,
      cards: cards ?? [],
    };
  });

export const cancelMyAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    appointmentId: z.string().uuid(),
    reason: z.string().max(300).optional(),
    cardId: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: appt } = await context.supabase.from("appointments")
      .select("id, salon_id, appointment_date, time_slot, service_price, deposit_amount, status, client_user_id")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt) throw new Error("Vizitas nerastas");
    if (appt.status === "cancelled") return { ok: true, fee: 0 };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: salon } = await supabaseAdmin.from("profiles")
      .select("cancellation_fee_percent, cancellation_window_mins").eq("id", appt.salon_id).maybeSingle();
    const price = Number(appt.service_price ?? 0) || Number(appt.deposit_amount ?? 0);
    const { fee, late } = computeFee({
      date: appt.appointment_date,
      time: appt.time_slot,
      price,
      policy: {
        fee_percent: salon?.cancellation_fee_percent ?? 0,
        window_mins: salon?.cancellation_window_mins ?? 0,
      },
    });

    let last4: string | null = null;
    if (fee > 0) {
      const { data: card } = data.cardId
        ? await context.supabase.from("payment_cards").select("last4").eq("id", data.cardId).eq("user_id", context.userId).maybeSingle()
        : await context.supabase.from("payment_cards").select("last4").eq("user_id", context.userId).order("is_default", { ascending: false }).limit(1).maybeSingle();
      if (!card) throw new Error("NO_CARD");
      last4 = card.last4;
      await supabaseAdmin.from("demo_payments").insert({
        user_id: context.userId,
        amount: fee,
        card_last4: last4,
        status: "succeeded",
        kind: "cancellation_fee",
        target_id: appt.id,
        meta: { salon_id: appt.salon_id, late },
      });
      await supabaseAdmin.from("salon_transactions").insert({
        salon_id: appt.salon_id,
        kind: "cancellation_fee",
        amount: fee,
        appointment_id: appt.id,
        note: "Vėlyvo atšaukimo kompensacija",
      });
    }

    await supabaseAdmin.from("appointments").update({
      status: "cancelled",
      cancelled_by: "client",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: data.reason ?? (fee > 0 ? "Klientas atšaukė (taikytas mokestis)" : "Klientas atšaukė"),
      cancellation_fee: fee,
      fee_card_last4: last4,
    }).eq("id", appt.id);

    return { ok: true, fee, last4 };
  });

// ============================================================
// DEMO APMOKĖJIMAS APLIKACIJOJE (visa suma)
// ============================================================
export const payAppointmentInApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    appointmentId: z.string().uuid(),
    cardId: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: appt } = await context.supabase.from("appointments")
      .select("id, salon_id, service_name, service_price, deposit_amount, platform_fee, payment_status, client_user_id")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt) throw new Error("Vizitas nerastas");
    if (appt.payment_status === "paid") return { ok: true, amount: 0 };

    const { data: card } = data.cardId
      ? await context.supabase.from("payment_cards").select("last4").eq("id", data.cardId).eq("user_id", context.userId).maybeSingle()
      : await context.supabase.from("payment_cards").select("last4").eq("user_id", context.userId).order("is_default", { ascending: false }).limit(1).maybeSingle();
    if (!card) throw new Error("NO_CARD");

    const amount = Number(appt.service_price ?? 0) || Number(appt.deposit_amount ?? 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pay } = await supabaseAdmin.from("demo_payments").insert({
      user_id: context.userId,
      amount,
      card_last4: card.last4,
      status: "succeeded",
      kind: "deposit",
      target_id: appt.id,
      meta: { salon_id: appt.salon_id, service: appt.service_name, in_app: true },
    }).select("id").maybeSingle();

    await supabaseAdmin.from("appointments").update({
      payment_status: "paid",
      deposit_status: "paid",
      status: "confirmed",
      payment_id: pay?.id ?? null,
      guarantee_card_last4: card.last4,
    }).eq("id", appt.id);

    const fee = Number(appt.platform_fee ?? 0.49);
    await supabaseAdmin.from("salon_transactions").insert([
      { salon_id: appt.salon_id, kind: "deposit_in", amount, appointment_id: appt.id, payment_id: pay?.id ?? null, note: "Apmokėta aplikacijoje" },
      { salon_id: appt.salon_id, kind: "fee_deducted", amount: -fee, appointment_id: appt.id, note: "Platformos mokestis" },
    ]);
    const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_pending").eq("id", appt.salon_id).maybeSingle();
    await supabaseAdmin.from("profiles").update({
      wallet_pending: Number(prof?.wallet_pending ?? 0) + Math.max(0, amount - fee),
    }).eq("id", appt.salon_id);

    return { ok: true, amount, last4: card.last4 };
  });

// ============================================================
// GARANTINĖ KORTELĖ (no-show apsauga, be nuskaitymo)
// ============================================================
export const attachGuaranteeCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    appointmentId: z.string().uuid(),
    cardId: z.string().uuid().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: card } = data.cardId
      ? await context.supabase.from("payment_cards").select("last4").eq("id", data.cardId).eq("user_id", context.userId).maybeSingle()
      : await context.supabase.from("payment_cards").select("last4").eq("user_id", context.userId).order("is_default", { ascending: false }).limit(1).maybeSingle();
    if (!card) throw new Error("NO_CARD");
    await context.supabase.from("appointments").update({ guarantee_card_last4: card.last4 }).eq("id", data.appointmentId);
    return { ok: true, last4: card.last4 };
  });
