import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Reikia administratoriaus teisių.");
}

async function ensureSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_super_admin", { _user_id: userId });
  if (!data) throw new Error("Reikia super administratoriaus teisių.");
}

// ------------- BLOCK / UNBLOCK USERS -------------
export const adminBlockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    reason: z.string().min(3).max(300),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_block_user", { _target: data.userId, _reason: data.reason });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUnblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_unblock_user", { _target: data.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- SUPER ADMIN OPERATIONS -------------
export const superAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const [users, salons, suppliers, admins, blocked, hp, events] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "salon"),
      context.supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "supplier"),
      context.supabase.from("user_roles").select("user_id", { count: "exact", head: true }).in("role", ["admin", "super_admin"]),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }).not("blocked_at", "is", null),
      context.supabase.from("highlight_purchases").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
      context.supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
    ]);
    return {
      users: users.count ?? 0,
      salons: salons.count ?? 0,
      suppliers: suppliers.count ?? 0,
      admins: admins.count ?? 0,
      blocked: blocked.count ?? 0,
      activeHighlights: hp.count ?? 0,
      paidEventRegs: events.count ?? 0,
    };
  });

export const superAdminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    role: z.enum(["client", "salon", "supplier", "admin", "super_admin", "staff", "school", "employer"]),
    grant: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("super_admin_set_role", {
      _target: data.userId, _role: data.role, _grant: data.grant,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const superAdminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, business_name, owner_name, email, city, blocked_at, blocked_reason, subscription_active, is_approved, verification_status")
      .order("created_at", { ascending: false })
      .limit(500);
    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role").in("user_id", ids);
    const rolesByUser = new Map<string, string[]>();
    (roles ?? []).forEach((r: any) => {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    });
    return {
      users: (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] })),
    };
  });

// ------------- SALON APPROVAL -------------
export const adminSetSalonApproved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ salonId: z.string().uuid(), approved: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { error } = await context.supabase.rpc("admin_set_salon_approved", {
      _salon: data.salonId,
      _approved: data.approved,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------- HIGHLIGHT PURCHASES (boost €4.99/week) -------------
export const adminListHighlights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data } = await context.supabase
      .from("highlight_purchases")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return { highlights: data ?? [] };
  });


export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const [users, articles, apts, memberships, promos, events, comments] = await Promise.all([
      context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      context.supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
      context.supabase.from("appointments").select("id", { count: "exact", head: true }),
      context.supabase.from("profiles").select("id", { count: "exact", head: true }).eq("subscription_active", true),
      context.supabase.from("articles").select("id", { count: "exact", head: true }).eq("kind", "promo").eq("status", "published"),
      context.supabase.from("articles").select("id", { count: "exact", head: true }).eq("kind", "event").eq("status", "published"),
      context.supabase.from("article_comments").select("id", { count: "exact", head: true }),
    ]);
    return {
      users: users.count ?? 0,
      articles: articles.count ?? 0,
      appointments: apts.count ?? 0,
      activeMemberships: memberships.count ?? 0,
      promos: promos.count ?? 0,
      events: events.count ?? 0,
      comments: comments.count ?? 0,
    };
  });

export const adminListAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    limit: z.number().int().min(1).max(200).default(50),
    status: z.enum(["all", "pending", "confirmed", "cancelled", "completed"]).default("all"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    let query = context.supabase
      .from("appointments")
      .select("id, salon_id, service_name, client_name, client_phone, client_email, appointment_date, time_slot, duration_mins, status, deposit_amount, deposit_status, payment_status, service_price, created_at")
      .order("appointment_date", { ascending: false })
      .order("time_slot", { ascending: false })
      .limit(data.limit);
    if (data.status !== "all") query = query.eq("status", data.status);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const salonIds = Array.from(new Set((rows ?? []).map((r: any) => r.salon_id).filter(Boolean)));
    const salonNames = new Map<string, string>();
    if (salonIds.length) {
      const { data: sal } = await context.supabase
        .from("profiles").select("id, business_name, city").in("id", salonIds);
      (sal ?? []).forEach((s: any) => salonNames.set(s.id, s.business_name || s.city || "—"));
    }
    return {
      appointments: (rows ?? []).map((r: any) => ({ ...r, salon_name: salonNames.get(r.salon_id) ?? "—" })),
    };
  });

