import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type CatalogNode = {
  id: string;
  parent_id: string | null;
  slug: string;
  label: string;
  kind: string;
  icon: string | null;
  sort_order: number;
  is_active?: boolean;
  children: CatalogNode[];
};

export const listCatalogTree = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ includeHidden: z.boolean().optional() }).optional().parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    let q = s
      .from("catalog_nodes")
      .select("id, parent_id, slug, label, kind, icon, sort_order, is_active")
      .order("sort_order", { ascending: true });
    if (!data?.includeHidden) q = q.eq("is_active", true);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const nodes = (rows ?? []) as Array<Omit<CatalogNode, "children">>;
    const byId = new Map<string, CatalogNode>();
    for (const n of nodes) byId.set(n.id, { ...n, children: [] });
    const roots: CatalogNode[] = [];
    for (const n of nodes) {
      const node = byId.get(n.id)!;
      if (n.parent_id && byId.has(n.parent_id)) byId.get(n.parent_id)!.children.push(node);
      else roots.push(node);
    }
    return { roots };
  });

async function ensureAdmin(supabase: import("@supabase/supabase-js").SupabaseClient<Database>, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Tik administratorius gali keisti katalogą.");
}

export const createCatalogNode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    parent_id: z.string().nullable(),
    label: z.string().min(1).max(120),
    slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, "Tik mažosios raidės, skaitmenys ir brūkšneliai"),
    kind: z.enum(["root", "audience", "category", "subcategory", "service", "filter_group"]),
    icon: z.string().max(60).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    let sibQuery = context.supabase
      .from("catalog_nodes")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    sibQuery = data.parent_id === null
      ? sibQuery.is("parent_id", null)
      : sibQuery.eq("parent_id", data.parent_id);
    const { data: sib } = await sibQuery.maybeSingle();
    const nextOrder = (sib?.sort_order ?? -1) + 1;
    const { data: row, error } = await context.supabase.from("catalog_nodes").insert({
      parent_id: data.parent_id,
      label: data.label,
      slug: data.slug,
      kind: data.kind,
      icon: data.icon ?? null,
      sort_order: nextOrder,
      is_active: true,
    }).select().maybeSingle();
    if (error) throw new Error(error.message);
    return { node: row };
  });

export const updateCatalogNode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string(),
    label: z.string().min(1).max(120).optional(),
    slug: z.string().min(1).max(120).optional(),
    icon: z.string().max(60).nullable().optional(),
    is_active: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("catalog_nodes").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCatalogNode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    // Cascade via manual traversal (no ON DELETE CASCADE assumed)
    const toDelete: string[] = [data.id];
    let queue = [data.id];
    while (queue.length) {
      const { data: kids } = await context.supabase.from("catalog_nodes").select("id").in("parent_id", queue);
      const ids = (kids ?? []).map((k) => k.id);
      if (!ids.length) break;
      toDelete.push(...ids);
      queue = ids;
    }
    const { error } = await context.supabase.from("catalog_nodes").delete().in("id", toDelete);
    if (error) throw new Error(error.message);
    return { ok: true, count: toDelete.length };
  });

export const reorderCatalogNodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    orders: z.array(z.object({ id: z.string(), sort_order: z.number().int() })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    for (const o of data.orders) {
      const { error } = await context.supabase.from("catalog_nodes").update({ sort_order: o.sort_order }).eq("id", o.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
