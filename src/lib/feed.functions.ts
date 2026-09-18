import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { pickDayHours, type WorkingHourRow } from "@/lib/working-hours";
import { localWeekday } from "@/lib/availability-time";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type FeedAuthor = {
  id: string;
  business_name: string | null;
  owner_name: string | null;
  avatar_url: string | null;
  city: string | null;
  category: string | null;
  role: "salon" | "supplier" | "admin" | "client";
};

async function fetchAuthors(s: ReturnType<typeof publicClient>, ids: string[]): Promise<Record<string, FeedAuthor>> {
  if (!ids.length) return {};
  const [profRes, roleRes] = await Promise.all([
    s.from("profiles").select("id, business_name, owner_name, avatar_url, city, category").in("id", ids),
    s.from("user_roles").select("user_id, role").in("user_id", ids),
  ]);
  const roleMap = new Map<string, FeedAuthor["role"]>();
  for (const r of roleRes.data ?? []) roleMap.set(r.user_id, r.role as FeedAuthor["role"]);
  const out: Record<string, FeedAuthor> = {};
  for (const p of profRes.data ?? []) {
    out[p.id] = { ...p, role: roleMap.get(p.id) ?? "client" };
  }
  return out;
}

// ------------- FEED (mixed articles + posts + ads) -------------
export const getFeed = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    category: z.string().optional(),
    page: z.number().default(0),
    limit: z.number().default(12),
    /** Kam skirtas srautas: `b2c` – klientams, `b2b` – verslui. */
    audience: z.enum(["b2c", "b2b"]).default("b2c"),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const from = data.page * data.limit;
    const to = from + data.limit - 1;

    let articleQ = s.from("articles")
      .select("id, slug, title, subtitle, cover_url, category, excerpt, tags, views, author_id, published_at")
      .eq("status", "published")
      .eq("kind", "article")
      .order("published_at", { ascending: false })
      .range(from, to);
    if (data.category) articleQ = articleQ.eq("category", data.category);

    const nowIso = new Date().toISOString();
    const [artRes, postRes, adRes, promoRes] = await Promise.all([
      articleQ,
      s.from("posts").select("*").order("created_at", { ascending: false }).range(from, to),
      s.from("ad_slots").select("*").eq("is_active", true).eq("placement", "feed").limit(6),
      // Paid promoted (sponsored) articles — ALWAYS pinned on the first page, never scroll away.
      data.page === 0
        ? s.from("articles")
            .select("id, slug, title, subtitle, cover_url, category, excerpt, tags, views, author_id, published_at, promoted_label, promoted_until, promoted_priority")
            .eq("status", "published")
            .eq("kind", "article")
            .eq("is_promoted", true)
            .or(`promoted_until.is.null,promoted_until.gt.${nowIso}`)
            .order("promoted_priority", { ascending: false })
            .order("published_at", { ascending: false })
            .limit(4)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    // Auditorijos filtras: „Verslui“ pažymėti straipsniai nerodomi klientams ir atvirkščiai.
    const other = data.audience === "b2c" ? "b2b" : "b2c";
    const forAudience = (row: { tags?: string[] | null }) =>
      !Array.isArray(row.tags) || !row.tags.includes(other);
    const promoted = ((promoRes as any).data ?? []).filter(forAudience);
    const promotedIds = new Set(promoted.map((p: any) => p.id));
    const articles = (artRes.data ?? []).filter((a) => !promotedIds.has(a.id)).filter(forAudience);
    const posts = (postRes.data ?? []).filter(forAudience);
    const ads = adRes.data ?? [];

    const authorIds = Array.from(new Set([
      ...articles.map((a) => a.author_id),
      ...promoted.map((a: any) => a.author_id),
      ...posts.map((p) => p.author_id),
      ...ads.map((a) => a.advertiser_id),
    ]));
    const authors = await fetchAuthors(s, authorIds);

    const hasMore = articles.length >= data.limit || posts.length >= data.limit;
    return { articles, promoted, posts, ads, authors, page: data.page, hasMore };
  });



