import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SingleImageUploader } from "@/components/image-uploader";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/settings.functions";
import {
  listAllSiteContent,
  upsertSiteContent,
  deleteSiteContent,
  reorderSiteContent,
  type SiteContentBlock,
} from "@/lib/site-content.functions";
import {
  CONTENT_PAGES, FIELD_LABELS, SECTION_TOGGLES, BLOCK_KINDS, BLOCK_STYLES, BLOCK_ALIGNS,
  type EditableField, type SectionDef,
} from "@/lib/site-content-map";
import { FONT_CHOICES } from "@/components/theme-provider";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import {
  Loader2, Save, Palette, FileText, LayoutTemplate, RotateCcw,
  ExternalLink, RefreshCw, Eye, EyeOff, Monitor, Smartphone,
  Plus, ArrowUp, ArrowDown, Trash2, Blocks, BarChart3,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/site-editor")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: isSuper } = await supabase.rpc("is_super_admin", { _user_id: data.user.id });
    if (!isSuper) throw redirect({ to: "/" });
  },
  component: SiteEditor,
});

const COLORS: { key: keyof SiteSettings; label: string; hint: string }[] = [
  { key: "primary_color", label: "Pagrindinė spalva", hint: "Mygtukai, nuorodos, akcentai" },
  { key: "secondary_color", label: "Antrinė spalva", hint: "Šviesūs blokai ir juostos" },
  { key: "accent_color", label: "Akcento spalva", hint: "Auksinis / cyclamen paryškinimas" },
  { key: "background_color", label: "Fono spalva", hint: "Viso puslapio fonas" },
  { key: "text_color", label: "Teksto spalva", hint: "Pagrindinis tekstas" },
  { key: "card_bg_color", label: "Kortelių fonas", hint: "Kortelės, meniu, modalai" },
];

