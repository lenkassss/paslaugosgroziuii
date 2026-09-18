import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sanitizeRichText, sanitizeText } from "@/lib/sanitize";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

function slugify(title: string) {
  const base = title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

async function loadAuthors(s: ReturnType<typeof publicClient>, ids: string[]) {
  if (!ids.length) return {} as Record<string, { id: string; business_name: string | null; owner_name: string | null; avatar_url: string | null; city: string | null; category: string | null }>;
  const { data } = await s.from("profiles").select("id, business_name, owner_name, avatar_url, city, category").in("id", ids);
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]));
}

/** Kurie profiliai deklaravę pasirinktą prekės ženklą (paieškai pagal ženklą). */
async function profileIdsByBrand(s: ReturnType<typeof publicClient>, brandId: string) {
  const { data } = await s.from("provider_brands").select("profile_id").eq("brand_id", brandId).limit(5000);
  return Array.from(new Set((data ?? []).map((r) => r.profile_id)));
}

/** Autoriai pagal rolę — klientams rodome tik salonų ir meistrių pasiūlymus (ne tiekėjų). */
async function profileIdsByRoles(roles: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("user_id").in("role", roles as never).limit(20000);
  return Array.from(new Set((data ?? []).map((r) => r.user_id)));
}

// ---- LIST events ----
export const listEvents = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    upcomingOnly: z.boolean().default(true),
    page: z.number().default(0),
    limit: z.number().default(12),
    /** Paieška pagal prekės ženklą (tiekėjo/organizatoriaus ženklas). */
    brandId: z.string().uuid().optional(),
    /** Paslaugų sritis, pvz. „nagai“. */
    category: z.string().optional(),
    /** Miestas (renginio vieta). */
    city: z.string().max(60).optional(),
    /** Kalendoriaus horizontas mėnesiais (3 arba 6). */
    monthsAhead: z.number().min(1).max(12).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const from = data.page * data.limit;
    const to = from + data.limit - 1;
    let q = s.from("articles").select("*").eq("status", "published").eq("kind", "event").order("event_starts_at", { ascending: true }).range(from, to);
    if (data.upcomingOnly) q = q.gte("event_starts_at", new Date().toISOString());
    if (data.monthsAhead) {
      const until = new Date();
      until.setMonth(until.getMonth() + data.monthsAhead);
      q = q.lte("event_starts_at", until.toISOString());
    }
    if (data.category) q = q.ilike("category", `%${data.category}%`);
    if (data.city) q = q.ilike("event_location", `%${data.city.replace(/[%_]/g, "")}%`);
    if (data.brandId) {
      const ids = await profileIdsByBrand(s, data.brandId);
      if (!ids.length) return { events: [], authors: {}, page: data.page, hasMore: false };
      q = q.in("author_id", ids);
    }
    const { data: rows } = await q;
    const authors = await loadAuthors(s, Array.from(new Set((rows ?? []).map((r) => r.author_id))));
    return { events: rows ?? [], authors, page: data.page, hasMore: (rows ?? []).length >= data.limit };
  });