// ------------- HERO + trending sidebar -------------
export const getHome = createServerFn({ method: "GET" })
  .handler(async () => {
    const s = publicClient();
    // Salon user ids first — "Atrinkti salonai" MUST show real salons only (never suppliers/staff).
    const { data: salonRows } = await s.rpc("list_salon_ids");
    const salonIds = (salonRows ?? []).map((r: any) => r.user_id);

    const [heroRes, trendingRes, sidebarAdsRes, salonsRes] = await Promise.all([
      s.from("articles").select("id, slug, title, subtitle, cover_url, category, excerpt, author_id, published_at, views").eq("status", "published").eq("kind", "article").order("views", { ascending: false }).limit(1),
      s.from("articles").select("id, slug, title, category, published_at, views, cover_url").eq("status", "published").eq("kind", "article").order("views", { ascending: false }).limit(6),
      s.from("ad_slots").select("*").eq("is_active", true).eq("placement", "sidebar").limit(3),
      salonIds.length
        ? s.from("profiles")
            .select("id, business_name, city, address, lat, lng, amenities, avatar_url, cover_url, gallery_urls, category, verification_status, is_featured, featured_until, featured_priority")
            .in("id", salonIds)
            .eq("suspended", false)
            .eq("is_approved", true)
            .not("business_name", "is", null)
            .order("is_featured", { ascending: false })
            .order("featured_priority", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const nowIso = new Date().toISOString();
    const salonRowIds = (salonsRes.data ?? []).map((r: any) => r.id);
    const { data: reviewRows } = salonRowIds.length
      ? await s.from("salon_reviews").select("salon_id, rating_stars").in("salon_id", salonRowIds).eq("approved", true)
      : { data: [] as any[] };
    const ratingMap = new Map<string, { sum: number; n: number }>();
    for (const r of reviewRows ?? []) {
      const cur = ratingMap.get(r.salon_id) ?? { sum: 0, n: 0 };
      ratingMap.set(r.salon_id, { sum: cur.sum + (r.rating_stars ?? 0), n: cur.n + 1 });
    }
    // Darbo laikas: tik salono bendras grafikas (staff_id = null) — meistrių
    // eilutės nebeperrašo salono laikų kortelėse.
    const weekday = localWeekday();
    const { data: hourRows } = salonRowIds.length
      ? await s.from("working_hours")
          .select("salon_id, weekday, start_time, end_time, is_closed, staff_id")
          .in("salon_id", salonRowIds)
          .is("staff_id", null)
          .eq("weekday", weekday)
      : { data: [] as any[] };
    const hoursBySalon = new Map<string, WorkingHourRow[]>();
    for (const h of hourRows ?? []) {
      const arr = hoursBySalon.get(h.salon_id) ?? [];
      arr.push(h as WorkingHourRow);
      hoursBySalon.set(h.salon_id, arr);
    }
    const salons = (salonsRes.data ?? []).map((s) => {
      const agg = ratingMap.get(s.id);
      return {
        ...s,
        is_featured_active: !!s.is_featured && !!s.featured_until && s.featured_until > nowIso,
        rating: agg && agg.n ? agg.sum / agg.n : null,
        reviews: agg?.n ?? 0,
        todayHours: pickDayHours(hoursBySalon.get(s.id) ?? [], { weekday }),
      };
    });

    const authorIds = Array.from(new Set([
      ...(heroRes.data ?? []).map((a) => a.author_id),
      ...(sidebarAdsRes.data ?? []).map((a) => a.advertiser_id),
    ]));
    const authors = await fetchAuthors(s, authorIds);
    return {
      hero: heroRes.data?.[0] ?? null,
      trending: trendingRes.data ?? [],
      sidebarAds: sidebarAdsRes.data ?? [],
      salons,
      authors,
    };
  });

// ------------- ARTICLE detail -------------
export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { data: article, error } = await s.from("articles").select("*").eq("slug", data.slug).eq("status", "published").maybeSingle();
    if (error || !article) throw new Error("Straipsnis nerastas");
    // views bump (best effort)
    await s.from("articles").update({ views: article.views + 1 }).eq("id", article.id);
    const authors = await fetchAuthors(s, [article.author_id]);
    const { data: more } = await s.from("articles").select("id, slug, title, cover_url, category, published_at").eq("author_id", article.author_id).eq("status", "published").neq("id", article.id).order("published_at", { ascending: false }).limit(3);
    return { article, author: authors[article.author_id] ?? null, more: more ?? [] };
  });

// ------------- COMMENTS list -------------
export const getPostComments = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ postId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { data: comments } = await s.from("post_comments").select("*").eq("post_id", data.postId).order("created_at", { ascending: true }).limit(50);
    const ids = Array.from(new Set((comments ?? []).map((c) => c.user_id)));
    const { data: profs } = await s.from("profiles").select("id, business_name, owner_name, avatar_url").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    return { comments: comments ?? [], profiles: profs ?? [] };
  });