function SiteEditor() {
  const qc = useQueryClient();
  const get = useServerFn(getSiteSettings);
  const save = useServerFn(updateSiteSettings);
  const listContent = useServerFn(listAllSiteContent);
  const saveContent = useServerFn(upsertSiteContent);
  const removeContent = useServerFn(deleteSiteContent);
  const reorder = useServerFn(reorderSiteContent);

  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => get() });
  const { data: blocks } = useQuery({ queryKey: ["site-content", "all"], queryFn: () => listContent() });
  const [form, setForm] = useState<SiteSettings | null>(null);
  useEffect(() => { if (data && !form) setForm(data as SiteSettings); }, [data, form]);

  const [page, setPage] = useState("home");
  const [previewKey, setPreviewKey] = useState(0);
  const [previewMobile, setPreviewMobile] = useState(false);
  const pageDef = useMemo(() => CONTENT_PAGES.find((p) => p.slug === page)!, [page]);

  const settingsM = useMutation({
    mutationFn: (patch: Partial<SiteSettings>) => save({ data: patch as any }),
    onSuccess: () => {
      toast.success("Pakeitimai išsaugoti – svetainė atnaujinta");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      setPreviewKey((k) => k + 1);
    },
    onError: (e: Error) => toastError(e),
  });

  if (!form) {
    return (
      <DashboardShell>
        <div className="flex items-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Kraunama...
        </div>
      </DashboardShell>
    );
  }

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setForm({ ...form, [k]: v });
  const toggle = (id: string, v: boolean) => set("sections", { ...(form.sections ?? {}), [id]: v });
  const visible = (id: string) => form.sections?.[id] !== false;

  const saveAll = () => settingsM.mutate({
    primary_color: form.primary_color, secondary_color: form.secondary_color, accent_color: form.accent_color,
    background_color: form.background_color, text_color: form.text_color, card_bg_color: form.card_bg_color,
    primary_font: form.primary_font, heading_font: form.heading_font, base_font_size: form.base_font_size,
    logo_url: form.logo_url, favicon_url: form.favicon_url, site_name: form.site_name,
    footer_text: form.footer_text, border_radius: form.border_radius, button_style: form.button_style,
    sections: form.sections ?? {},
    ga_measurement_id: form.ga_measurement_id, meta_pixel_id: form.meta_pixel_id,
    cookie_banner_text: form.cookie_banner_text,
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Puslapio redaktorius</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Spalvos, šriftai, kiekvieno puslapio tekstai ir sekcijų rodymas. Nepakeisti laukai lieka su
            originaliu svetainės tekstu — jį matai kaip užuominą laukelyje.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Atidaryti svetainę</a>
          </Button>
          <Button onClick={saveAll} disabled={settingsM.isPending} className="gradient-gold text-primary-foreground btn-press">
            <Save className="mr-2 h-4 w-4" /> {settingsM.isPending ? "Saugoma..." : "Išsaugoti pakeitimus"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="content"><FileText className="mr-1.5 h-4 w-4" /> Puslapiai ir tekstai</TabsTrigger>
          <TabsTrigger value="design"><Palette className="mr-1.5 h-4 w-4" /> Spalvos ir dizainas</TabsTrigger>
          <TabsTrigger value="sections"><LayoutTemplate className="mr-1.5 h-4 w-4" /> Sekcijų valdymas</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="mr-1.5 h-4 w-4" /> Analitika ir slapukai</TabsTrigger>
        </TabsList>

        {/* ---------- 1. Puslapiai ir tekstai ---------- */}
        <TabsContent value="content" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            {/* Puslapių sąrašas */}
            <Card className="h-fit p-2">
              <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Puslapiai</p>
              <div className="space-y-1">
                {CONTENT_PAGES.map((p) => {
                  const edited = (blocks ?? []).filter((b) => b.page_slug === p.slug).length;
                  return (
                    <button
                      key={p.slug}
                      onClick={() => { setPage(p.slug); setPreviewKey((k) => k + 1); }}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                        page === p.slug ? "bg-secondary font-medium" : "hover:bg-secondary/60"
                      }`}
                    >
                      <span className="min-w-0 truncate">{p.label}</span>
                      {edited > 0 && <Badge variant="outline" className="shrink-0 text-[10px]">{edited}</Badge>}
                    </button>
                  );
                })}
              </div>
            </Card>

            <div className="min-w-0 space-y-5">
              {pageDef.sections.map((s) => (
                <SectionEditor
                  key={`${pageDef.slug}-${s.id}`}
                  pageSlug={pageDef.slug}
                  section={s}
                  block={(blocks ?? []).find((b) => b.page_slug === pageDef.slug && b.section_id === s.id)}
                  onSaved={() => { qc.invalidateQueries({ queryKey: ["site-content"] }); setPreviewKey((k) => k + 1); }}
                  saveFn={(b) => saveContent({ data: b as any })}
                  deleteFn={(id) => removeContent({ data: { id } })}
                />
              ))}

              {/* Savi blokai – Elementor stiliaus kūrimas */}
              <CustomBlocks
                pageSlug={pageDef.slug}
                blocks={(blocks ?? []).filter((b) => b.page_slug === pageDef.slug && b.is_custom)}
                onSaved={() => { qc.invalidateQueries({ queryKey: ["site-content"] }); setPreviewKey((k) => k + 1); }}
                saveFn={(b) => saveContent({ data: b as any })}
                deleteFn={(id) => removeContent({ data: { id } })}
                reorderFn={(items) => reorder({ data: { items } })}
              />

              {/* Gyva peržiūra */}
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Eye className="h-4 w-4 text-primary" /> Gyva peržiūra · {pageDef.path}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPreviewMobile((v) => !v)}>
                      {previewMobile ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPreviewKey((k) => k + 1)}>
                      <RefreshCw className="mr-1.5 h-4 w-4" /> Atnaujinti
                    </Button>
                  </div>
                </div>
                <div className="flex justify-center bg-secondary/40 p-3">
                  <iframe
                    key={previewKey}
                    src={pageDef.path}
                    title="Peržiūra"
                    className="h-[520px] rounded-xl border border-border bg-background"
                    style={{ width: previewMobile ? 390 : "100%" }}
                  />
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ---------- 2. Spalvos ir dizainas ---------- */}
        <TabsContent value="design" className="mt-5 grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Spalvos</h2>
            {COLORS.map(({ key, label, hint }) => (
              <div key={key as string} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Label>{label}</Label>
                  <p className="text-xs text-muted-foreground">{hint}</p>
                </div>
                <input
                  type="color"
                  aria-label={label}
                  value={String(form[key] ?? "#ffffff")}
                  onChange={(e) => set(key, e.target.value as any)}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                />
                <Input className="w-28" value={String(form[key] ?? "")} onChange={(e) => set(key, e.target.value as any)} />
              </div>
            ))}
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Tipografija</h2>
            <div>
              <Label>Pagrindinis šriftas (tekstas)</Label>
              <Select value={form.primary_font} onValueChange={(v) => set("primary_font", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_CHOICES.map((f) => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Antraščių šriftas</Label>
              <Select value={form.heading_font} onValueChange={(v) => set("heading_font", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_CHOICES.map((f) => <SelectItem key={f} value={f} style={{ fontFamily: f }}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bazinis teksto dydis</Label>
              <Select value={form.base_font_size} onValueChange={(v) => set("base_font_size", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["14px", "15px", "16px", "17px", "18px"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Prekės ženklas</h2>
            <div><Label>Svetainės pavadinimas</Label><Input className="mt-1" value={form.site_name ?? ""} onChange={(e) => set("site_name", e.target.value)} /></div>
            <div><Label>Poraštės tekstas</Label><Textarea rows={2} className="mt-1" value={form.footer_text ?? ""} onChange={(e) => set("footer_text", e.target.value || null)} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SingleImageUploader bucket="covers" label="Logotipas" value={form.logo_url ?? ""} onChange={(url) => set("logo_url", url || null)} aspect="wide" />
              <SingleImageUploader bucket="covers" label="Favicon" value={form.favicon_url ?? ""} onChange={(url) => set("favicon_url", url || null)} />
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Formos ir mygtukai</h2>
            <div>
              <Label>Kampų stilius</Label>
              <Select value={form.border_radius} onValueChange={(v) => set("border_radius", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sharp">Aštrūs kampai</SelectItem>
                  <SelectItem value="rounded">Apvalinti</SelectItem>
                  <SelectItem value="pill">Piliulės formos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mygtukų stilius</Label>
              <Select value={form.button_style} onValueChange={(v) => set("button_style", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Pilnas užpildas</SelectItem>
                  <SelectItem value="outline">Kontūrinis</SelectItem>
                  <SelectItem value="gradient">Gradientinis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border p-4" style={{ background: form.card_bg_color, color: form.text_color }}>
              <p className="text-xs uppercase tracking-wide" style={{ color: form.accent_color }}>Peržiūra</p>
              <p className="mt-1 text-lg font-semibold" style={{ fontFamily: form.heading_font }}>Antraštės pavyzdys</p>
              <p className="text-sm" style={{ fontFamily: form.primary_font }}>Teksto pavyzdys – taip atrodys turinys svetainėje.</p>
              <button
                className="mt-3 px-4 py-2 text-sm font-medium"
                style={{
                  background: form.button_style === "outline" ? "transparent" : form.primary_color,
                  color: form.button_style === "outline" ? form.primary_color : form.background_color,
                  border: `1px solid ${form.primary_color}`,
                  borderRadius: form.border_radius === "sharp" ? 0 : form.border_radius === "pill" ? 9999 : 12,
                }}
              >
                Mygtukas
              </button>
            </div>
          </Card>
        </TabsContent>

        {/* ---------- 3. Sekcijų valdymas ---------- */}
        <TabsContent value="sections" className="mt-5">
          <Card className="space-y-4 p-6">
            <h2 className="font-display text-xl font-semibold">Pradinio puslapio sekcijos</h2>
            <p className="text-sm text-muted-foreground">Išjungtos sekcijos lankytojams nerodomos.</p>
            {SECTION_TOGGLES.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 border-t border-border pt-3">
                <div className="min-w-0">
                  <Label htmlFor={`s-${s.id}`} className="flex items-center gap-2">
                    {visible(s.id) ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    {s.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{s.hint}</p>
                </div>
                <Switch id={`s-${s.id}`} checked={visible(s.id)} onCheckedChange={(v) => toggle(s.id, v)} />
              </div>
            ))}
            <div className="flex justify-end">
              <Button onClick={saveAll} disabled={settingsM.isPending} className="gradient-gold text-primary-foreground btn-press">
                <Save className="mr-2 h-4 w-4" /> Išsaugoti pakeitimus
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ---------- 4. Analitika ir slapukai ---------- */}
        <TabsContent value="analytics" className="mt-5">
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="font-display text-xl font-semibold">Analitika ir slapukų sutikimas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Skaitliukai įsijungia tik tada, kai lankytojas juostoje paspaudžia „Sutinku su visais“.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Google Analytics ID</Label>
                <Input
                  className="mt-1"
                  placeholder="G-XXXXXXXXXX"
                  value={form.ga_measurement_id ?? ""}
                  onChange={(e) => set("ga_measurement_id", (e.target.value || null) as never)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Randamas Google Analytics duomenų srauto nustatymuose.</p>
              </div>
              <div>
                <Label>Meta (Facebook) Pixel ID</Label>
                <Input
                  className="mt-1"
                  placeholder="123456789012345"
                  value={form.meta_pixel_id ?? ""}
                  onChange={(e) => set("meta_pixel_id", (e.target.value || null) as never)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Tik skaičiai iš Meta Events Manager.</p>
              </div>
            </div>
            <div>
              <Label>Slapukų juostos tekstas</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder="Naudojame slapukus, kad svetainė veiktų geriau ir matytume, kas lankytojams aktualiausia."
                value={form.cookie_banner_text ?? ""}
                onChange={(e) => set("cookie_banner_text", (e.target.value || null) as never)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveAll} disabled={settingsM.isPending} className="gradient-gold text-primary-foreground btn-press">
                <Save className="mr-2 h-4 w-4" /> Išsaugoti pakeitimus
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

/** Vienos sekcijos tekstų redaktorius su numatytais tekstais kaip užuominomis. */
function SectionEditor({
  pageSlug, section, block, saveFn, deleteFn, onSaved,
}: {
  pageSlug: string;
  section: SectionDef;
  block?: SiteContentBlock;
  saveFn: (b: Record<string, unknown>) => Promise<unknown>;
  deleteFn: (id: string) => Promise<unknown>;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Partial<SiteContentBlock>>(block ?? {});
  useEffect(() => { setDraft(block ?? {}); }, [block]);

  const saveM = useMutation({
    mutationFn: () => saveFn({
      page_slug: pageSlug,
      section_id: section.id,
      title: draft.title || null,
      subtitle: draft.subtitle || null,
      body_text: draft.body_text || null,
      image_url: draft.image_url || null,
      button_text: draft.button_text || null,
      button_link: draft.button_link || null,
      is_active: draft.is_active ?? true,
    }),
    onSuccess: () => { toast.success("Tekstai išsaugoti"); onSaved(); },
    onError: (e: Error) => toastError(e),
  });

  const resetM = useMutation({
    mutationFn: () => deleteFn(block!.id),
    onSuccess: () => { toast.success("Grąžintas originalus tekstas"); onSaved(); },
    onError: (e: Error) => toastError(e),
  });

  const value = (f: EditableField) => (draft[f] as string | null | undefined) ?? "";
  const upd = (f: EditableField, v: string) => setDraft({ ...draft, [f]: v });

  return (
    <Card className="space-y-4 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold">{section.label}</h2>
          {section.hint && <p className="text-xs text-muted-foreground">{section.hint}</p>}
        </div>
        <Badge variant="outline" className="text-[10px]">{block ? "Redaguota" : "Originalus tekstas"}</Badge>
      </div>

      {section.fields.map((f) => (
        <div key={f}>
          <Label>{FIELD_LABELS[f]}</Label>
          {f === "image_url" ? (
            <SingleImageUploader bucket="covers" label="" aspect="wide" value={value(f)} onChange={(url) => upd(f, url)} />
          ) : f === "body_text" ? (
            <Textarea
              rows={5}
              className="mt-1"
              placeholder={section.defaults?.[f] ?? "Neužpildyta"}
              value={value(f)}
              onChange={(e) => upd(f, e.target.value)}
            />
          ) : (
            <Input
              className="mt-1"
              placeholder={section.defaults?.[f] ?? "Neužpildyta"}
              value={value(f)}
              onChange={(e) => upd(f, e.target.value)}
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Switch id={`a-${pageSlug}-${section.id}`} checked={draft.is_active !== false} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
          <Label htmlFor={`a-${pageSlug}-${section.id}`} className="text-sm">Rodyti sekciją</Label>
        </div>
        <div className="flex gap-2">
          {block && (
            <Button variant="outline" onClick={() => resetM.mutate()} disabled={resetM.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" /> Atstatyti originalą
            </Button>
          )}
          <Button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="gradient-gold text-primary-foreground btn-press">
            <Save className="mr-2 h-4 w-4" /> {saveM.isPending ? "Saugoma..." : "Išsaugoti"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Savi blokai: kūrimas, tvarka, stilius, matomumas, trynimas          */
/* ------------------------------------------------------------------ */

function CustomBlocks({
  pageSlug, blocks, saveFn, deleteFn, reorderFn, onSaved,
}: {
  pageSlug: string;
  blocks: SiteContentBlock[];
  saveFn: (b: Record<string, unknown>) => Promise<unknown>;
  deleteFn: (id: string) => Promise<unknown>;
  reorderFn: (items: { id: string; sort_order: number }[]) => Promise<unknown>;
  onSaved: () => void;
}) {
  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);
  const [kind, setKind] = useState("text");

  const addM = useMutation({
    mutationFn: () => saveFn({
      page_slug: pageSlug,
      section_id: `custom-${Date.now().toString(36)}`,
      block_kind: kind,
      is_custom: true,
      is_active: true,
      align: "left",
      style: "plain",
      sort_order: (sorted.at(-1)?.sort_order ?? 0) + 10,
      title: kind === "divider" ? null : "Naujas blokas",
    }),
    onSuccess: () => { toast.success("Blokas pridėtas"); onSaved(); },
    onError: (e: Error) => toastError(e),
  });

  const moveM = useMutation({
    mutationFn: (dir: { index: number; delta: number }) => {
      const next = [...sorted];
      const other = next[dir.index + dir.delta];
      const cur = next[dir.index];
      if (!other || !cur) return Promise.resolve(null);
      return reorderFn([
        { id: cur.id, sort_order: other.sort_order },
        { id: other.id, sort_order: cur.sort_order },
      ]);
    },
    onSuccess: () => onSaved(),
    onError: (e: Error) => toastError(e),
  });

  return (
    <Card className="space-y-4 p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Blocks className="h-4 w-4 text-primary" /> Savi blokai
          </h2>
          <p className="text-xs text-muted-foreground">
            Pridėk savo antraštes, tekstus, nuotraukas ar mygtukus – jie atsiras šio puslapio apačioje.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <Select value={kind} onValueChange={setKind}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BLOCK_KINDS.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => addM.mutate()} disabled={addM.isPending} className="btn-press">
            <Plus className="mr-1.5 h-4 w-4" /> Pridėti
          </Button>
        </div>
      </div>

      {sorted.length === 0 && (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Kol kas savų blokų nėra. Pasirink tipą ir spausk „Pridėti“.
        </p>
      )}

      <div className="space-y-4">
        {sorted.map((b, i) => (
          <CustomBlockEditor
            key={b.id}
            block={b}
            canUp={i > 0}
            canDown={i < sorted.length - 1}
            onMove={(delta) => moveM.mutate({ index: i, delta })}
            saveFn={saveFn}
            deleteFn={deleteFn}
            onSaved={onSaved}
          />
        ))}
      </div>
    </Card>
  );
}

function CustomBlockEditor({
  block, canUp, canDown, onMove, saveFn, deleteFn, onSaved,
}: {
  block: SiteContentBlock;
  canUp: boolean;
  canDown: boolean;
  onMove: (delta: number) => void;
  saveFn: (b: Record<string, unknown>) => Promise<unknown>;
  deleteFn: (id: string) => Promise<unknown>;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<SiteContentBlock>(block);
  useEffect(() => { setDraft(block); }, [block]);

  const def = BLOCK_KINDS.find((k) => k.key === block.block_kind) ?? BLOCK_KINDS[1]!;

  const saveM = useMutation({
    mutationFn: () => saveFn({
      page_slug: block.page_slug,
      section_id: block.section_id,
      block_kind: block.block_kind,
      is_custom: true,
      sort_order: block.sort_order,
      title: draft.title || null,
      subtitle: draft.subtitle || null,
      body_text: draft.body_text || null,
      image_url: draft.image_url || null,
      button_text: draft.button_text || null,
      button_link: draft.button_link || null,
      align: draft.align,
      style: draft.style,
      is_active: draft.is_active,
    }),
    onSuccess: () => { toast.success("Blokas išsaugotas"); onSaved(); },
    onError: (e: Error) => toastError(e),
  });

  const delM = useMutation({
    mutationFn: () => deleteFn(block.id),
    onSuccess: () => { toast.success("Blokas ištrintas"); onSaved(); },
    onError: (e: Error) => toastError(e),
  });

  const upd = (f: EditableField, v: string) => setDraft({ ...draft, [f]: v } as SiteContentBlock);

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{def.label}</Badge>
          <span className="text-xs text-muted-foreground">{def.hint}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" disabled={!canUp} onClick={() => onMove(-1)} aria-label="Aukščiau">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" disabled={!canDown} onClick={() => onMove(1)} aria-label="Žemiau">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => delM.mutate()} disabled={delM.isPending} aria-label="Trinti">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {def.fields.map((f) => (
          <div key={f}>
            <Label className="text-xs">{FIELD_LABELS[f]}</Label>
            {f === "image_url" ? (
              <SingleImageUploader bucket="covers" label="" aspect="wide" value={draft.image_url ?? ""} onChange={(url) => upd(f, url)} />
            ) : f === "body_text" ? (
              <Textarea rows={4} className="mt-1" value={draft.body_text ?? ""} onChange={(e) => upd(f, e.target.value)} />
            ) : (
              <Input
                className="mt-1"
                value={(draft[f] as string | null) ?? ""}
                onChange={(e) => upd(f, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Lygiavimas</Label>
            <Select value={draft.align} onValueChange={(v) => setDraft({ ...draft, align: v as SiteContentBlock["align"] })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOCK_ALIGNS.map((a) => <SelectItem key={a.key} value={a.key}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Fonas / stilius</Label>
            <Select value={draft.style} onValueChange={(v) => setDraft({ ...draft, style: v as SiteContentBlock["style"] })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLOCK_STYLES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Switch id={`cb-${block.id}`} checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
          <Label htmlFor={`cb-${block.id}`} className="text-sm">Rodyti</Label>
        </div>
        <Button onClick={() => saveM.mutate()} disabled={saveM.isPending} className="gradient-gold text-primary-foreground btn-press">
          <Save className="mr-2 h-4 w-4" /> {saveM.isPending ? "Saugoma..." : "Išsaugoti bloką"}
        </Button>
      </div>
    </div>
  );
}
