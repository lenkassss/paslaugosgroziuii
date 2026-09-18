import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAdmins } from "@/lib/notify-admins.server";
import { CLASSIFIED_SERVICE_CATEGORIES } from "@/lib/service-taxonomy";
import { sanitizeRichText, sanitizeText } from "@/lib/sanitize";

export const CLASSIFIED_CATEGORIES = [
  { key: "patalpos", label: "Patalpų nuoma" },
  { key: "iranga", label: "Įranga" },
  { key: "verslas", label: "Verslas" },
  { key: "darbas_siulo", label: "Darbo skelbimai — siūlo" },
  { key: "darbas_iesko", label: "Darbo skelbimai — ieško" },
  { key: "tiekejai", label: "Tiekėjų pasiūlymai" },
] as const;

export type ClassifiedCategory = (typeof CLASSIFIED_CATEGORIES)[number]["key"];

export type ClassifiedListing = {
  id: string;
  owner_id: string;
  category: string;
  listing_kind: string | null;
  subtype: string | null;
  place_type: string | null;
  service_category: string | null;
  is_highlighted: boolean | null;
  title: string;
  description: string | null;
  city: string | null;
  price: number | null;
  price_period: string | null;
  images: string[];
  contact_phone: string | null;
  contact_email: string | null;
  applicant_name: string | null;
  person_type: string | null;
  social_links: string | null;
  status: string;
  payment_status: string;
  rejection_note: string | null;
  created_at: string;
};

const SELECT_COLS =
  "id, owner_id, category, listing_kind, subtype, place_type, service_category, is_highlighted, title, description, city, price, price_period, images, contact_phone, contact_email, applicant_name, person_type, social_links, status, payment_status, rejection_note, is_active, created_at";

const categoryEnum = z.enum(["patalpos", "iranga", "verslas", "darbas_siulo", "darbas_iesko", "tiekejai"]);
const kindEnum = z.enum(["nuoma", "pardavimai", "darbas_siulo", "darbas_iesko"]);
const subtypeEnum = z.enum(["patalpos", "iranga", "verslas"]);
const placeEnum = z.enum(["kede", "kabinetas", "salonas"]);
const SERVICE_KEYS = CLASSIFIED_SERVICE_CATEGORIES.map((item) => item.key) as [string, ...string[]];
const serviceEnum = z.enum(SERVICE_KEYS);

/** Senos kategorijos suderinamumas su naujais tipais. */
function legacyCategory(kind: string, subtype: string | null): ClassifiedCategory {
  if (kind === "darbas_siulo" || kind === "darbas_iesko") return kind;
  if (subtype === "verslas") return "verslas";
  if (subtype === "iranga") return "iranga";
  return "patalpos";
}

