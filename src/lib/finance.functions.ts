import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertPrimaryOwner(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("profiles").select("is_primary_owner").eq("id", userId).maybeSingle();
  if (!data?.is_primary_owner) throw new Error("Prieinama tik pagrindiniam savininkui.");
}

export const primaryOwnerCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("profiles").select("is_primary_owner").eq("id", context.userId).maybeSingle();
    return { is_primary_owner: !!data?.is_primary_owner };
  });

// FINANCE — platform revenue breakdown (primary owner only)
export const ownerFinanceReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPrimaryOwner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: fees }, { data: highlights }, { data: memberships }, { data: orders }] = await Promise.all([
      supabaseAdmin.from("salon_transactions").select("amount, created_at, kind").eq("kind", "fee_deducted"),
      supabaseAdmin.from("highlight_purchases").select("amount_cents, plan_type, created_at, payment_status"),
      supabaseAdmin.from("demo_payments").select("amount, created_at, kind"),
      supabaseAdmin.from("orders").select("total, platform_fee, created_at, status"),
    ]);

    const toCents = (rows: any[] | null, k: string) => (rows ?? []).reduce((s, r) => s + Math.round(Number(r[k] ?? 0) * 100), 0);
    const sumCents = (rows: any[] | null, k: string) => (rows ?? []).reduce((s, r) => s + Number(r[k] ?? 0), 0);
    const bookingFees = toCents(fees, "amount");
    const featuredRevenue = (highlights ?? []).filter((h: any) => h.payment_status === "paid" && h.plan_type && h.plan_type !== "trial").reduce((s: number, h: any) => s + Number(h.amount_cents ?? 0), 0);
    const membershipRevenue = toCents(memberships, "amount");
    const marketplaceFees = toCents(orders, "platform_fee");
    const total = bookingFees + featuredRevenue + membershipRevenue + marketplaceFees;

    const buckets: Record<string, { fees: number; featured: number; membership: number; marketplace: number }> = {};
    const bucket = (dateStr: string) => (dateStr || "").slice(0, 7);
    const ensure = (k: string) => { buckets[k] = buckets[k] || { fees: 0, featured: 0, membership: 0, marketplace: 0 }; return buckets[k]; };
    for (const r of (fees ?? []) as any[]) ensure(bucket(r.created_at)).fees += Math.round(Number(r.amount ?? 0) * 100);
    for (const r of (highlights ?? []) as any[]) { if (r.payment_status !== "paid" || !r.plan_type || r.plan_type === "trial") continue; ensure(bucket(r.created_at)).featured += Number(r.amount_cents ?? 0); }
    for (const r of (memberships ?? []) as any[]) ensure(bucket(r.created_at)).membership += Math.round(Number(r.amount ?? 0) * 100);
    for (const r of (orders ?? []) as any[]) ensure(bucket(r.created_at)).marketplace += Math.round(Number(r.platform_fee ?? 0) * 100);

    const monthly = Object.entries(buckets).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 12).map(([month, v]) => ({ month, ...v, total: v.fees + v.featured + v.membership + v.marketplace }));

    return {
      totals: { bookingFees, featuredRevenue, membershipRevenue, marketplaceFees, total },
      monthly,
    };
  });

// GRANTS — grant free membership or manual featured (primary owner only)
export const ownerGrantMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), months: z.number().min(1).max(24) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPrimaryOwner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nextBilling = new Date(Date.now() + data.months * 30 * 86400_000).toISOString();
    const { error } = await supabaseAdmin.from("profiles").update({
      subscription_active: true,
      subscription_state: "active",
      next_billing_at: nextBilling,
    }).eq("id", data.user_id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, action: "owner.grant_membership", entity: "profile", entity_id: data.user_id, meta: { months: data.months } as any });
    return { ok: true };
  });

export const ownerGrantFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), days: z.number().min(1).max(365) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertPrimaryOwner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin.from("profiles").select("featured_until").eq("id", data.user_id).maybeSingle();
    const base = profile?.featured_until && new Date(profile.featured_until) > new Date() ? new Date(profile.featured_until) : new Date();
    const end = new Date(base.getTime() + data.days * 86400_000).toISOString();
    await supabaseAdmin.from("profiles").update({ is_featured: true, featured_until: end }).eq("id", data.user_id);
    await supabaseAdmin.from("highlight_purchases").insert({
      user_id: data.user_id,
      target_kind: "profile",
      target_id: data.user_id,
      weeks: Math.ceil(data.days / 7),
      amount_cents: 0,
      payment_status: "paid",
      starts_at: new Date().toISOString(),
      ends_at: end,
      plan_type: "trial",
    });
    await supabaseAdmin.from("audit_log").insert({ actor_id: context.userId, action: "owner.grant_featured", entity: "profile", entity_id: data.user_id, meta: { days: data.days } as any });
    return { ok: true, featured_until: end };
  });

export const ownerSearchUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string } | undefined) => z.object({ q: z.string().max(120).optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    await assertPrimaryOwner(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("profiles").select("id, email, business_name, owner_name, subscription_active, is_featured, featured_until, is_primary_owner").limit(30).order("created_at", { ascending: false });
    if (data.q) q = q.or(`email.ilike.%${data.q}%,business_name.ilike.%${data.q}%,owner_name.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { items: rows ?? [] };
  });
