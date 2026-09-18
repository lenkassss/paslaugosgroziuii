import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAdmins } from "@/lib/notify-admins.server";

export type AdvertiserProfile = {
  id: string;
  user_id: string;
  person_type: string;
  business_name: string | null;
  full_name: string;
  email: string;
  phone: string;
  address: string | null;
  social_links: string | null;
  intent: string | null;
  status: string;
  rejection_note: string | null;
  listing_credits: number;
  subscription_active: boolean;
  created_at: string;
};

const COLS =
  "id, user_id, person_type, business_name, full_name, email, phone, address, social_links, intent, status, rejection_note, listing_credits, subscription_active, created_at";

/** Mano skelbiko anketa (jei pateikta). */
export const getMyAdvertiserProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("advertiser_profiles")
      .select(COLS)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { profile: (data ?? null) as AdvertiserProfile | null };
  });

/** Skelbiko (tik skelbimų) paskyros anketa — tvirtina administratorius. */
export const submitAdvertiserApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        person_type: z.enum(["individual", "legal"]),
        business_name: z.string().trim().max(160).optional(),
        full_name: z.string().trim().min(3).max(120),
        email: z.string().trim().email().max(120),
        phone: z.string().trim().min(6).max(40),
        address: z.string().trim().max(200).optional(),
        social_links: z.string().trim().max(300).optional(),
        intent: z.string().trim().min(10).max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("advertiser_profiles")
      .select("id, status")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing && existing.status !== "rejected") {
      throw new Error("Anketa jau pateikta. Palaukite administratoriaus sprendimo.");
    }

    if (existing) {
      const { error } = await context.supabase
        .from("advertiser_profiles")
        .update({ ...data, status: "pending", rejection_note: null })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      await notifyAdmins("admin_classified_pending", {
        kind: "advertiser_profile",
        full_name: data.full_name,
        email: data.email,
        resubmitted: true,
      });
      return { ok: true, resubmitted: true };
    }

    const { error } = await context.supabase.from("advertiser_profiles").insert({
      user_id: context.userId,
      person_type: data.person_type,
      business_name: data.business_name ?? null,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      address: data.address ?? null,
      social_links: data.social_links ?? null,
      intent: data.intent,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    await notifyAdmins("admin_classified_pending", {
      kind: "advertiser_profile",
      full_name: data.full_name,
      email: data.email,
    });
    return { ok: true, resubmitted: false };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
  if (!isAdmin && !isSuper) throw new Error("Reikia administratoriaus teisių");
}

export const listAdvertiserApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("advertiser_profiles")
      .select(COLS)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as unknown as AdvertiserProfile[] };
  });

/** Administratoriaus sprendimas: patvirtinus suteikiama „advertiser" rolė ir 1 skelbimo kreditas. */
export const decideAdvertiser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), approve: z.boolean(), note: z.string().trim().max(500).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("advertiser_profiles")
      .select("id, user_id, full_name")
      .eq("id", data.id)
      .maybeSingle();
    if (!row) throw new Error("Anketa nerasta");

    const { error } = await supabaseAdmin
      .from("advertiser_profiles")
      .update({
        status: data.approve ? "approved" : "rejected",
        rejection_note: data.approve ? null : (data.note ?? "Anketa neatitinka reikalavimų"),
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        listing_credits: data.approve ? 1 : 0,
        subscription_active: data.approve,
      })
      .eq("id", row.id);
    if (error) throw new Error(error.message);

    if (data.approve) {
      await supabaseAdmin.from("user_roles").upsert(
        { user_id: row.user_id, role: "advertiser" as never },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );
    }

    await supabaseAdmin.from("notifications").insert({
      user_id: row.user_id,
      type: data.approve ? "listing_approved" : "listing_rejected",
      payload: { kind: "advertiser_profile", note: data.note ?? null },
    });
    return { ok: true };
  });