// ------------- MEMBERSHIP MANAGEMENT -------------
export const adminListMemberships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: roles } = await context.supabase
      .from("user_roles").select("user_id, role").in("role", ["salon", "supplier", "staff", "school", "employer"]);
    const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
    if (!ids.length) return { members: [] };
    const roleByUser = new Map<string, string>();
    (roles ?? []).forEach((r: any) => { if (!roleByUser.has(r.user_id)) roleByUser.set(r.user_id, r.role); });
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, business_name, owner_name, email, city, subscription_active, subscription_expires_at, subscription_plan, subscription_state, subscription_billing, plan_tier, next_billing_at, wallet_balance, is_approved, blocked_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      members: (profiles ?? []).map((p: any) => ({ ...p, role: roleByUser.get(p.id) ?? "client" })),
    };
  });

export const adminSetMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    userId: z.string().uuid(),
    action: z.enum(["grant", "revoke", "extend_month", "extend_year", "set_tier"]),
    tier: z.enum(["silver", "gold", "diamond"]).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data: current, error: readErr } = await context.supabase
      .from("profiles").select("subscription_expires_at, plan_tier").eq("id", data.userId).maybeSingle();
    if (readErr) throw new Error(readErr.message);

    const now = new Date();
    const base = current?.subscription_expires_at && new Date(current.subscription_expires_at) > now
      ? new Date(current.subscription_expires_at) : now;
    const patch: {
      subscription_active?: boolean;
      subscription_state?: "none" | "trial" | "active" | "past_due" | "cancelled" | "expired";
      subscription_expires_at?: string | null;
      next_billing_at?: string | null;
      subscription_billing?: "monthly" | "yearly";
      plan_tier?: string;
    } = {};

    if (data.action === "grant") {
      const end = new Date(now); end.setMonth(end.getMonth() + 1);
      patch.subscription_active = true;
      patch.subscription_state = "active";
      patch.subscription_expires_at = end.toISOString();
      patch.next_billing_at = end.toISOString();
      if (!current?.plan_tier) patch.plan_tier = "silver";
    } else if (data.action === "revoke") {
      patch.subscription_active = false;
      patch.subscription_state = "cancelled";
      patch.subscription_expires_at = null;
      patch.next_billing_at = null;
    } else if (data.action === "extend_month" || data.action === "extend_year") {
      const end = new Date(base);
      if (data.action === "extend_month") end.setMonth(end.getMonth() + 1);
      else end.setFullYear(end.getFullYear() + 1);
      patch.subscription_active = true;
      patch.subscription_state = "active";
      patch.subscription_billing = data.action === "extend_year" ? "yearly" : "monthly";
      patch.subscription_expires_at = end.toISOString();
      patch.next_billing_at = end.toISOString();
    } else {
      if (!data.tier) throw new Error("Nepasirinktas narystės lygis.");
      patch.plan_tier = data.tier;
    }

    const { error } = await context.supabase.from("profiles").update(patch).eq("id", data.userId);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: `membership.${data.action}`, entity: "profile", entity_id: data.userId,
      meta: { tier: data.tier ?? null },
    });
    return { ok: true };
  });


export const adminReadAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { data } = await context.supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    return { entries: data ?? [] };
  });

// Export a table to JSON (admin only) — for platform migration
export const adminExportTable = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    table: z.enum(["profiles", "articles", "posts", "appointments", "services", "event_registrations", "user_roles", "catalog_nodes", "ad_slots", "article_comments", "follows", "notifications", "site_settings", "audit_log"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from(data.table).select("*");
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "export.table", entity: data.table, entity_id: null,
      meta: { rows: rows?.length ?? 0 },
    });
    return { table: data.table, rows: rows ?? [], count: rows?.length ?? 0 };
  });
