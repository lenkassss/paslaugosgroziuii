import { useRef, useState, type ElementType } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Pencil, Check, X, Palette, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useSection } from "@/lib/use-site-content";
import { upsertSiteContent } from "@/lib/site-content.functions";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/settings.functions";
import { FONT_CHOICES } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";
import { setCmsEditing, useCmsEditing } from "@/lib/cms-mode";
import { upsertComponentStyle, type ElementStyles } from "@/lib/component-styles.functions";
import { useElementStyle, toCss } from "@/lib/use-component-styles";
import { useAutoTranslateText } from "@/lib/use-auto-translate";

/* ── Redagavimo režimas gyvena bendrame modulyje ── */
const setEditing = setCmsEditing;
const useEditing = useCmsEditing;

/** Ar prisijungęs naudotojas yra super administratorius. */
export function useIsSuperAdmin() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["is-super-admin", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("is_super_admin", { _user_id: user!.id });
      return !!data;
    },
  });
  return !!data;
}

type Field = "title" | "subtitle" | "body_text" | "button_text";

/**
 * Tekstas, kurį super administratorius gali redaguoti tiesiog puslapyje.
 * Įjungus redagavimo režimą tekstas tampa įrašomas, o išsaugojus – atnaujinamas visiems.
 */
export function EditableText({
  page, section, field = "title", fallback, as: Tag = "span", className,
}: {
  page: string;
  section: string;
  field?: Field;
  fallback?: string;
  as?: ElementType;
  className?: string;
}) {
  const isSuper = useIsSuperAdmin();
  const on = useEditing();
  const block = useSection(page, section);
  const qc = useQueryClient();
  const save = useServerFn(upsertSiteContent);
  const ref = useRef<HTMLElement | null>(null);
  const value = (block?.[field] as string | null | undefined) ?? fallback ?? "";
  const translatedValue = useAutoTranslateText(value);
  const textKey = `text:${page}:${section}:${field}`;
  const styleRow = useElementStyle(textKey);
  const textCss = toCss(styleRow?.styles);
  const [bar, setBar] = useState(false);
  const saveStyle = useServerFn(upsertComponentStyle);

  const m = useMutation({
    mutationFn: (text: string) =>
      save({ data: { page_slug: page, section_id: section, [field]: text, is_active: true } as never }),
    onSuccess: () => {
      toast.success("Tekstas išsaugotas");
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: Error) => toastError(e),
  });

  const sm = useMutation({
    mutationFn: (patch: ElementStyles) =>
      saveStyle({ data: { element_key: textKey, styles: { ...(styleRow?.styles ?? {}), ...patch } } as never }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["component-styles"] }),
    onError: (e: Error) => toastError(e),
  });

  if (!isSuper || !on) return <Tag className={className} style={textCss}>{translatedValue}</Tag>;

  return (
    <span className="relative inline-block">
      {bar && (
        <span className="absolute -top-11 left-0 z-50 flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-elegant">
          {([-2, 2] as const).map((d) => (
            <button
              key={d}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => sm.mutate({ font_size: Math.min(96, Math.max(10, (styleRow?.styles?.font_size ?? 16) + d)) })}
              className="h-7 w-7 rounded-lg text-xs font-semibold hover:bg-secondary"
            >
              {d > 0 ? "A+" : "A-"}
            </button>
          ))}
          {([300, 500, 700] as const).map((w) => (
            <button
              key={w}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => sm.mutate({ font_weight: w })}
              className="h-7 rounded-lg px-2 text-[11px] hover:bg-secondary"
              style={{ fontWeight: w }}
            >
              Aa
            </button>
          ))}
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => sm.mutate({ align: a })}
              className="h-7 w-7 rounded-lg text-[10px] hover:bg-secondary"
              aria-label={a}
            >
              {a === "left" ? "⯇" : a === "center" ? "≡" : "⯈"}
            </button>
          ))}
          <input
            type="color"
            aria-label="Teksto spalva"
            value={styleRow?.styles?.color ?? "#101014"}
            onChange={(e) => sm.mutate({ color: e.target.value })}
            className="h-7 w-8 cursor-pointer rounded-lg border border-border bg-transparent"
          />
          <input
            type="color"
            aria-label="Teksto fono spalva"
            value={styleRow?.styles?.highlight ?? "#ffffff"}
            onChange={(e) => sm.mutate({ highlight: e.target.value })}
            className="h-7 w-8 cursor-pointer rounded-lg border border-dashed border-border bg-transparent"
          />
        </span>
      )}
      <Tag
        ref={ref as never}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        tabIndex={0}
        style={textCss}
        onFocus={() => setBar(true)}
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          const next = (e.currentTarget.textContent ?? "").trim();
          if (next && next !== value) m.mutate(next);
          setTimeout(() => setBar(false), 200);
        }}
        className={cn(
          className,
          "cursor-text rounded-md outline-none ring-1 ring-dashed ring-cyclamen/70 focus:ring-2 focus:ring-cyclamen",
        )}
      >
        {value}
      </Tag>
    </span>
  );
}