// ---- LIST promos ----
export const listPromos = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    activeOnly: z.boolean().default(true),
    page: z.number().default(0),
    limit: z.number().default(12),
    /** Paieška pagal prekės ženklą. */
    brandId: z.string().uuid().optional(),
    /** Paieška pagal paslaugų sritį, pvz. „nagai“. */
    category: z.string().optional(),
    /** Paieška pagal miestą – pasiūlymai tų salonų / meistrų, kurie dirba tame mieste. */
    city: z.string().optional(),
    /** Griežtas pasaulių filtras: klientai mato tik `b2c`, verslai – tik `b2b`. */
    audience: z.enum(["b2c", "b2b"]).default("b2b"),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const from = data.page * data.limit;
    const to = from + data.limit - 1;
    const now = new Date().toISOString();
    let q = s.from("articles").select("*").eq("status", "published").eq("kind", "promo").order("promo_ends_at", { ascending: true }).range(from, to);
    if (data.activeOnly) q = q.or(`promo_ends_at.is.null,promo_ends_at.gte.${now}`);
    if (data.category) q = q.ilike("category", `%${data.category}%`);
    q = q.contains("tags", [data.audience]);
    let allowed: string[] | undefined;
    if (data.brandId) {
      const ids = await profileIdsByBrand(s, data.brandId);
      allowed = ids;
      if (!allowed.length) return { promos: [], authors: {}, page: data.page, hasMore: false };
    }
    if (data.city) {
      const { data: rows } = await s.from("profiles").select("id").ilike("city", `%${data.city.replace(/[%_]/g, "")}%`).limit(5000);
      const ids = (rows ?? []).map((r) => r.id);
      allowed = allowed === undefined ? ids : allowed.filter((id: string) => ids.includes(id));
      if (!allowed.length) return { promos: [], authors: {}, page: data.page, hasMore: false };
    }
    if (allowed) q = q.in("author_id", allowed);

    const { data: rows } = await q;
    const visibleRows = rows ?? [];
    const authors = await loadAuthors(s, Array.from(new Set(visibleRows.map((r) => r.author_id))));
    return { promos: visibleRows, authors, page: data.page, hasMore: (rows ?? []).length >= data.limit };
  });



// ---- "This week" strip: nearest events + hottest promos ----
export const getThisWeek = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const now = new Date().toISOString();
  const [ev, pr] = await Promise.all([
    s.from("articles").select("id, slug, title, cover_url, category, event_starts_at, event_location, event_price_eur, author_id, kind")
      .eq("status", "published").eq("kind", "event").gte("event_starts_at", now).order("event_starts_at", { ascending: true }).limit(6),
    s.from("articles").select("id, slug, title, cover_url, category, promo_discount_pct, promo_ends_at, author_id, kind, tags")
      .eq("status", "published").eq("kind", "promo").contains("tags", ["b2c"]).or(`promo_ends_at.is.null,promo_ends_at.gte.${now}`).order("promo_discount_pct", { ascending: false, nullsFirst: false }).limit(6),
  ]);
  const authors = await loadAuthors(s, Array.from(new Set([...(ev.data ?? []).map((r) => r.author_id), ...(pr.data ?? []).map((r) => r.author_id)])));
  return {
    events: ev.data ?? [],
    promos: pr.data ?? [],
    authors,
  };
});

// ---- CREATE event ----
export const createEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().min(3).max(200),
    subtitle: z.string().max(300).optional(),
    excerpt: z.string().max(300).optional(),
    body_md: z.string().min(5),
    cover_url: z.string().url().optional().or(z.literal("")),
    category: z.string().default("Mokymai"),
    event_starts_at: z.string(),
    event_ends_at: z.string().optional(),
    event_location: z.string().min(2).max(200),
    event_price_eur: z.number().min(0).optional(),
    event_seats: z.number().int().min(1).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { claimAddonCredit, isSalonOrStaff, releaseAddonCredit } = await import("@/lib/addon-access.server");
    const provider = await isSalonOrStaff(context.supabase, context.userId);
    const { COURSE_KEYS } = await import("@/lib/packages");
    const payment = provider ? await claimAddonCredit(context.userId, COURSE_KEYS) : null;
    const { error } = await context.supabase.from("articles").insert({
      author_id: context.userId,
      slug: slugify(data.title),
      title: sanitizeText(data.title, 200),
      subtitle: data.subtitle ? sanitizeText(data.subtitle, 300) : data.subtitle,
      excerpt: data.excerpt ? sanitizeText(data.excerpt, 300) : data.excerpt,
      body_md: sanitizeRichText(data.body_md),
      cover_url: data.cover_url || null,
      category: data.category,
      kind: "event",
      status: "published",
      event_starts_at: data.event_starts_at,
      event_ends_at: data.event_ends_at ?? null,
      event_location: sanitizeText(data.event_location, 200),
      event_price_eur: data.event_price_eur ?? null,
      event_seats: data.event_seats ?? null,
    });
    if (error) {
      if (payment) await releaseAddonCredit(payment.id);
      throw new Error(error.message);
    }
    return { ok: true };
  });

