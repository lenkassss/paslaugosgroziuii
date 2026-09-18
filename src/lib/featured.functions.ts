import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const FEATURED_PLANS = {
  "1_week": { label: "1 savaitė", days: 7, price_cents: 499 },
  "1_month": { label: "1 mėnuo", days: 30, price_cents: 1099 },
  "3_months": { label: "3 mėnesiai · VIP TOP", days: 90, price_cents: 2499 },
} as const;

export type FeaturedPlan = keyof typeof FEATURED_PLANS;

export const getFeaturedStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("is_featured, featured_until, first_membership_at")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: history } = await context.supabase
      .from("highlight_purchases")
      .select("id, plan_type, amount_cents, starts_at, ends_at, payment_status, created_at")
      .eq("user_id", context.userId)
      .eq("target_kind", "profile")
      .order("created_at", { ascending: false })
      .limit(20);
    return {
      is_featured: !!data?.is_featured && (data?.featured_until ? new Date(data.featured_until) > new Date() : false),
      featured_until: data?.featured_until ?? null,
      first_membership_at: data?.first_membership_at ?? null,
      history: history ?? [],
    };
  });

export const purchaseFeaturedDemo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { plan: FeaturedPlan }) =>
    z.object({ plan: z.enum(["1_week", "1_month", "3_months"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const plan = FEATURED_PLANS[data.plan];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("featured_until")
      .eq("id", context.userId)
      .maybeSingle();
    const base = profile?.featured_until && new Date(profile.featured_until) > new Date()
      ? new Date(profile.featured_until)
      : new Date();
    const end = new Date(base.getTime() + plan.days * 86400_000);

    await supabaseAdmin.from("highlight_purchases").insert({
      user_id: context.userId,
      target_kind: "profile",
      target_id: context.userId,
      weeks: Math.ceil(plan.days / 7),
      amount_cents: plan.price_cents,
      payment_status: "paid",
      starts_at: new Date().toISOString(),
      ends_at: end.toISOString(),
      plan_type: data.plan,
    });
    await supabaseAdmin
      .from("profiles")
      .update({ is_featured: true, featured_until: end.toISOString() })
      .eq("id", context.userId);
    return { ok: true, featured_until: end.toISOString() };
  });
