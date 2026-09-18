import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SingleImageUploader } from "@/components/image-uploader";
import { cn } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";
import { useCmsEditing } from "@/lib/cms-mode";
import { useIsSuperAdmin } from "@/components/inline-cms";
import { useComponentStyles, applyToElement } from "@/lib/use-component-styles";
import { upsertComponentStyle, type ElementStyles } from "@/lib/component-styles.functions";
import {
  CMS_UI_ATTR, describeElement, elementFromKey, elementKeyFor, isPlainTextElement,
  keyBelongsToRoute, pickTarget, routeKey,
} from "@/lib/cms-target";

type Draft = { styles: ElementStyles; is_visible: boolean };
type Pending = Record<string, Draft>;

const FONTS = ["", "Outfit", "Figtree", "Inter", "Playfair Display", "Montserrat", "Georgia", "system-ui"];
const SHAPES: { key: NonNullable<ElementStyles["shape"]>; label: string }[] = [
  { key: "circle", label: "Apskritimas" },
  { key: "rounded", label: "Apvalinta" },
  { key: "pill", label: "Kapsulė" },
  { key: "flat", label: "Kampuota" },
];
const SHADOWS: { key: NonNullable<ElementStyles["shadow"]>; label: string }[] = [
  { key: "none", label: "Be" },
  { key: "soft", label: "Švelnus" },
  { key: "elevated", label: "Iškeltas" },
];
const TABS = ["Turinys", "Tipografija", "Forma", "Fonas", "Padėtis"] as const;
const TRANSFORMS: { key: NonNullable<ElementStyles["text_transform"]>; label: string }[] = [
  { key: "none", label: "Kaip yra" },
  { key: "uppercase", label: "DIDŽIOSIOS" },
  { key: "capitalize", label: "Kaip Vardai" },
  { key: "lowercase", label: "mažosios" },
];
const TEXT_SHADOWS: { key: NonNullable<ElementStyles["text_shadow"]>; label: string }[] = [
  { key: "none", label: "Be" },
  { key: "soft", label: "Švelnus" },
  { key: "strong", label: "Stiprus" },
];
const HOVERS: { key: NonNullable<ElementStyles["hover"]>; label: string }[] = [
  { key: "none", label: "Be efekto" },
  { key: "scale", label: "Padidėja" },
  { key: "glow", label: "Švytėjimas" },
  { key: "border", label: "Rėmelio spalva" },
];
const FITS: { key: NonNullable<ElementStyles["object_fit"]>; label: string }[] = [
  { key: "cover", label: "Užpildo" },
  { key: "contain", label: "Įtelpa" },
  { key: "fill", label: "Ištempia" },
];
type SliderDef = { key: keyof ElementStyles; label: string; min: number; max: number; step: number; def: number };
const SIDE_SLIDERS: SliderDef[] = [
  { key: "padding_top", label: "Vidinis tarpas viršuje", min: 0, max: 160, step: 2, def: 0 },
  { key: "padding_bottom", label: "Vidinis tarpas apačioje", min: 0, max: 160, step: 2, def: 0 },
  { key: "padding_left", label: "Vidinis tarpas kairėje", min: 0, max: 160, step: 2, def: 0 },
  { key: "padding_right", label: "Vidinis tarpas dešinėje", min: 0, max: 160, step: 2, def: 0 },
  { key: "margin_top", label: "Išorinis tarpas viršuje", min: 0, max: 160, step: 2, def: 0 },
  { key: "margin_bottom", label: "Išorinis tarpas apačioje", min: 0, max: 160, step: 2, def: 0 },
  { key: "margin_left", label: "Išorinis tarpas kairėje", min: 0, max: 160, step: 2, def: 0 },
  { key: "margin_right", label: "Išorinis tarpas dešinėje", min: 0, max: 160, step: 2, def: 0 },
];
const GRADIENTS: { label: string; value: string }[] = [
  { label: "Be", value: "" },
  { label: "Ciklamenas", value: "linear-gradient(135deg, #D6246E, #7A1140)" },
  { label: "Auksas", value: "linear-gradient(135deg, #E8C57A, #B4884A)" },
  { label: "Grafitas", value: "linear-gradient(135deg, #1B1B21, #101014)" },
  { label: "Rasa", value: "radial-gradient(circle at 30% 20%, #F5F5F7, #D9D9E0)" },
];
type Tab = (typeof TABS)[number];

