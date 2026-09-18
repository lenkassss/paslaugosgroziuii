import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sanitizeRichText, sanitizeText } from "@/lib/sanitize";

type AuthorLite = { business_name: string | null; owner_name: string | null; avatar_url: string | null };

async function attachAuthors<T extends { author_id: string }>(
  s: any,
  rows: T[],
): Promise<(T & { profiles: AuthorLite | null })[]> {
  const ids = [...new Set(rows.map((r) => r.author_id))];
  const map = new Map<string, AuthorLite>();
  if (ids.length) {
    const { data } = await s.from("profiles").select("id,business_name,owner_name,avatar_url").in("id", ids);
    for (const p of data ?? []) map.set(p.id, { business_name: p.business_name, owner_name: p.owner_name, avatar_url: p.avatar_url });
  }
  return rows.map((r) => ({ ...r, profiles: map.get(r.author_id) ?? null }));
}

/** Forumas — uždaras: RLS leidžia tik meistrėms, salonams ir administratoriams. */
export const listForumCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const { data, error } = await s.from("forum_categories").select("*").eq("is_active", true).order("sort_order");
    if (error) throw new Error(error.message);
    const cats = data ?? [];
    const ids = cats.map((c) => c.id);
    const counts: Record<string, number> = {};
    if (ids.length) {
      const { data: threads } = await s.from("forum_threads").select("category_id").in("category_id", ids);
      for (const t of threads ?? []) counts[t.category_id] = (counts[t.category_id] ?? 0) + 1;
    }
    return { categories: cats.map((c) => ({ ...c, thread_count: counts[c.id] ?? 0 })) };
  });

export const listForumThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ categorySlug: z.string().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const s = context.supabase;
    let categoryId: string | null = null;
    if (data.categorySlug) {
      const { data: cat } = await s.from("forum_categories").select("id").eq("slug", data.categorySlug).maybeSingle();
      if (!cat) throw new Error("Kategorija nerasta");
      categoryId = cat.id;
    }
    let q = s.from("forum_threads")
      .select("id,title,body,is_pinned,is_locked,view_count,reply_count,last_reply_at,created_at,author_id,category_id");
    if (categoryId) q = q.eq("category_id", categoryId);
    const { data: threads, error } = await q.order("is_pinned", { ascending: false }).order("last_reply_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return { threads: await attachAuthors(s, threads ?? []) };
  });

export const getForumThread = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const s = context.supabase;
    const { data: thread, error } = await s.from("forum_threads")
      .select("*,category:forum_categories(slug,label)")
      .eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!thread) throw new Error("Tema nerasta");
    const { data: replies } = await s.from("forum_replies")
      .select("*")
      .eq("thread_id", data.id).order("created_at", { ascending: true });
    const [threadWithAuthor] = await attachAuthors(s, [thread as any]);
    return { thread: threadWithAuthor, replies: await attachAuthors(s, (replies ?? []) as any[]) };
  });

export const createForumThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    categoryId: z.string().uuid(),
    title: z.string().min(4).max(200),
    body: z.string().min(10).max(10000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("forum_threads").insert({
      category_id: data.categoryId, author_id: context.userId,
      title: sanitizeText(data.title, 200), body: sanitizeRichText(data.body, 10000),
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);
    return { id: row?.id, ok: true };
  });

export const replyToThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    threadId: z.string().uuid(),
    body: z.string().min(2).max(10000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("forum_replies").insert({
      thread_id: data.threadId, author_id: context.userId, body: sanitizeRichText(data.body, 10000),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteForumThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("forum_threads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
