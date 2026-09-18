import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const PLACEMENTS = [
  "home_feed",
  "home_sidebar",
  "events",
  "promos",
  "search",
  "article_detail",
  "salon_profile",
] as const;
export type Placement = (typeof PLACEMENTS)[number];

export type AdItem = {
  id: string;
  source: "sponsored" | "salon_promo" | "article_promo";
  title: string;
  body: string | null;
  image_url: string | null;
  cta_label: string;
  cta_url: string | null;
  advertiser_id: string | null;
  advertiser_name: string | null;
  advertiser_city: string | null;
  priority: number;
  frequency: number;
};

async function assertAdmin(context: { supabase: any; userId: string }) {
  const [{ data: admin }, { data: superAdmin }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
  ]);
  if (!admin && !superAdmin) throw new Error("Prieiga tik administratoriams");
}

// ------ Public: fetch ads for a placement (mix sponsored + auto-promo) ------
export const getPlacementAds = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    placement: z.enum(PLACEMENTS),
    category: z.string().optional(),
    limit: z.number().default(6),
  }).parse(d))
  .handler(async ({ data }): Promise<{ items: AdItem[] }> => {
    const s = publicClient();
    const now = new Date().toISOString();

    let adQ = s.from("ad_slots")
      .select("id, advertiser_id, title, body, image_url, cta_label, cta_url, priority, frequency, target_category, starts_at, ends_at")
      .eq("is_active", true)
      .contains("placements", [data.placement])
      .lte("starts_at", now)
      .order("priority", { ascending: false })
      .limit(data.limit);
    if (data.category) adQ = adQ.or(`target_category.is.null,target_category.eq.${data.category}`);

    const [adsRes, featRes, promRes] = await Promise.all([
      adQ,
      s.from("profiles")
        .select("id, business_name, city, avatar_url, cover_url, category, featured_priority, featured_until")
        .eq("is_featured", true)
        .not("business_name", "is", null)
        .order("featured_priority", { ascending: false })
        .limit(Math.max(2, Math.floor(data.limit / 2))),
      s.from("articles")
        .select("id, slug, title, subtitle, cover_url, category, author_id, promoted_until")
        .eq("status", "published")
        .eq("is_promoted", true)
        .order("published_at", { ascending: false })
        .limit(Math.max(2, Math.floor(data.limit / 2))),
    ]);

    const ads = (adsRes.data ?? []).filter((a) => !a.ends_at || a.ends_at > now);
    const feats = (featRes.data ?? []).filter((p) => !p.featured_until || p.featured_until > now);
    const proms = (promRes.data ?? []).filter((a) => !a.promoted_until || a.promoted_until > now);

    // Resolve advertiser names
    const advIds = Array.from(new Set(ads.map((a) => a.advertiser_id).filter(Boolean)));
    const { data: advProfiles } = advIds.length
      ? await s.from("profiles").select("id, business_name, city").in("id", advIds)
      : { data: [] as Array<{ id: string; business_name: string | null; city: string | null }> };
    const advMap = new Map((advProfiles ?? []).map((p) => [p.id, p]));

    const items: AdItem[] = [];

    for (const a of ads) {
      const p = advMap.get(a.advertiser_id);
      items.push({
        id: a.id,
        source: "sponsored",
        title: a.title,
        body: a.body,
        image_url: a.image_url,
        cta_label: a.cta_label,
        cta_url: a.cta_url,
        advertiser_id: a.advertiser_id,
        advertiser_name: p?.business_name ?? null,
        advertiser_city: p?.city ?? null,
        priority: a.priority ?? 0,
        frequency: a.frequency ?? 6,
      });
    }

    for (const p of feats) {
      items.push({
        id: `salon-${p.id}`,
        source: "salon_promo",
        title: p.business_name!,
        body: p.category ? `${p.category}${p.city ? ` · ${p.city}` : ""}` : p.city,
        image_url: p.cover_url ?? p.avatar_url,
        cta_label: "Peržiūrėti saloną",
        cta_url: `/salon/${p.id}`,
        advertiser_id: p.id,
        advertiser_name: p.business_name,
        advertiser_city: p.city,
        priority: p.featured_priority ?? 0,
        frequency: 8,
      });
    }

    for (const a of proms) {
      items.push({
        id: `article-${a.id}`,
        source: "article_promo",
        title: a.title,
        body: a.subtitle,
        image_url: a.cover_url,
        cta_label: "Skaityti straipsnį",
        cta_url: `/article/${a.slug}`,
        advertiser_id: a.author_id,
        advertiser_name: null,
        advertiser_city: null,
        priority: 0,
        frequency: 8,
      });
    }

    items.sort((a, b) => b.priority - a.priority || Math.random() - 0.5);
    return { items: items.slice(0, data.limit) };
  });