/**
 * Universalus svetainės redaktorius.
 *
 * Visiems apsilankantiems pritaiko išsaugotus tekstų ir stilių perrašymus,
 * o super administratoriui redagavimo režimu leidžia paspausti bet kurį
 * elementą ir keisti jo tekstą, šriftą, spalvas, formą, tarpus, eilę ar matomumą.
 */
export function UniversalCms() {
  const isSuper = useIsSuperAdmin();
  const editing = useCmsEditing();
  const rows = useComponentStyles();
  const qc = useQueryClient();
  const saveFn = useServerFn(upsertComponentStyle);
  const route = useRouterState({ select: (s) => s.location.pathname });

  const [pending, setPending] = useState<Pending>({});
  const [selected, setSelected] = useState<{ key: string; label: string; text: string; canText: boolean; isLink: boolean } | null>(null);
  const [tab, setTab] = useState<Tab>("Turinys");
  const applying = useRef(false);

  const saved: Record<string, Draft> = {};
  for (const r of rows) {
    if (r.element_key.startsWith("dom:")) saved[r.element_key] = { styles: r.styles ?? {}, is_visible: r.is_visible !== false };
  }
  const effective = (key: string): Draft => pending[key] ?? saved[key] ?? { styles: {}, is_visible: true };

  /* ── Perrašymų taikymas į DOM ── */
  const apply = useCallback(() => {
    if (typeof document === "undefined") return;
    applying.current = true;
    const merged: Record<string, Draft> = { ...saved, ...pending };
    for (const [key, d] of Object.entries(merged)) {
      if (!keyBelongsToRoute(key)) continue;
      const el = elementFromKey(key);
      if (!el) continue;
      if (!d.is_visible) {
        el.style.setProperty("display", "none", "important");
        continue;
      }
      el.style.removeProperty("display");
      if (d.styles.text != null && isPlainTextElement(el) && el.textContent !== d.styles.text) {
        el.textContent = d.styles.text;
      }
      if (d.styles.href && el instanceof HTMLAnchorElement) el.setAttribute("href", d.styles.href);
      applyToElement(el, d.styles);
    }
    setTimeout(() => { applying.current = false; }, 0);
  }, [JSON.stringify(saved), JSON.stringify(pending), route]);

  useEffect(() => {
    apply();
    const t = setTimeout(apply, 250);
    return () => clearTimeout(t);
  }, [apply]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const obs = new MutationObserver(() => {
      if (applying.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(apply, 150);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); if (timer) clearTimeout(timer); };
  }, [apply]);

  /* ── Elemento pasirinkimas paspaudus ── */
  useEffect(() => {
    if (!isSuper || !editing || typeof document === "undefined") return;
    const onClick = (e: MouseEvent) => {
      const el = pickTarget(e.target);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const key = elementKeyFor(el);
      if (!key) return;
      setSelected({
        key,
        label: describeElement(el),
        text: (el.textContent ?? "").trim(),
        canText: isPlainTextElement(el),
        isLink: el instanceof HTMLAnchorElement,
      });
      setTab("Turinys");
    };
    document.addEventListener("click", onClick, true);
    document.documentElement.setAttribute("data-cms-editing", "true");
    return () => {
      document.removeEventListener("click", onClick, true);
      document.documentElement.removeAttribute("data-cms-editing");
    };
  }, [isSuper, editing]);

  /* ── Pažymėto elemento apvadas ── */
  useEffect(() => {
    if (!selected) return;
    const el = elementFromKey(selected.key);
    if (!el) return;
    el.style.setProperty("outline", "2px solid var(--cyclamen, #D6246E)", "important");
    el.style.setProperty("outline-offset", "2px", "important");
    return () => {
      el.style.removeProperty("outline");
      el.style.removeProperty("outline-offset");
    };
  }, [selected?.key, editing]);

  const saveAll = useMutation({
    mutationFn: async () => {
      for (const [key, d] of Object.entries(pending)) {
        await saveFn({ data: { element_key: key, styles: d.styles, is_visible: d.is_visible } as never });
      }
    },
    onSuccess: () => {
      toast.success("Visi pakeitimai išsaugoti");
      setPending({});
      qc.invalidateQueries({ queryKey: ["component-styles"] });
    },
    onError: (e: Error) => toastError(e),
  });

  if (!isSuper || !editing) return null;

  const cur = selected ? effective(selected.key) : null;
  const patch = (p: Partial<ElementStyles>) => {
    if (!selected) return;
    setPending((prev) => {
      const base = prev[selected.key] ?? saved[selected.key] ?? { styles: {}, is_visible: true };
      return { ...prev, [selected.key]: { ...base, styles: { ...base.styles, ...p } } };
    });
  };
  const setVisible = (v: boolean) => {
    if (!selected) return;
    setPending((prev) => {
      const base = prev[selected.key] ?? saved[selected.key] ?? { styles: {}, is_visible: true };
      return { ...prev, [selected.key]: { ...base, is_visible: v } };
    });
  };

  const move = (dir: -1 | 1) => {
    if (!selected) return;
    const el = elementFromKey(selected.key);
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const display = getComputedStyle(parent).display;
    if (!display.includes("flex") && !display.includes("grid")) {
      toast.error("Šio bloko eilės keisti negalima – tvarkyk gretimą sekciją.");
      return;
    }
    const sibs = Array.from(parent.children);
    const idx = sibs.indexOf(el);
    const target = idx + dir;
    if (target < 0 || target >= sibs.length) return;
    patch({ order: target * 10 - dir * 5 });
  };

  const resetSelected = () => {
    if (!selected) return;
    setPending((prev) => ({ ...prev, [selected.key]: { styles: {}, is_visible: true } }));
    const el = elementFromKey(selected.key);
    if (el) el.removeAttribute("style");
  };

  const sliders: SliderDef[] = [
    { key: "font_size", label: "Teksto dydis", min: 8, max: 72, step: 1, def: 16 },
    { key: "padding", label: "Vidinis tarpas", min: 0, max: 64, step: 2, def: 0 },
    { key: "margin", label: "Išorinis tarpas", min: 0, max: 96, step: 2, def: 0 },
    { key: "gap", label: "Tarpas tarp elementų", min: 0, max: 64, step: 2, def: 0 },
    { key: "border_width", label: "Rėmelio plotis", min: 0, max: 12, step: 1, def: 0 },
    { key: "width", label: "Plotis", min: 8, max: 1200, step: 4, def: 120 },
    { key: "height", label: "Aukštis", min: 8, max: 1200, step: 4, def: 120 },
  ];

  return (
    <div {...{ [CMS_UI_ATTR]: "true" }} className="pointer-events-none fixed inset-0 z-[95]">
      <style>{`[data-cms-editing] *:not([${CMS_UI_ATTR}] *):hover{outline:1px dashed rgba(214,36,110,.6);outline-offset:1px}`}</style>

      {/* Inspektorius */}
      {selected && cur && (
        <div className="pointer-events-auto absolute inset-x-2 bottom-2 max-h-[68vh] overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-elegant sm:inset-x-auto sm:right-3 sm:w-[360px]">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{selected.label}</p>
              <p className="truncate text-[10px] text-muted-foreground">{routeKey()}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelected(null)} aria-label="Uždaryti">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-3 grid grid-cols-5 gap-1 rounded-xl bg-secondary p-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn("rounded-lg py-1.5 text-[11px] font-medium", tab === t && "bg-card shadow-sm")}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Turinys" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Tekstas</Label>
                <Textarea
                  rows={3}
                  disabled={!selected.canText}
                  value={cur.styles.text ?? selected.text}
                  onChange={(e) => patch({ text: e.target.value })}
                  className="text-sm"
                />
                {!selected.canText && (
                  <p className="text-[10px] text-muted-foreground">Šis blokas turi kelias dalis – pasirink patį tekstą jo viduje.</p>
                )}
              </div>
              {selected.isLink && (
                <div className="space-y-1">
                  <Label className="text-[11px]">Nuoroda</Label>
                  <Input value={cur.styles.href ?? ""} placeholder="/salonai" onChange={(e) => patch({ href: e.target.value })} />
                </div>
              )}
            </div>
          )}

          {tab === "Tipografija" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Šriftas</Label>
                <select
                  value={cur.styles.font_family ?? ""}
                  onChange={(e) => patch({ font_family: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  {FONTS.map((f) => <option key={f} value={f}>{f || "Numatytasis"}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {([300, 400, 500, 600, 700] as const).map((w) => (
                  <Button
                    key={w}
                    variant={cur.styles.font_weight === w ? "default" : "outline"}
                    className="h-9 rounded-lg px-0 text-[11px]"
                    onClick={() => patch({ font_weight: w })}
                  >
                    {w}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["left", "center", "right"] as const).map((a) => (
                  <Button
                    key={a}
                    variant={cur.styles.align === a ? "default" : "outline"}
                    className="h-9 rounded-lg text-[11px]"
                    onClick={() => patch({ align: a })}
                  >
                    {a === "left" ? "Kairėje" : a === "center" ? "Centre" : "Dešinėje"}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "color", label: "Tekstas" },
                  { key: "fill", label: "Fonas" },
                  { key: "border_color", label: "Rėmelis" },
                ] as const).map((c) => (
                  <div key={c.key} className="space-y-1">
                    <Label className="text-[11px]">{c.label}</Label>
                    <input
                      type="color"
                      aria-label={c.label}
                      value={(cur.styles[c.key] as string) ?? "#ffffff"}
                      onChange={(e) => patch({ [c.key]: e.target.value } as Partial<ElementStyles>)}
                      className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Fono skaidrumas</span><span>{cur.styles.fill_alpha ?? 1}</span>
                </div>
                <Slider min={0} max={1} step={0.05} value={[cur.styles.fill_alpha ?? 1]} onValueChange={([v]) => patch({ fill_alpha: v })} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Eilučių aukštis</span><span>{cur.styles.line_height ?? "–"}</span>
                </div>
                <Slider min={0.8} max={3} step={0.05} value={[cur.styles.line_height ?? 1.4]} onValueChange={([v]) => patch({ line_height: v })} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Tarpai tarp raidžių</span><span>{cur.styles.letter_spacing ?? "–"}</span>
                </div>
                <Slider min={-3} max={16} step={0.5} value={[cur.styles.letter_spacing ?? 0]} onValueChange={([v]) => patch({ letter_spacing: v })} />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {TRANSFORMS.map((tr) => (
                  <Button
                    key={tr.key}
                    variant={cur.styles.text_transform === tr.key ? "default" : "outline"}
                    className="h-9 rounded-lg px-0 text-[9px]"
                    onClick={() => patch({ text_transform: tr.key })}
                  >
                    {tr.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {TEXT_SHADOWS.map((s) => (
                  <Button
                    key={s.key}
                    variant={cur.styles.text_shadow === s.key ? "default" : "outline"}
                    className="h-9 rounded-lg px-1 text-[10px]"
                    onClick={() => patch({ text_shadow: s.key })}
                  >
                    Šešėlis: {s.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {tab === "Forma" && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1">
                {SHAPES.map((s) => (
                  <Button
                    key={s.key}
                    variant={cur.styles.shape === s.key ? "default" : "outline"}
                    className="h-9 rounded-lg px-1 text-[10px]"
                    onClick={() => patch({ shape: s.key })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {SHADOWS.map((s) => (
                  <Button
                    key={s.key}
                    variant={cur.styles.shadow === s.key ? "default" : "outline"}
                    className="h-9 rounded-lg px-1 text-[11px]"
                    onClick={() => patch({ shadow: s.key })}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
              {[...sliders, ...SIDE_SLIDERS].map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{s.label}</span>
                    <span>{(cur.styles[s.key] as number | undefined) ?? "–"}</span>
                  </div>
                  <Slider
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={[(cur.styles[s.key] as number | undefined) ?? s.def]}
                    onValueChange={([v]) => patch({ [s.key]: v } as Partial<ElementStyles>)}
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "Fonas" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[11px]">Gradientas</Label>
                <select
                  value={cur.styles.gradient ?? ""}
                  onChange={(e) => patch({ gradient: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  {GRADIENTS.map((g) => <option key={g.label} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Nuotrauka bloko fone</Label>
                <SingleImageUploader
                  bucket="covers"
                  value={cur.styles.bg_image ?? ""}
                  onChange={(url) => patch({ bg_image: url })}
                  aspect="wide"
                  label="Fono nuotrauka"
                />
                <Input
                  value={cur.styles.bg_image ?? ""}
                  placeholder="arba įklijuok nuotraukos adresą"
                  onChange={(e) => patch({ bg_image: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-1">
                {FITS.map((f) => (
                  <Button
                    key={f.key}
                    variant={cur.styles.object_fit === f.key ? "default" : "outline"}
                    className="h-9 rounded-lg px-1 text-[10px]"
                    onClick={() => patch({ object_fit: f.key })}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Užsklandos spalva</Label>
                <input
                  type="color"
                  aria-label="Užsklandos spalva"
                  value={cur.styles.overlay ?? "#000000"}
                  onChange={(e) => patch({ overlay: e.target.value })}
                  className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Bloko permatomumas</span><span>{cur.styles.opacity ?? 1}</span>
                </div>
                <Slider min={0} max={1} step={0.05} value={[cur.styles.opacity ?? 1]} onValueChange={([v]) => patch({ opacity: v })} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                {HOVERS.map((h) => (
                  <Button
                    key={h.key}
                    variant={cur.styles.hover === h.key ? "default" : "outline"}
                    className="h-9 rounded-lg px-1 text-[10px]"
                    onClick={() => patch({ hover: h.key })}
                  >
                    {h.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {tab === "Padėtis" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-11 rounded-xl text-xs" onClick={() => move(-1)}>
                  <ArrowUp className="mr-1 h-4 w-4" /> Aukščiau
                </Button>
                <Button variant="outline" className="h-11 rounded-xl text-xs" onClick={() => move(1)}>
                  <ArrowDown className="mr-1 h-4 w-4" /> Žemiau
                </Button>
              </div>
              <Button variant="outline" className="h-11 w-full rounded-xl text-xs" onClick={() => setVisible(!cur.is_visible)}>
                {cur.is_visible ? <><EyeOff className="mr-2 h-4 w-4" /> Paslėpti elementą</> : <><Eye className="mr-2 h-4 w-4" /> Rodyti elementą</>}
              </Button>
              <Button variant="ghost" className="h-11 w-full rounded-xl text-xs" onClick={resetSelected}>
                <RotateCcw className="mr-2 h-4 w-4" /> Grąžinti pradinį
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Išsaugojimo juosta */}
      <div className="pointer-events-auto absolute left-2 top-2 flex items-center gap-2 rounded-full border border-border bg-card p-1 pl-3 shadow-elegant">
        <span className="text-[11px] text-muted-foreground">
          {Object.keys(pending).length > 0 ? `Neišsaugota: ${Object.keys(pending).length}` : "Spausk bet kurį elementą"}
        </span>
        <Button
          size="sm"
          className="h-8 rounded-full px-3 text-[11px]"
          disabled={saveAll.isPending || Object.keys(pending).length === 0}
          onClick={() => saveAll.mutate()}
        >
          {saveAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
          Išsaugoti
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 rounded-full px-3 text-[11px]"
          disabled={Object.keys(pending).length === 0}
          onClick={() => { setPending({}); window.location.reload(); }}
        >
          Atšaukti
        </Button>
      </div>
    </div>
  );
}
