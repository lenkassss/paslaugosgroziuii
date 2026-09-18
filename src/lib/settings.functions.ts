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

export type SiteSettings = {
  brand_name: string;
  tagline: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta_label: string;
  contact_email: string | null;
  contact_phone: string | null;
  features: Record<string, boolean | number | string>;
  announcement: string | null;
  announcement_active: boolean;
  /* Dizainas ir tipografija */
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  card_bg_color: string;
  primary_font: string;
  heading_font: string;
  base_font_size: string;
  logo_url: string | null;
  favicon_url: string | null;
  site_name: string;
  footer_text: string | null;
  border_radius: string;
  button_style: string;
  /** Sekcijų rodymas: { hero_search: false } → paslėpta. */
  sections: Record<string, boolean>;
  /* Analitika ir slapukai */
  ga_measurement_id: string | null;
  meta_pixel_id: string | null;
  cookie_banner_text: string | null;
};

export const THEME_DEFAULTS = {
  primary_color: "#1a1a1a",
  secondary_color: "#f5f5f5",
  accent_color: "#c9a227",
  background_color: "#ffffff",
  text_color: "#141414",
  card_bg_color: "#ffffff",
  primary_font: "Figtree",
  heading_font: "Outfit",
  base_font_size: "16px",
  logo_url: null,
  favicon_url: null,
  site_name: "PaslaugosGrožiui",
  footer_text: null,
  border_radius: "rounded",
  button_style: "solid",
  sections: {} as Record<string, boolean>,
  ga_measurement_id: null as string | null,
  meta_pixel_id: null as string | null,
  cookie_banner_text: null as string | null,
};

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data } = await s.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return {
    brand_name: "PaslaugosGrožiui",
    tagline: "Grožio industrijos ekosistema",
    hero_title: "Grožio industrijos ekosistema",
    hero_subtitle: "Naujienos, mokymai, akcijos ir rezervacijos vienoje vietoje.",
    hero_cta_label: "Rasti laisvą laiką",
    contact_email: null,
    contact_phone: null,
    features: { comments: true, b2b: true, promos: true, events: true, map: true, cursor: true, public_b2c_store: false, maintenance_mode: false, commission_fee_eur: 0.49 },
    announcement: null,
    announcement_active: false,
    ...THEME_DEFAULTS,
    ...(data ?? {}),
  } as SiteSettings;
});

const THEME_KEYS = [
  "primary_color", "secondary_color", "accent_color", "background_color", "text_color", "card_bg_color",
  "primary_font", "heading_font", "base_font_size", "logo_url", "favicon_url", "site_name",
  "footer_text", "border_radius", "button_style", "sections",
] as const;

const hex = z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/, "Netinkamas spalvos kodas");

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    brand_name: z.string().trim().min(1).max(80).optional(),
    tagline: z.string().trim().max(200).optional(),
    hero_title: z.string().trim().min(1).max(200).optional(),
    hero_subtitle: z.string().trim().max(400).optional(),
    hero_cta_label: z.string().trim().max(60).optional(),
    contact_email: z.string().trim().email().max(200).nullable().optional(),
    contact_phone: z.string().trim().max(40).nullable().optional(),
    features: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])).optional(),
    announcement: z.string().trim().max(500).nullable().optional(),
    announcement_active: z.boolean().optional(),
    primary_color: hex.optional(),
    secondary_color: hex.optional(),
    accent_color: hex.optional(),
    background_color: hex.optional(),
    text_color: hex.optional(),
    card_bg_color: hex.optional(),
    primary_font: z.string().trim().max(60).optional(),
    heading_font: z.string().trim().max(60).optional(),
    base_font_size: z.string().trim().max(12).optional(),
    logo_url: z.string().trim().max(500).nullable().optional(),
    favicon_url: z.string().trim().max(500).nullable().optional(),
    site_name: z.string().trim().min(1).max(80).optional(),
    footer_text: z.string().trim().max(400).nullable().optional(),
    border_radius: z.enum(["sharp", "rounded", "pill"]).optional(),
    button_style: z.enum(["solid", "outline", "gradient"]).optional(),
    sections: z.record(z.string(), z.boolean()).optional(),
    ga_measurement_id: z.string().trim().max(40).nullable().optional(),
    meta_pixel_id: z.string().trim().max(40).nullable().optional(),
    cookie_banner_text: z.string().trim().max(600).nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const touchesTheme = THEME_KEYS.some((k) => k in data);
    if (touchesTheme) {
      const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
      if (!isSuper) throw new Error("Dizaino nustatymus gali keisti tik super administratorius.");
    } else {
      const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!isAdmin) throw new Error("Tik administratorius gali keisti nustatymus.");
    }
    const { error } = await context.supabase.from("site_settings").update(data).eq("id", 1);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_log").insert({
      actor_id: context.userId, action: "settings.update", entity: "site_settings", entity_id: "1", meta: data,
    });
    return { ok: true };
  });

/** Ar sekcija rodoma (numatytai – rodoma). */
export function sectionVisible(settings: { sections?: Record<string, boolean> } | undefined, id: string) {
  const v = settings?.sections?.[id];
  return v === undefined ? true : !!v;
}