// ------ Public: impression/click counters (only real sponsored ads) ------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const bumpAdImpression = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    if (!UUID_RE.test(data.id)) return { ok: true }; // synthetic/auto-promoted card
    const s = publicClient();
    await s.rpc("bump_ad_impression", { _id: data.id });
    return { ok: true };
  });

export const bumpAdClick = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }) => {
    if (!UUID_RE.test(data.id)) return { ok: true };
    const s = publicClient();
    await s.rpc("bump_ad_click", { _id: data.id });
    return { ok: true };
  });

// ------ Admin: list all ad slots with stats ------
export const listAdSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data: ads } = await context.supabase
      .from("ad_slots")
      .select("*")
      .order("created_at", { ascending: false });
    const advIds = Array.from(new Set((ads ?? []).map((a: any) => a.advertiser_id)));
    const { data: advs } = advIds.length
      ? await context.supabase.from("profiles").select("id, business_name, owner_name, city").in("id", advIds)
      : { data: [] };
    const advMap = Object.fromEntries((advs ?? []).map((p: any) => [p.id, p]));
    return { ads: ads ?? [], advertisers: advMap };
  });

const adInput = z.object({
  id: z.string().uuid().optional(),
  advertiser_id: z.string().uuid(),
  title: z.string().min(2).max(200),
  body: z.string().max(500).optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  cta_label: z.string().min(1).max(60).default("Sužinoti daugiau"),
  cta_url: z.string().url().optional().nullable().or(z.literal("")),
  placements: z.array(z.enum(PLACEMENTS)).min(1),
  priority: z.number().int().min(0).max(100).default(0),
  frequency: z.number().int().min(2).max(30).default(6),
  target_category: z.string().optional().nullable(),
  target_city: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  starts_at: z.string().optional(),
  ends_at: z.string().optional().nullable(),
});

export const upsertAdSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => adInput.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const payload: any = {
      advertiser_id: data.advertiser_id,
      title: data.title,
      body: data.body || null,
      image_url: data.image_url || null,
      cta_label: data.cta_label,
      cta_url: data.cta_url || null,
      placement: data.placements[0], // keep legacy col in sync
      placements: data.placements,
      priority: data.priority,
      frequency: data.frequency,
      target_category: data.target_category || null,
      target_city: data.target_city || null,
      is_active: data.is_active,
      starts_at: data.starts_at ?? new Date().toISOString(),
      ends_at: data.ends_at || null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("ad_slots").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await context.supabase.from("ad_slots").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteAdSlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ad_slots").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleAdActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("ad_slots").update({ is_active: data.is_active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------ Admin: search advertisers (profiles) ------
export const searchAdvertisers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().default("") }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    let q = context.supabase.from("profiles").select("id, business_name, owner_name, city, category").not("business_name", "is", null).limit(20);
    if (data.q) q = q.ilike("business_name", `%${data.q}%`);
    const { data: rows } = await q;
    return { profiles: rows ?? [] };
  });

// ------ Admin: list auto-promoted profiles + articles ------
export const listAutoPromos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [{ data: profiles }, { data: articles }] = await Promise.all([
      context.supabase.from("profiles").select("id, business_name, city, category, featured_until, featured_priority").eq("is_featured", true).order("featured_priority", { ascending: false }),
      context.supabase.from("articles").select("id, slug, title, category, promoted_until").eq("is_promoted", true).order("published_at", { ascending: false }),
    ]);
    return { profiles: profiles ?? [], articles: articles ?? [] };
  });

export const setProfileFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    is_featured: z.boolean(),
    featured_until: z.string().optional().nullable(),
    featured_priority: z.number().int().min(0).max(100).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.id !== context.userId) await assertAdmin(context);
    const payload: any = { is_featured: data.is_featured };
    if (data.featured_until !== undefined) payload.featured_until = data.featured_until;
    if (data.featured_priority !== undefined) payload.featured_priority = data.featured_priority;
    const { error } = await context.supabase.from("profiles").update(payload).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setArticlePromoted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    is_promoted: z.boolean(),
    promoted_until: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("articles").update({
      is_promoted: data.is_promoted,
      promoted_until: data.promoted_until ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
