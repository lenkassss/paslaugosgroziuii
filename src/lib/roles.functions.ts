import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ALL_ROLES = ["client", "staff", "salon", "supplier", "school", "employer", "admin", "super_admin"] as const;

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Reikia administratoriaus teisių");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profiles, roles] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, email, business_name, owner_name, city, created_at, blocked_at, blocked_reason, subscription_active, is_primary_owner").order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    const roleMap: Record<string, string[]> = {};
    for (const r of roles.data ?? []) {
      (roleMap[r.user_id] ??= []).push(r.role as string);
    }
    return {
      users: (profiles.data ?? []).map((p) => ({ ...p, roles: roleMap[p.id] ?? [] })),
    };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    role: z.enum(ALL_ROLES),
    grant: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_set_role", {
      _target: data.userId, _role: data.role, _grant: data.grant,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
