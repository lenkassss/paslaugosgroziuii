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

export type BlockKind = "section" | "heading" | "text" | "image" | "button" | "divider" | "cards";
export type BlockAlign = "left" | "center" | "right";
export type BlockStyle = "plain" | "card" | "highlight" | "muted";

export type SiteContentBlock = {
  id: string;
  page_slug: string;
  section_id: string;
  title: string | null;
  subtitle: string | null;
  body_text: string | null;
  image_url: string | null;
  button_text: string | null;
  button_link: string | null;
  sort_order: number;
  is_active: boolean;
  block_kind: BlockKind;
  align: BlockAlign;
  style: BlockStyle;
  is_custom: boolean;
};

const COLS =
  "id, page_slug, section_id, title, subtitle, body_text, image_url, button_text, button_link, sort_order, is_active, block_kind, align, style, is_custom";

/** Vieši redaguojami tekstai. Grąžina visus aktyvius blokus. */
export const listSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data } = await s
    .from("site_content")
    .select(COLS)
    .eq("is_active", true)
    .order("page_slug")
    .order("sort_order");
  return (data ?? []) as SiteContentBlock[];
});

/** Super admin redaktoriui – visi blokai, taip pat paslėpti. */
export const listAllSiteContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("site_content")
      .select(COLS)
      .order("page_slug")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return (data ?? []) as SiteContentBlock[];
  });

export const upsertSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    page_slug: z.string().trim().min(1).max(60),
    section_id: z.string().trim().min(1).max(60),
    title: z.string().trim().max(200).nullable().optional(),
    subtitle: z.string().trim().max(400).nullable().optional(),
    body_text: z.string().trim().max(8000).nullable().optional(),
    image_url: z.string().trim().max(600).nullable().optional(),
    button_text: z.string().trim().max(80).nullable().optional(),
    button_link: z.string().trim().max(300).nullable().optional(),
    sort_order: z.number().int().min(0).max(999).optional(),
    is_active: z.boolean().optional(),
    block_kind: z.enum(["section", "heading", "text", "image", "button", "divider", "cards"]).optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    style: z.enum(["plain", "card", "highlight", "muted"]).optional(),
    is_custom: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!isSuper) throw new Error("Turinį gali keisti tik super administratorius.");
    const { error } = await context.supabase
      .from("site_content")
      .upsert(data, { onConflict: "page_slug,section_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!isSuper) throw new Error("Turinį gali keisti tik super administratorius.");
    const { error } = await context.supabase.from("site_content").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Bloko eilės keitimas redaktoriuje (aukščiau / žemiau). */
export const reorderSiteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    items: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0).max(999) })).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!isSuper) throw new Error("Turinį gali keisti tik super administratorius.");
    for (const it of data.items) {
      const { error } = await context.supabase
        .from("site_content")
        .update({ sort_order: it.sort_order })
        .eq("id", it.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
