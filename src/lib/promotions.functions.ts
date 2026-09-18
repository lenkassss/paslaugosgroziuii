import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Straipsnio reklama — keturi variantai, ilgesnis laikas = mažesnė dienos kaina. */
export const PROMO_PLANS = {
  "1_day": { label: "1 diena", days: 1, price_cents: 299, badge: "Rekomenduojama" },
  "1_week": { label: "7 dienos", days: 7, price_cents: 699, badge: "Prikabinta" },
  "2_weeks": { label: "14 dienų", days: 14, price_cents: 1199, badge: "Prikabinta" },
  "1_month": { label: "30 dienų", days: 30, price_cents: 1999, badge: "VIP TOP" },
} as const;

export type PromoPlan = keyof typeof PROMO_PLANS;

const planSchema = z.enum(["1_day", "3_days", "1_week", "2_weeks", "1_month"]);

/** Author's own articles + live promotion state (for the promote dashboard). */
export const listMyPromotableContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [articlesRes, purchasesRes] = await Promise.all([
      context.supabase
        .from("articles")
        .select("id, slug, title, kind, cover_url, category, views, published_at, is_promoted, promoted_until, promoted_label")
        .eq("author_id", context.userId)
        .order("published_at", { ascending: false })
        .limit(100),
      context.supabase
        .from("highlight_purchases")
        .select("id, target_id, plan_type, amount_cents, starts_at, ends_at, payment_status, created_at")
        .eq("user_id", context.userId)
        .eq("target_kind", "article")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const now = Date.now();
    const items = (articlesRes.data ?? []).map((a) => ({
      ...a,
      promotion_active: !!a.is_promoted && !!a.promoted_until && new Date(a.promoted_until).getTime() > now,
    }));
    return { items, purchases: purchasesRes.data ?? [] };
  });

/** Demo checkout — records the purchase and pins the article via a security-definer RPC. */
export const purchaseArticlePromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ articleId: z.string().uuid(), plan: planSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: endsAt, error } = await context.supabase.rpc("purchase_article_promotion", {
      _article: data.articleId,
      _plan: data.plan,
    });
    if (error) throw new Error(error.message);
    return { ok: true, ends_at: endsAt as unknown as string };
  });

export const stopArticlePromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ articleId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("articles")
      .update({ is_promoted: false, promoted_until: new Date().toISOString() })
      .eq("id", data.articleId)
      .eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** ---------------- ADMIN ---------------- */

async function ensureAdmin(supabase: any, userId: string) {
  const [{ data: admin }, { data: superAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" }),
  ]);
  if (!admin && !superAdmin) throw new Error("Reikia administratoriaus teisių.");
}

export const adminListPromotions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: purchases } = await context.supabase
      .from("highlight_purchases")
      .select("id, user_id, target_id, plan_type, amount_cents, starts_at, ends_at, payment_status, created_at")
      .eq("target_kind", "article")
      .order("created_at", { ascending: false })
      .limit(200);

    const articleIds = Array.from(new Set((purchases ?? []).map((p) => p.target_id)));
    const userIds = Array.from(new Set((purchases ?? []).map((p) => p.user_id)));
    const [artRes, profRes] = await Promise.all([
      articleIds.length
        ? context.supabase.from("articles").select("id, slug, title, kind, is_promoted, promoted_until, promoted_priority, promoted_label").in("id", articleIds)
        : Promise.resolve({ data: [] as any[] }),
      userIds.length
        ? context.supabase.from("profiles").select("id, business_name, owner_name, email").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const now = Date.now();
    const revenueCents = (purchases ?? [])
      .filter((p) => p.payment_status === "paid")
      .reduce((sum, p) => sum + (p.amount_cents ?? 0), 0);
    const activeCount = (purchases ?? []).filter((p) => new Date(p.ends_at).getTime() > now).length;

    return {
      purchases: purchases ?? [],
      articles: Object.fromEntries(((artRes as any).data ?? []).map((a: any) => [a.id, a])),
      owners: Object.fromEntries(((profRes as any).data ?? []).map((p: any) => [p.id, p])),
      revenueCents,
      activeCount,
    };
  });

export const adminSetPromotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    articleId: z.string().uuid(),
    isPromoted: z.boolean(),
    days: z.number().int().min(0).max(365).default(0),
    priority: z.number().int().min(0).max(100).optional(),
    label: z.string().max(40).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const until = data.isPromoted && data.days > 0
      ? new Date(Date.now() + data.days * 86400_000).toISOString()
      : data.isPromoted ? null : new Date().toISOString();
    const { error } = await context.supabase
      .from("articles")
      .update({
        is_promoted: data.isPromoted,
        promoted_until: until,
        ...(data.priority !== undefined ? { promoted_priority: data.priority } : {}),
        ...(data.label !== undefined ? { promoted_label: data.label || null } : {}),
      })
      .eq("id", data.articleId);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: data.isPromoted ? "article.promote" : "article.unpromote",
      entity: "article",
      entity_id: data.articleId,
      meta: { days: data.days, priority: data.priority ?? null },
    });
    return { ok: true };
  });
