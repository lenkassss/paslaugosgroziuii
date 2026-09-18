import { useQuery } from "@tanstack/react-query";
import type { CSSProperties } from "react";
import { listComponentStyles, type ComponentStyleRow, type ElementStyles } from "@/lib/component-styles.functions";

/** Visi super administratoriaus išsaugoti elementų stiliai (kešuoti). */
export function useComponentStyles() {
  const { data } = useQuery({
    queryKey: ["component-styles"],
    queryFn: () => listComponentStyles(),
    staleTime: 60_000,
  });
  return (data ?? []) as ComponentStyleRow[];
}

export function useElementStyle(elementKey: string) {
  const all = useComponentStyles();
  return all.find((r) => r.element_key === elementKey);
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const SHADOWS: Record<string, string> = {
  none: "none",
  soft: "0 4px 14px rgba(16, 16, 20, 0.08)",
  elevated: "0 12px 32px rgba(16, 16, 20, 0.18)",
};

/** Iš išsaugotų nustatymų paruošia inline stilių. */
export function toCss(s?: ElementStyles | null): CSSProperties {
  if (!s) return {};
  const css: CSSProperties = {};
  if (s.shape === "circle") css.borderRadius = "9999px";
  if (s.shape === "pill") css.borderRadius = "9999px";
  if (s.shape === "rounded") css.borderRadius = "1rem";
  if (s.shape === "flat") css.borderRadius = "0.25rem";
  if (s.fill) css.background = s.fill_alpha != null && s.fill_alpha < 1 ? hexToRgba(s.fill, s.fill_alpha) : s.fill;
  if (s.border_color) css.borderColor = s.border_color;
  if (s.border_width != null) css.borderWidth = `${s.border_width}px`;
  if (s.shadow) css.boxShadow = SHADOWS[s.shadow];
  if (s.padding != null) css.padding = `${s.padding}px`;
  if (s.width != null) css.width = `${s.width}px`;
  if (s.height != null) css.height = `${s.height}px`;
  if (s.font_size != null) css.fontSize = `${s.font_size}px`;
  if (s.font_weight != null) css.fontWeight = s.font_weight;
  if (s.align) css.textAlign = s.align;
  if (s.color) css.color = s.color;
  if (s.highlight) css.backgroundColor = s.highlight;
  if (s.margin != null) css.margin = `${s.margin}px`;
  if (s.gap != null) css.gap = `${s.gap}px`;
  if (s.font_family) css.fontFamily = s.font_family;
  if (s.order != null) css.order = s.order;
  if (s.line_height != null) css.lineHeight = s.line_height;
  if (s.letter_spacing != null) css.letterSpacing = `${s.letter_spacing}px`;
  if (s.text_transform) css.textTransform = s.text_transform;
  if (s.text_shadow) {
    css.textShadow = s.text_shadow === "soft" ? "0 1px 2px rgba(0,0,0,.25)" : s.text_shadow === "strong" ? "0 2px 8px rgba(0,0,0,.45)" : "none";
  }
  if (s.padding_top != null) css.paddingTop = `${s.padding_top}px`;
  if (s.padding_right != null) css.paddingRight = `${s.padding_right}px`;
  if (s.padding_bottom != null) css.paddingBottom = `${s.padding_bottom}px`;
  if (s.padding_left != null) css.paddingLeft = `${s.padding_left}px`;
  if (s.margin_top != null) css.marginTop = `${s.margin_top}px`;
  if (s.margin_right != null) css.marginRight = `${s.margin_right}px`;
  if (s.margin_bottom != null) css.marginBottom = `${s.margin_bottom}px`;
  if (s.margin_left != null) css.marginLeft = `${s.margin_left}px`;
  if (s.opacity != null) css.opacity = s.opacity;
  if (s.object_fit) css.objectFit = s.object_fit;
  // Fonas: gradientas ir (arba) nuotrauka su spalvos užsklanda.
  const layers: string[] = [];
  if (s.overlay) layers.push(`linear-gradient(${s.overlay}, ${s.overlay})`);
  if (s.gradient) layers.push(s.gradient);
  if (s.bg_image) layers.push(`url("${s.bg_image}")`);
  if (layers.length) {
    css.backgroundImage = layers.join(", ");
    css.backgroundSize = s.object_fit === "contain" ? "contain" : s.object_fit === "fill" ? "100% 100%" : "cover";
    css.backgroundPosition = "center";
    css.backgroundRepeat = "no-repeat";
  }
  return css;
}

/** CSS savybių sąrašas taikymui tiesiai į DOM elementą (universalus redaktorius). */
export function applyToElement(el: HTMLElement, s?: ElementStyles | null) {
  const css = toCss(s) as Record<string, string | number>;
  for (const [k, v] of Object.entries(css)) {
    const prop = k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    el.style.setProperty(prop, String(v), "important");
  }
  if (s?.border_width != null && s.border_width > 0) el.style.setProperty("border-style", "solid", "important");
  if (s?.hover && s.hover !== "none") el.setAttribute("data-cms-hover", s.hover);
  else el.removeAttribute("data-cms-hover");
}
