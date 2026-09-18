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

/** Vieno elemento (burbulo, kortelės, teksto) išvaizdos nustatymai. */
export type ElementStyles = {
  shape?: "circle" | "rounded" | "pill" | "flat";
  fill?: string;
  fill_alpha?: number;
  border_color?: string;
  border_width?: number;
  shadow?: "none" | "soft" | "elevated";
  padding?: number;
  width?: number;
  height?: number;
  font_size?: number;
  font_weight?: 300 | 400 | 500 | 600 | 700;
  align?: "left" | "center" | "right";
  color?: string;
  /** Teksto paryškinimo fonas. */
  highlight?: string;
  margin?: number;
  gap?: number;
  /** Perrašytas elemento tekstas (universalus redaktorius). */
  text?: string;
  /** Šriftas. */
  font_family?: string;
  /** Perrašyta nuoroda (a elementams). */
  href?: string;
  /** Eilės numeris flex/grid konteineryje. */
  order?: number;
  /* ── Išplėstinė tipografija ── */
  line_height?: number;
  letter_spacing?: number;
  text_transform?: "none" | "uppercase" | "capitalize" | "lowercase";
  text_shadow?: "none" | "soft" | "strong";
  /* ── Tarpai kiekvienai pusei ── */
  padding_top?: number;
  padding_right?: number;
  padding_bottom?: number;
  padding_left?: number;
  margin_top?: number;
  margin_right?: number;
  margin_bottom?: number;
  margin_left?: number;
  /* ── Fonas ir medija ── */
  gradient?: string;
  bg_image?: string;
  object_fit?: "cover" | "contain" | "fill";
  overlay?: string;
  opacity?: number;
  /** Užvedimo efektas. */
  hover?: "none" | "scale" | "glow" | "border";
};

export type ComponentStyleRow = {
  element_key: string;
  styles: ElementStyles;
  is_visible: boolean;
};

const stylesSchema = z.object({
  shape: z.enum(["circle", "rounded", "pill", "flat"]).optional(),
  fill: z.string().max(40).optional(),
  fill_alpha: z.number().min(0).max(1).optional(),
  border_color: z.string().max(40).optional(),
  border_width: z.number().min(0).max(12).optional(),
  shadow: z.enum(["none", "soft", "elevated"]).optional(),
  padding: z.number().min(0).max(64).optional(),
  width: z.number().min(8).max(1920).optional(),
  height: z.number().min(8).max(1920).optional(),
  font_size: z.number().min(8).max(96).optional(),
  font_weight: z.union([z.literal(300), z.literal(400), z.literal(500), z.literal(600), z.literal(700)]).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  color: z.string().max(40).optional(),
  highlight: z.string().max(40).optional(),
  margin: z.number().min(0).max(96).optional(),
  gap: z.number().min(0).max(64).optional(),
  text: z.string().max(4000).optional(),
  font_family: z.string().max(80).optional(),
  href: z.string().max(500).optional(),
  order: z.number().min(-50).max(50).optional(),
  line_height: z.number().min(0.8).max(3).optional(),
  letter_spacing: z.number().min(-3).max(16).optional(),
  text_transform: z.enum(["none", "uppercase", "capitalize", "lowercase"]).optional(),
  text_shadow: z.enum(["none", "soft", "strong"]).optional(),
  padding_top: z.number().min(0).max(160).optional(),
  padding_right: z.number().min(0).max(160).optional(),
  padding_bottom: z.number().min(0).max(160).optional(),
  padding_left: z.number().min(0).max(160).optional(),
  margin_top: z.number().min(0).max(160).optional(),
  margin_right: z.number().min(0).max(160).optional(),
  margin_bottom: z.number().min(0).max(160).optional(),
  margin_left: z.number().min(0).max(160).optional(),
  gradient: z.string().max(300).optional(),
  bg_image: z.string().max(800).optional(),
  object_fit: z.enum(["cover", "contain", "fill"]).optional(),
  overlay: z.string().max(40).optional(),
  opacity: z.number().min(0).max(1).optional(),
  hover: z.enum(["none", "scale", "glow", "border"]).optional(),
});

/** Visi elementų stiliai – vieši, kad matytų kiekvienas apsilankantis. */
export const listComponentStyles = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data } = await s.from("component_styles").select("element_key, styles, is_visible");
  return (data ?? []) as ComponentStyleRow[];
});

export const upsertComponentStyle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    element_key: z.string().trim().min(1).max(400),
    styles: stylesSchema,
    is_visible: z.boolean().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!isSuper) throw new Error("Išvaizdą gali keisti tik super administratorius.");
    const { error } = await context.supabase
      .from("component_styles")
      .upsert(
        {
          element_key: data.element_key,
          styles: data.styles as never,
          ...(data.is_visible === undefined ? {} : { is_visible: data.is_visible }),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "element_key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