// ---- CREATE promo ----
export const createPromo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().min(3).max(200),
    subtitle: z.string().max(300).optional(),
    excerpt: z.string().max(300).optional(),
    body_md: z.string().min(5),
    cover_url: z.string().url().optional().or(z.literal("")),
    promo_discount_pct: z.number().int().min(1).max(90),
    promo_starts_at: z.string().optional(),
    promo_ends_at: z.string(),
    promo_service_ids: z.array(z.string()).default([]),
    audience: z.enum(["b2c", "b2b"]).default("b2c"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { claimAddonCredit, releaseAddonCredit } = await import("@/lib/addon-access.server");
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    const roleNames = (roles ?? []).map((row) => String(row.role));
    const allowedRoles = ["salon", "staff", "supplier", "school", "admin", "super_admin"];
    if (!roleNames.some((role) => allowedRoles.includes(role))) throw new Error("Šiai paskyrai pasiūlymų skelbti negalima.");
    const acceptedKeys = [
      `special_offer_${data.audience}_7`, `special_offer_${data.audience}_14`,
      `special_offer_${data.audience}_21`, `special_offer_${data.audience}_30`,
      ...(data.audience === "b2b" ? ["supplier_offers"] : []),
    ];
    const isAdmin = roleNames.some((role) => role === "admin" || role === "super_admin");
    const payment = isAdmin ? null : await claimAddonCredit(context.userId, acceptedKeys);
    if (payment) {
      const days = payment.key === "supplier_offers" ? 30 : Number(payment.key.split("_").at(-1));
      const startsAt = data.promo_starts_at ? new Date(data.promo_starts_at) : new Date();
      const endsAt = new Date(data.promo_ends_at);
      const maximumEnd = new Date(startsAt.getTime() + days * 86_400_000 + 60_000);
      if (!Number.isFinite(days) || endsAt <= startsAt || endsAt > maximumEnd) {
        await releaseAddonCredit(payment.id);
        throw new Error(`Pasirinktas pasiūlymo planas galioja daugiausia ${days} dienas.`);
      }
    }
    const { error } = await context.supabase.from("articles").insert({
      author_id: context.userId,
      slug: slugify(data.title),
      title: sanitizeText(data.title, 200),
      subtitle: data.subtitle ? sanitizeText(data.subtitle, 300) : data.subtitle,
      excerpt: data.excerpt ? sanitizeText(data.excerpt, 300) : data.excerpt,
      body_md: sanitizeRichText(data.body_md),
      cover_url: data.cover_url || null,
      category: "Akcijos",
      kind: "promo",
      status: "published",
      promo_discount_pct: data.promo_discount_pct,
      promo_starts_at: data.promo_starts_at ?? new Date().toISOString(),
      promo_ends_at: data.promo_ends_at,
      promo_service_ids: data.promo_service_ids,
      tags: [data.audience],
    });
    if (error) {
      if (payment) await releaseAddonCredit(payment.id);
      throw new Error(error.message);
    }
    return { ok: true };
  });

// ---- CREATE article (moved from feed.functions to unify UI, but feed.functions still exports one) ----
export const createArticleUnified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    title: z.string().min(3).max(200),
    subtitle: z.string().max(300).optional(),
    excerpt: z.string().max(300).optional(),
    body_md: z.string().min(10),
    cover_url: z.string().url().optional().or(z.literal("")),
    category: z.string().default("Naujienos"),
    tags: z.array(z.string()).default([]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("articles").insert({
      author_id: context.userId,
      slug: slugify(data.title),
      title: sanitizeText(data.title, 200),
      subtitle: data.subtitle ? sanitizeText(data.subtitle, 300) : data.subtitle,
      excerpt: data.excerpt ? sanitizeText(data.excerpt, 300) : data.excerpt,
      body_md: sanitizeRichText(data.body_md),
      cover_url: data.cover_url || null,
      category: data.category,
      kind: "article",
      status: "published",
      tags: data.tags,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- MY content (for salon/supplier dashboard) ----
export const listMyContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("articles").select("*").eq("author_id", context.userId).order("published_at", { ascending: false }).limit(100);
    return { items: data ?? [] };
  });

export const deleteMyContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("articles").delete().eq("id", data.id).eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
