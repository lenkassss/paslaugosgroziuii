import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function pub() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// PUBLIC: list active staff for a salon
export const listSalonStaff = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ salonId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = pub();
    const { data: rows, error } = await s.from("salon_staff")
      .select("id, staff_name, specialization, avatar_url, bio, is_active")
      .eq("salon_id", data.salonId)
      .eq("is_active", true)
      .order("staff_name");
    if (error) throw new Error(error.message);
    return { staff: rows ?? [] };
  });

// SALON OWNER: list all my staff (incl. inactive)
export const listMyStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("salon_staff")
      .select("*").eq("salon_id", context.userId).order("staff_name");
    if (error) throw new Error(error.message);
    return { staff: data ?? [] };
  });

// SALON OWNER: create/update staff
export const upsertStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().optional(),
    staff_name: z.string().min(2).max(80),
    specialization: z.string().max(120).nullable().optional(),
    avatar_url: z.string().url().nullable().optional().or(z.literal("")),
    bio: z.string().max(1000).nullable().optional(),
    is_active: z.boolean().optional(),
    user_id: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const payload = { ...rest, salon_id: context.userId, avatar_url: rest.avatar_url || null };
    if (id) {
      const { error } = await context.supabase.from("salon_staff").update(payload).eq("id", id).eq("salon_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("salon_staff").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("salon_staff").delete().eq("id", data.id).eq("salon_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ADMIN: approve/unapprove a salon for booking
export const adminSetSalonApproved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ salonId: z.string().uuid(), approved: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("admin_set_salon_approved", { _salon: data.salonId, _approved: data.approved });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// STAFF INVITATIONS (invite by email)
// ============================================================
export const createStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    email: z.string().email().max(200),
    invited_name: z.string().max(80).optional(),
    specialization: z.string().max(120).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("staff_invitations")
      .insert({
        salon_id: context.userId,
        email: data.email.toLowerCase(),
        invited_name: data.invited_name ?? null,
        specialization: data.specialization ?? null,
      })
      .select("id, token, email, expires_at")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { invite: row };
  });

export const listStaffInvites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("staff_invitations")
      .select("id, email, invited_name, specialization, status, token, expires_at, created_at, accepted_at")
      .eq("salon_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { invites: data ?? [] };
  });

export const revokeStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("staff_invitations")
      .update({ status: "revoked" })
      .eq("id", data.id).eq("salon_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// PUBLIC-ish: peek at an invite by token (used on auth page)
export const peekStaffInvite = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = pub();
    const { data: row, error } = await s.rpc("peek_staff_invite", { _token: data.token });
    if (error) throw new Error(error.message);
    return { invite: (row && row[0]) ?? null };
  });

// AUTHENTICATED: accept invite (invitee must be signed in with matching email)
export const acceptStaffInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ token: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase.rpc("accept_staff_invite", { _token: data.token });
    if (error) throw new Error(error.message);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return { salonId: row?.salon_id as string | undefined, salonName: row?.salon_name as string | undefined };
  });
