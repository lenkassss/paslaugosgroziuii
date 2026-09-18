import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Reikia administratoriaus teisių");
}

export const getApprovalCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [cls, sup, crs] = await Promise.all([
      supabaseAdmin.from("classified_listings").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
      supabaseAdmin.from("supplier_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabaseAdmin.from("courses").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
    ]);
    return {
      classifieds: cls.count ?? 0,
      suppliers: sup.count ?? 0,
      courses: crs.count ?? 0,
      total: (cls.count ?? 0) + (sup.count ?? 0) + (crs.count ?? 0),
    };
  });

export const listApprovalQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [cls, sup, crs] = await Promise.all([
      supabaseAdmin
        .from("classified_listings")
        .select("id, title, category, description, city, price, price_period, applicant_name, person_type, contact_phone, contact_email, social_links, status, payment_status, rejection_note, created_at, owner_id")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("supplier_requests")
        .select("id, company_name, company_code, contact_name, email, phone, website, products_description, status, admin_notes, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("courses")
        .select("id, title, category, price, starts_at, seats, duration_hours, status, payment_status, rejection_note, created_at, school_id, schools(name, city)")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      classifieds: cls.data ?? [],
      suppliers: sup.data ?? [],
      courses: crs.data ?? [],
    };
  });

const decision = z.object({
  id: z.string().uuid(),
  approve: z.boolean(),
  note: z.string().trim().max(500).optional(),
});

export const decideClassified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => decision.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("classified_listings")
      .select("id, owner_id, title")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Skelbimas nerastas");
    const { error } = await supabaseAdmin
      .from("classified_listings")
      .update({
        status: data.approve ? "approved" : "rejected",
        is_active: data.approve,
        rejection_note: data.approve ? null : (data.note ?? "Neatitinka skelbimų taisyklių"),
        approved_at: data.approve ? new Date().toISOString() : null,
        approved_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("notifications").insert({
      user_id: row.owner_id,
      type: data.approve ? "listing_approved" : "listing_rejected",
      payload: { listing_id: row.id, title: row.title, note: data.note ?? null },
    });
    return { ok: true };
  });

export const featureClassified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), weeks: z.number().int().min(1).max(8).default(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("classified_listings").select("id, owner_id").eq("id", data.id).maybeSingle();
    if (!row) throw new Error("Skelbimas nerastas");
    const ends = new Date(Date.now() + data.weeks * 7 * 86_400_000).toISOString();
    const { error } = await supabaseAdmin.from("highlight_purchases").insert({
      user_id: row.owner_id,
      target_kind: "classified",
      target_id: row.id,
      weeks: data.weeks,
      amount_cents: 0,
      payment_status: "paid",
      starts_at: new Date().toISOString(),
      ends_at: ends,
      plan_type: "admin_gift",
    });
    if (error) throw new Error(error.message);
    return { ok: true, ends_at: ends };
  });

export const deleteClassifiedAsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("classified_listings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const decideSupplierRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => decision.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("supplier_requests")
      .update({
        status: data.approve ? "approved" : "rejected",
        admin_notes: data.note ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const decideCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => decision.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("courses")
      .select("id, title, school_id, schools(owner_id)")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Kursas nerastas");
    const { error } = await supabaseAdmin
      .from("courses")
      .update({
        status: data.approve ? "approved" : "rejected",
        is_active: data.approve,
        rejection_note: data.approve ? null : (data.note ?? "Neatitinka mokymų taisyklių"),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    const ownerId = (row as any).schools?.owner_id as string | undefined;
    if (ownerId) {
      await supabaseAdmin.from("notifications").insert({
        user_id: ownerId,
        type: data.approve ? "listing_approved" : "listing_rejected",
        payload: { course_id: row.id, title: row.title, note: data.note ?? null },
      });
    }
    return { ok: true };
  });
