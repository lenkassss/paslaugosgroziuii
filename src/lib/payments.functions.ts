import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLAN_PRICES = {
  master:   { monthly: 9.99,  yearly: 99  },
  salon:    { monthly: 19.99, yearly: 199 },
  supplier: { monthly: 29.99, yearly: 299 },
} as const;

type PlanTier = keyof typeof PLAN_PRICES;

// ============================================================
// UNIVERSAL DEMO PAYMENT
// ============================================================
export const createDemoPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    kind: z.enum(["deposit", "membership", "highlight", "event", "product"]),
    amount: z.number().min(0),
    cardNumber: z.string().default("4242 4242 4242 4242"),
    targetId: z.string().uuid().optional(),
    meta: z.record(z.string(), z.any()).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const digits = data.cardNumber.replace(/\s/g, "");
    if (digits !== "4242424242424242") throw new Error("DEMO_INVALID_CARD");
    const { data: pay, error } = await context.supabase.from("demo_payments").insert({
      user_id: context.userId,
      amount: data.amount,
      card_last4: digits.slice(-4),
      status: "succeeded",
      kind: data.kind,
      target_id: data.targetId ?? null,
      meta: data.meta ?? {},
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { paymentId: pay?.id, ok: true };
  });

// ============================================================
// APPOINTMENT DEPOSIT — mark appointment paid, promote status
// ============================================================
export const payAppointmentDeposit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    appointmentId: z.string().uuid(),
    cardNumber: z.string().default("4242 4242 4242 4242"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const digits = data.cardNumber.replace(/\s/g, "");
    if (digits !== "4242424242424242") throw new Error("DEMO_INVALID_CARD");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: appt, error: readErr } = await supabaseAdmin.from("appointments")
      .select("id, salon_id, client_user_id, deposit_amount, platform_fee, deposit_status, service_name, appointment_date, time_slot")
      .eq("id", data.appointmentId).maybeSingle();
    if (readErr || !appt) throw new Error("Vizitas nerastas");
    if (appt.client_user_id && appt.client_user_id !== context.userId) throw new Error("Ne tavo vizitas");
    if (appt.deposit_status === "paid") return { ok: true };

    const { data: pay } = await supabaseAdmin.from("demo_payments").insert({
      user_id: context.userId,
      amount: Number(appt.deposit_amount),
      card_last4: digits.slice(-4),
      status: "succeeded",
      kind: "deposit",
      target_id: appt.id,
      meta: { salon_id: appt.salon_id, service: appt.service_name },
    }).select("id").maybeSingle();

    await supabaseAdmin.from("appointments").update({
      deposit_status: "paid",
      status: "confirmed",
      payment_id: pay?.id ?? null,
    }).eq("id", appt.id);

    const fee = Number(appt.platform_fee ?? 0.49);
    const salonShare = Math.max(0, Number(appt.deposit_amount) - fee);

    await supabaseAdmin.from("salon_transactions").insert([
      { salon_id: appt.salon_id, kind: "deposit_in", amount: Number(appt.deposit_amount), appointment_id: appt.id, payment_id: pay?.id ?? null, note: "Kliento depozitas" },
      { salon_id: appt.salon_id, kind: "fee_deducted", amount: -fee, appointment_id: appt.id, note: "Platformos mokestis" },
    ]);
    // Increment wallet_pending atomically via RPC-less update
    const { data: prof } = await supabaseAdmin.from("profiles").select("wallet_pending").eq("id", appt.salon_id).maybeSingle();
    await supabaseAdmin.from("profiles").update({
      wallet_pending: Number(prof?.wallet_pending ?? 0) + salonShare,
    }).eq("id", appt.salon_id);

    await supabaseAdmin.from("notifications").insert({
      user_id: appt.salon_id,
      type: "comment_on_article",
      payload: { kind: "appointment_paid", appointment_id: appt.id, amount: salonShare, service: appt.service_name },
    });

    return { ok: true };
  });

// ============================================================
// MEMBERSHIP — activate / renew with state machine
// ============================================================
async function callerTier(supabase: import("@supabase/supabase-js").SupabaseClient, userId: string): Promise<PlanTier> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
  if (data?.role === "supplier") return "supplier";
  if (data?.role === "salon") return "salon";
  return "master";
}