/** Skelbimų sąrašas — RLS leidžia tik verslo rolėms (klientai/svečiai nieko negauna). */
export const listClassifieds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: kindEnum.nullable().optional(),
        subtype: subtypeEnum.nullable().optional(),
        place_type: placeEnum.nullable().optional(),
        service_category: serviceEnum.nullable().optional(),
        category: categoryEnum.nullable().optional(),
        city: z.string().max(60).nullable().optional(),
        q: z.string().max(80).nullable().optional(),
        limit: z.number().int().min(1).max(60).default(30),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("classified_listings")
      .select(SELECT_COLS)
      .eq("is_active", true)
      .eq("status", "approved")
      .order("is_highlighted", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.kind) q = q.eq("listing_kind", data.kind);
    if (data.subtype) q = q.eq("subtype", data.subtype);
    if (data.place_type) q = q.eq("place_type", data.place_type);
    if (data.service_category) q = q.eq("service_category", data.service_category);
    if (data.category) q = q.eq("category", data.category);
    if (data.city) q = q.eq("city", data.city);
    if (data.q) q = q.ilike("title", `%${data.q.replace(/[%_]/g, "")}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const items = ((rows ?? []) as unknown as ClassifiedListing[]).map((row) =>
      row.owner_id === context.userId ? row : maskContacts(row),
    );
    return { items };
  });

/** Kontaktai sąraše rodomi užmaskuoti – taip robotai nesurenka telefonų/el. paštų. */
function maskContacts(row: ClassifiedListing): ClassifiedListing {
  return {
    ...row,
    contact_phone: row.contact_phone ? `${row.contact_phone.slice(0, 4)}••••••` : null,
    contact_email: row.contact_email
      ? `${row.contact_email.slice(0, 2)}•••@${row.contact_email.split("@")[1] ?? ""}`
      : null,
    social_links: null,
  };
}

/**
 * Tikri kontaktai atskleidžiami tik prisijungusiam verslo naudotojui,
 * su griežtu limitu ir įrašu audito žurnale (apsauga nuo masinio nuskaitymo).
 */
export const revealClassifiedContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await context.supabase
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("actor_id", context.userId)
      .eq("action", "classified.contact_reveal")
      .gte("created_at", since);
    if ((count ?? 0) >= 20) {
      throw new Error("Per daug kontaktų peržiūrų. Pabandykite po valandos.");
    }

    const { data: row, error } = await context.supabase
      .from("classified_listings")
      .select("id, contact_phone, contact_email, social_links")
      .eq("id", data.id)
      .eq("is_active", true)
      .eq("status", "approved")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Skelbimas nerastas.");

    await context.supabase.from("audit_log").insert({
      actor_id: context.userId,
      action: "classified.contact_reveal",
      entity: "classified_listing",
      entity_id: data.id,
      meta: {},
    });

    return {
      contact_phone: row.contact_phone,
      contact_email: row.contact_email,
      social_links: row.social_links,
    };
  });

export const listMyClassifieds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("classified_listings")
      .select(SELECT_COLS)
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as unknown as ClassifiedListing[] };
  });

/** Skelbimo paraiška: mokama už paskelbimą, publikuojama tik po administratoriaus patvirtinimo. */
export const submitClassifiedApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        listing_kind: kindEnum,
        subtype: subtypeEnum.nullable().optional(),
        place_type: placeEnum.nullable().optional(),
        service_category: serviceEnum.nullable().optional(),
        applicant_name: z.string().trim().min(3).max(120),
        person_type: z.enum(["individual", "legal"]),
        contact_phone: z.string().trim().min(6).max(40),
        contact_email: z.string().trim().email().max(120),
        social_links: z.string().trim().max(300).optional(),
        title: z.string().trim().min(3).max(120),
        description: z.string().trim().min(10).max(4000),
        city: z.string().trim().max(60).optional(),
        price: z.number().min(0).max(1_000_000).nullable().optional(),
        price_period: z.enum(["month", "day", "once"]).default("once"),
        images: z.array(z.string().url()).max(8).default([]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: business } = await context.supabase.rpc("is_business_user", { _user_id: context.userId });
    if (!business) throw new Error("Skelbimus gali pateikti tik verslo paskyros (meistrė, salonas, tiekėjas, mokykla, skelbikas).");

    // Rate limit: max 5 paraiškos per 24 val.
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await context.supabase
      .from("classified_listings")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", context.userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 5) throw new Error("Per parą galima pateikti daugiausiai 5 skelbimus. Pabandykite rytoj.");

    // Patvirtinta skelbiko paskyra gali panaudoti kreditą; kitu atveju vienas skelbimas kainuoja 0,99 €.
    const { data: adv } = await context.supabase
      .from("advertiser_profiles")
      .select("id, status, listing_credits")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: isAdvertiser } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "advertiser" });
    if (isAdvertiser && (!adv || adv.status !== "approved")) {
      throw new Error("Skelbiko paskyra dar nepatvirtinta. Palaukite administratoriaus patvirtinimo.");
    }
    let addonPayment: { id: string; key: string } | null = null;
    if (!adv || (adv.listing_credits ?? 0) <= 0) {
      const { claimAddonCredit } = await import("@/lib/addon-access.server");
      try {
        addonPayment = await claimAddonCredit(context.userId, [
          "classified_pack_1", "classified_pack_3", "classified_pack_5", "classified_pack_10",

        ]);
      } catch {
        addonPayment = null;
      }
    }
    const useCredit = (!!adv && adv.status === "approved" && (adv.listing_credits ?? 0) > 0) || !!addonPayment;
    const amount_cents = useCredit ? 0 : 99;

    const { data: row, error } = await context.supabase
      .from("classified_listings")
      .insert({
        owner_id: context.userId,
        category: legacyCategory(data.listing_kind, data.subtype ?? null),
        listing_kind: data.listing_kind,
        subtype: data.subtype ?? null,
        place_type: data.place_type ?? null,
        service_category: data.service_category ?? null,
        title: sanitizeText(data.title, 200),
        description: sanitizeRichText(data.description, 8000),
        city: data.city ?? null,
        price: data.price ?? null,
        price_period: data.price_period,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        applicant_name: data.applicant_name,
        person_type: data.person_type,
        social_links: data.social_links ?? null,
        images: data.images,
        amount_cents,
        payment_status: useCredit ? "paid" : "pending",
        is_active: true,
      })
      .select("id")
      .maybeSingle();
    if (error) {
      if (addonPayment) {
        const { releaseAddonCredit } = await import("@/lib/addon-access.server");
        await releaseAddonCredit(addonPayment.id);
      }
      throw new Error(error.message);
    }

    if (useCredit && adv && !addonPayment) {
      await context.supabase
        .from("advertiser_profiles")
        .update({ listing_credits: (adv.listing_credits ?? 1) - 1 })
        .eq("id", adv.id);
    }
    await notifyAdmins("admin_classified_pending", {
      kind: "classified_listing",
      id: row?.id ?? null,
      title: data.title,
      listing_kind: data.listing_kind,
      city: data.city ?? null,
    });
    return { id: row?.id ?? null, amount_cents, usedCredit: useCredit };
  });


/** Demo mokėjimas už skelbimą (0,99 €). */
export const payForClassified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), card_last4: z.string().regex(/^\d{4}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("classified_listings")
      .select("id, owner_id, amount_cents, payment_status")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || row.owner_id !== context.userId) throw new Error("Skelbimas nerastas");
    if (row.payment_status === "paid") return { ok: true, alreadyPaid: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("demo_payments").insert({
      user_id: context.userId,
      amount: (row.amount_cents ?? 499) / 100,
      card_last4: data.card_last4,
      status: "paid",
      kind: "classified",
      target_id: row.id,
    });
    const { error } = await supabaseAdmin
      .from("classified_listings")
      .update({ payment_status: "paid" })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true, alreadyPaid: false };
  });

export const deleteClassified = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("classified_listings")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