const COLOR_FIELDS: { key: keyof SiteSettings; label: string }[] = [
  { key: "primary_color", label: "Pagrindinė" },
  { key: "accent_color", label: "Akcentas" },
  { key: "background_color", label: "Fonas" },
  { key: "text_color", label: "Tekstas" },
  { key: "card_bg_color", label: "Kortelės" },
];

/** Plaukiojanti super administratoriaus juosta: tekstų redagavimas ir spalvos/šriftai. */
export function InlineCmsBar() {
  const isSuper = useIsSuperAdmin();
  const on = useEditing();
  const [panel, setPanel] = useState(false);
  const qc = useQueryClient();
  const get = useServerFn(getSiteSettings);
  const save = useServerFn(updateSiteSettings);
  const { data: settings } = useQuery({ queryKey: ["site-settings"], queryFn: () => get(), enabled: isSuper });

  const m = useMutation({
    mutationFn: (patch: Partial<SiteSettings>) => save({ data: patch as never }),
    onSuccess: () => {
      toast.success("Dizainas atnaujintas");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toastError(e),
  });

  if (!isSuper) return null;

  return (
    <div data-cms-ui="true" className="fixed bottom-24 right-3 z-[100] flex flex-col items-end gap-2 md:bottom-6">
      {panel && (
        <div className="w-[min(90vw,320px)] space-y-3 rounded-2xl border border-border bg-card p-4 shadow-elegant">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Svetainės dizainas</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanel(false)} aria-label="Uždaryti">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {COLOR_FIELDS.map((c) => (
              <div key={c.key as string} className="space-y-1">
                <input
                  type="color"
                  aria-label={c.label}
                  value={(settings?.[c.key] as string) ?? "#000000"}
                  onChange={(e) => m.mutate({ [c.key]: e.target.value } as Partial<SiteSettings>)}
                  className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent"
                />
                <span className="block truncate text-[10px] text-muted-foreground">{c.label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Antraščių šriftas</Label>
              <select
                value={settings?.heading_font ?? "Outfit"}
                onChange={(e) => m.mutate({ heading_font: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                {FONT_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px]">Teksto šriftas</Label>
              <select
                value={settings?.primary_font ?? "Figtree"}
                onChange={(e) => m.mutate({ primary_font: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
              >
                {FONT_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          <Button asChild variant="outline" className="h-10 w-full rounded-xl">
            <Link to="/admin/site-editor">
              <ExternalLink className="mr-2 h-4 w-4" /> Pilnas redaktorius
            </Link>
          </Button>
          {m.isPending && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saugoma…</div>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setPanel((p) => !p)}
          className="h-11 w-11 rounded-full shadow-elegant"
          aria-label="Dizaino nustatymai"
        >
          <Palette className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setEditing(!on)}
          className={cn("h-11 rounded-full px-4 shadow-elegant", on && "bg-cyclamen text-white")}
        >
          {on ? <><Check className="mr-2 h-4 w-4" /> Baigti</> : <><Pencil className="mr-2 h-4 w-4" /> Redaguoti tekstus</>}
        </Button>
      </div>
    </div>
  );
}
