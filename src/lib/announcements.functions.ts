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

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Reikia administratoriaus teisių.");
}

async function ensureSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Tik super administratorius gali skelbti pranešimus visai platformai.");
}

/** PUBLIC — active announcements shown site-wide. */
export const listActiveAnnouncements = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data, error } = await s
    .from("announcements")
    .select("id, title, body, level, active_from, active_until")
    .order("active_from", { ascending: false })
    .limit(5);
  if (error) return { announcements: [] };
  return { announcements: data ?? [] };
});

/** ADMIN — read every announcement (including scheduled / expired). */
export const adminListAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("announcements")
      .select("*")
      .order("active_from", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { announcements: data ?? [] };
  });

/** SUPER ADMIN — publish a platform-wide announcement. */
export const superAdminCreateAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        title: z.string().min(3).max(120),
        body: z.string().max(600).optional(),
        level: z.enum(["info", "success", "warning", "critical"]),
        activeFrom: z.string().optional(),
        activeUntil: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("announcements").insert({
      title: data.title,
      body: data.body ?? null,
      level: data.level,
      active_from: data.activeFrom ? new Date(data.activeFrom).toISOString() : new Date().toISOString(),
      active_until: data.activeUntil ? new Date(data.activeUntil).toISOString() : null,
      created_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** SUPER ADMIN — retire an announcement immediately. */
export const superAdminEndAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("announcements")
      .update({ active_until: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** SUPER ADMIN — delete an announcement. */
export const superAdminDeleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
