import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sanitizeRichText } from "@/lib/sanitize";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type CommentAuthor = {
  id: string;
  business_name: string | null;
  owner_name: string | null;
  avatar_url: string | null;
};

export type CommentRow = {
  id: string;
  article_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  status: string;
  score: number;
  upvotes: number;
  downvotes: number;
  reply_count: number;
  edited_at: string | null;
  created_at: string;
  author: CommentAuthor | null;
  children?: CommentRow[];
};

function validateBody(raw: string) {
  const body = sanitizeRichText(raw, 4000);
  if (body.length < 1) throw new Error("Komentaras negali būti tuščias");
  if (body.length > 2000) throw new Error("Komentaras per ilgas (max 2000)");
  const urls = body.match(/https?:\/\/\S+/g) ?? [];
  if (urls.length > 5) throw new Error("Per daug nuorodų");
  if (urls.length && urls.join("").length / body.length > 0.9) throw new Error("Komentaras negali būti vien nuoroda");
  return body;
}

// -------- LIST comments (public) --------
export const listComments = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    articleId: z.string().uuid(),
    sort: z.enum(["hot", "top", "new"]).default("hot"),
    limit: z.number().min(1).max(100).default(50),
  }).parse(d))
  .handler(async ({ data }): Promise<{ comments: CommentRow[]; total: number }> => {
    const s = publicClient();
    const { data: rows, error } = await s
      .from("article_comments")
      .select("id, article_id, user_id, parent_id, body, status, score, upvotes, downvotes, reply_count, edited_at, created_at")
      .eq("article_id", data.articleId)
      .in("status", ["visible", "pending"])
      .limit(data.limit);
    if (error) throw new Error(error.message);
    const list = rows ?? [];

    const userIds = Array.from(new Set(list.map((r) => r.user_id)));
    const authorsMap: Record<string, CommentAuthor> = {};
    if (userIds.length) {
      const { data: profs } = await s
        .from("profiles")
        .select("id, business_name, owner_name, avatar_url")
        .in("id", userIds);
      for (const p of profs ?? []) authorsMap[p.id] = p;
    }

    // sort
    const nowMs = Date.now();
    const scored = list.map((c) => {
      const ageH = (nowMs - new Date(c.created_at).getTime()) / 3_600_000;
      const hot = c.score / Math.pow(ageH + 2, 1.5);
      return { c, hot };
    });
    if (data.sort === "hot") scored.sort((a, b) => b.hot - a.hot);
    else if (data.sort === "top") scored.sort((a, b) => b.c.score - a.c.score);
    else scored.sort((a, b) => new Date(b.c.created_at).getTime() - new Date(a.c.created_at).getTime());

    // Build tree
    const byId = new Map<string, CommentRow>();
    for (const { c } of scored) {
      byId.set(c.id, { ...c, author: authorsMap[c.user_id] ?? null, children: [] });
    }
    const roots: CommentRow[] = [];
    for (const { c } of scored) {
      const node = byId.get(c.id)!;
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }
    return { comments: roots, total: list.length };
  });

// -------- CREATE comment --------
export const createComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    articleId: z.string().uuid(),
    parentId: z.string().uuid().optional().nullable(),
    body: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const body = validateBody(data.body);

    // rate limit: 5 per 5 min
    const since = new Date(Date.now() - 5 * 60_000).toISOString();
    const { count } = await context.supabase
      .from("article_comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("Per daug komentarų. Palauk kelias minutes.");

    const { data: row, error } = await context.supabase
      .from("article_comments")
      .insert({
        article_id: data.articleId,
        user_id: context.userId,
        parent_id: data.parentId ?? null,
        body,
      })
      .select("id, article_id, user_id, parent_id, body, status, score, upvotes, downvotes, reply_count, edited_at, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });

// -------- UPDATE (edit) --------
export const updateComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), body: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const body = validateBody(data.body);
    const { data: row, error } = await context.supabase
      .from("article_comments")
      .update({ body, edited_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("id, body, edited_at")
      .single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });

// -------- DELETE (soft) --------
export const deleteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("article_comments")
      .update({ status: "deleted", body: "[ištrinta]" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- VOTE --------
export const voteComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    value: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.value === 0) {
      await context.supabase.from("comment_votes").delete().eq("comment_id", data.id).eq("user_id", context.userId);
    } else {
      await context.supabase.from("comment_votes")
        .upsert({ comment_id: data.id, user_id: context.userId, value: data.value }, { onConflict: "comment_id,user_id" });
    }
    return { ok: true };
  });

// -------- MY VOTES (for a set of comments) --------
export const getMyVotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ commentIds: z.array(z.string().uuid()).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    if (!data.commentIds.length) return { votes: {} as Record<string, number> };
    const { data: rows } = await context.supabase
      .from("comment_votes")
      .select("comment_id, value")
      .in("comment_id", data.commentIds)
      .eq("user_id", context.userId);
    const votes: Record<string, number> = {};
    for (const r of rows ?? []) votes[r.comment_id] = r.value;
    return { votes };
  });

// -------- REPORT --------
export const reportComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), reason: z.string().min(3).max(500) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("comment_reports").insert({
      comment_id: data.id,
      reporter_id: context.userId,
      reason: data.reason.trim(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- MODERATE (admin) --------
export const moderateComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    action: z.enum(["hide", "restore", "delete"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Tik admin");
    const status = (data.action === "hide" ? "hidden" : data.action === "restore" ? "visible" : "deleted") as "hidden" | "visible" | "deleted";
    const patch: { status: "hidden" | "visible" | "deleted"; body?: string } = { status };
    if (data.action === "delete") patch.body = "[pašalinta moderatoriaus]";
    const { error } = await context.supabase.from("article_comments").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    // notify author
    if (data.action === "hide" || data.action === "delete") {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: c } = await supabaseAdmin.from("article_comments").select("user_id, article_id").eq("id", data.id).maybeSingle();
      if (c) {
        await supabaseAdmin.from("notifications").insert({
          user_id: c.user_id,
          type: "comment_removed",
          payload: { comment_id: data.id, article_id: c.article_id, action: data.action },
        });
      }
    }
    return { ok: true };
  });

// -------- LIST REPORTS (admin) --------
export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ status: z.enum(["open", "resolved"]).default("open") }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Tik admin");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: reports } = await supabaseAdmin
      .from("comment_reports")
      .select("id, comment_id, reporter_id, reason, status, created_at")
      .eq("status", data.status)
      .order("created_at", { ascending: false })
      .limit(100);
    const commentIds = Array.from(new Set((reports ?? []).map((r) => r.comment_id)));
    const { data: comments } = commentIds.length
      ? await supabaseAdmin.from("article_comments").select("id, body, status, article_id, user_id, created_at").in("id", commentIds)
      : { data: [] as never[] };
    return { reports: reports ?? [], comments: comments ?? [] };
  });

export const resolveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Tik admin");
    await context.supabase.from("comment_reports").update({ status: "resolved" }).eq("id", data.id);
    return { ok: true };
  });