export const activateMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    billing: z.enum(["monthly", "yearly"]).default("monthly"),
    cardNumber: z.string().default("4242 4242 4242 4242"),
    auto_renew: z.boolean().default(true),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const digits = data.cardNumber.replace(/\s/g, "");
    if (digits !== "4242424242424242") throw new Error("DEMO_INVALID_CARD");
    const tier = await callerTier(context.supabase, context.userId);
    const price = PLAN_PRICES[tier][data.billing];
    const now = new Date();
    const next = new Date(now);
    if (data.billing === "yearly") next.setDate(next.getDate() + 365);
    else next.setDate(next.getDate() + 30);

    const { data: pay } = await context.supabase.from("demo_payments").insert({
      user_id: context.userId,
      amount: price,
      card_last4: digits.slice(-4),
      status: "succeeded",
      kind: "membership",
      plan_type: data.billing,
      plan_tier: tier,
      meta: { tier, billing: data.billing },
    }).select("id").maybeSingle();

    const { error } = await context.supabase.from("profiles").update({
      subscription_active: true,
      subscription_state: "active",
      subscription_plan: tier,
      subscription_billing: data.billing,
      subscription_started_at: now.toISOString(),
      subscription_expires_at: next.toISOString(),
      next_billing_at: next.toISOString(),
      auto_renew: data.auto_renew,
      plan_type: data.billing,
      plan_tier: tier,
    }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, paymentId: pay?.id, tier, price, nextBillingAt: next.toISOString() };
  });

export const cancelMembershipRenewal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("profiles").update({ auto_renew: false, subscription_state: "cancelled" }).eq("id", context.userId);
    return { ok: true };
  });

// ============================================================
// SALON VERIFICATION
// ============================================================
export const submitVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id_document_url: z.string().url(),
    business_document_url: z.string().url().optional(),
    selfie_url: z.string().url(),
    address_proof_url: z.string().url().optional(),
    at_home_service: z.boolean().default(false),
    notes: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update({
      verification_status: "pending",
      verification_docs: data,
      at_home_service: data.at_home_service,
      rejection_reason: null,
    }).eq("id", context.userId);
    if (error) throw new Error(error.message);
    const { notifyAdmins } = await import("@/lib/notify-admins.server");
    await notifyAdmins("admin_supplier_pending", { kind: "verification_request", user_id: context.userId });
    return { ok: true };
  });

export const getMyVerification = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("profiles").select("verification_status, verification_docs, rejection_reason, at_home_service, verified_at").eq("id", context.userId).maybeSingle();
    return { ...data };
  });

async function assertAdmin(supabase: import("@supabase/supabase-js").SupabaseClient, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listPendingVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("profiles")
      .select("id, business_name, owner_name, city, phone, verification_status, verification_docs, at_home_service, is_approved, created_at")
      .in("verification_status", ["pending", "verified", "rejected"])
      .order("created_at", { ascending: false })
      .limit(200);
    return { profiles: data ?? [] };
  });

export const decideVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    approve: z.boolean(),
    reason: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.approve) {
      await supabaseAdmin.from("profiles").update({
        verification_status: "verified",
        verified_at: new Date().toISOString(),
        verified_by: context.userId,
        rejection_reason: null,
      }).eq("id", data.userId);
    } else {
      await supabaseAdmin.from("profiles").update({
        verification_status: "rejected",
        rejection_reason: data.reason ?? "Nepatvirtinta",
      }).eq("id", data.userId);
    }
    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId,
      action: data.approve ? "verification.approve" : "verification.reject",
      entity: "profile",
      entity_id: data.userId,
      meta: { reason: data.reason ?? null },
    });
    return { ok: true };
  });

// ============================================================
// SUPPLIER REQUESTS
// ============================================================
export const submitSupplierRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    company_name: z.string().min(2).max(120),
    contact_name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    website: z.string().max(200).optional(),
    products_description: z.string().min(20).max(2000),
  }).parse(d))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const s = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
    const { error } = await s.from("supplier_requests").insert(data);
    if (error) throw new Error(error.message);
    const { notifyAdmins } = await import("@/lib/notify-admins.server");
    await notifyAdmins("admin_supplier_pending", {
      kind: "supplier_request",
      company_name: data.company_name,
      email: data.email,
    });
    return { ok: true };
  });

export const listSupplierRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("supplier_requests").select("*").order("created_at", { ascending: false });
    return { requests: data ?? [] };
  });

export const updateSupplierRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["new", "contacted", "approved", "rejected"]),
    admin_notes: z.string().max(1000).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("supplier_requests").update({
      status: data.status,
      admin_notes: data.admin_notes ?? null,
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", data.id);
    return { ok: true };
  });

// ============================================================
// SALON WALLET
// ============================================================
export const getWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [prof, tx] = await Promise.all([
      context.supabase.from("profiles").select("wallet_balance, wallet_pending").eq("id", context.userId).maybeSingle(),
      context.supabase.from("salon_transactions").select("*").eq("salon_id", context.userId).order("created_at", { ascending: false }).limit(100),
    ]);
    return {
      balance: Number(prof.data?.wallet_balance ?? 0),
      pending: Number(prof.data?.wallet_pending ?? 0),
      transactions: tx.data ?? [],
    };
  });
