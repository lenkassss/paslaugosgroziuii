import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, THEME_DEFAULTS } from "@/lib/settings.functions";

/** Šriftai, kuriuos galima pasirinkti Dizaino redaktoriuje (Google Fonts). */
export const FONT_CHOICES = [
  "Figtree", "Outfit", "Inter", "Poppins", "Montserrat", "Playfair Display",
  "Lora", "Raleway", "Manrope", "DM Sans", "Cormorant Garamond", "Work Sans",
];

const RADIUS: Record<string, string> = { sharp: "0rem", rounded: "0.75rem", pill: "1.75rem" };

function googleHref(fonts: string[]) {
  const families = [...new Set(fonts)]
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Nuskaito site_settings dizaino nustatymus ir gyvai perrašo CSS kintamuosius,
 * šriftus, logotipą bei favicon. Bet koks pakeitimas redaktoriuje atsinaujina iškart.
 */
export function ThemeProvider() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 60_000,
  });
  const s = { ...THEME_DEFAULTS, ...(data ?? {}) };

  const css = `
:root {
  --primary: ${s.primary_color};
  --ring: ${s.primary_color};
  --secondary: ${s.secondary_color};
  --muted: ${s.secondary_color};
  --accent: ${s.accent_color};
  --background: ${s.background_color};
  --foreground: ${s.text_color};
  --card: ${s.card_bg_color};
  --card-foreground: ${s.text_color};
  --popover: ${s.card_bg_color};
  --radius: ${RADIUS[s.border_radius] ?? RADIUS.rounded};
}
html { font-size: ${s.base_font_size}; }
body, .font-sans { font-family: "${s.primary_font}", ui-sans-serif, system-ui, sans-serif; }
h1, h2, h3, h4, h5, h6, .font-display { font-family: "${s.heading_font}", ui-sans-serif, system-ui, sans-serif; }
${s.button_style === "pill" || s.border_radius === "pill" ? `button, [role="button"] { border-radius: 9999px; }` : ""}
${s.button_style === "outline" ? `.gradient-gold { background: transparent !important; border: 1px solid ${s.primary_color}; color: ${s.primary_color} !important; }` : ""}
${s.button_style === "gradient" ? `.gradient-gold { background: linear-gradient(135deg, ${s.primary_color}, ${s.accent_color}) !important; }` : ""}
`.trim();

  return (
    <>
      <link rel="stylesheet" href={googleHref([s.primary_font, s.heading_font])} />
      {s.favicon_url ? <link rel="icon" href={s.favicon_url} /> : null}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