// ------------- LIKE / UNLIKE -------------
export const togglePostLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ postId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const existing = await context.supabase.from("post_reactions").select("id").eq("post_id", data.postId).eq("user_id", context.userId).eq("reaction", "like").maybeSingle();
    if (existing.data) {
      await context.supabase.from("post_reactions").delete().eq("id", existing.data.id);
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: p } = await supabaseAdmin.from("posts").select("likes_count").eq("id", data.postId).maybeSingle();
      await supabaseAdmin.from("posts").update({ likes_count: Math.max(0, (p?.likes_count ?? 1) - 1) }).eq("id", data.postId);
      return { liked: false };
    }
    await context.supabase.from("post_reactions").insert({ post_id: data.postId, user_id: context.userId, reaction: "like" });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("posts").select("likes_count").eq("id", data.postId).maybeSingle();
    await supabaseAdmin.from("posts").update({ likes_count: (p?.likes_count ?? 0) + 1 }).eq("id", data.postId);
    return { liked: true };
  });

// ------------- COMMENT -------------
export const addPostComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ postId: z.string(), body: z.string().min(1).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("post_comments").insert({ post_id: data.postId, user_id: context.userId, body: data.body });
    if (error) throw new Error(error.message);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("posts").select("comments_count").eq("id", data.postId).maybeSingle();
    await supabaseAdmin.from("posts").update({ comments_count: (p?.comments_count ?? 0) + 1 }).eq("id", data.postId);
    return { ok: true };
  });

// ------------- CREATE POST -------------
export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    body: z.string().min(1).max(2000),
    image_urls: z.array(z.string().url()).max(4).default([]),
    tags: z.array(z.string()).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("posts").insert({
      author_id: context.userId,
      body: data.body,
      image_urls: data.image_urls,
      tags: data.tags,
    }).select().single();
    if (error) throw new Error(error.message);
    return { post: row };
  });

// ------------- CREATE ARTICLE -------------
export const createArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().min(3).max(200),
    subtitle: z.string().max(300).optional(),
    body_md: z.string().min(10),
    excerpt: z.string().max(300).optional(),
    cover_url: z.string().url().optional(),
    category: z.string().default("Naujienos"),
    tags: z.array(z.string()).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const baseSlug = data.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
    const { data: row, error } = await context.supabase.from("articles").insert({
      author_id: context.userId,
      slug,
      title: data.title,
      subtitle: data.subtitle,
      body_md: data.body_md,
      excerpt: data.excerpt,
      cover_url: data.cover_url,
      category: data.category,
      tags: data.tags,
    }).select().single();
    if (error) throw new Error(error.message);
    return { article: row };
  });

// ------------- FOLLOW / UNFOLLOW -------------
export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ targetId: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.targetId === context.userId) throw new Error("Negalima sekti savęs");
    const existing = await context.supabase.from("follows").select("id").eq("follower_id", context.userId).eq("target_id", data.targetId).maybeSingle();
    if (existing.data) {
      await context.supabase.from("follows").delete().eq("id", existing.data.id);
      return { following: false };
    }
    await context.supabase.from("follows").insert({ follower_id: context.userId, target_id: data.targetId });
    return { following: true };
  });
