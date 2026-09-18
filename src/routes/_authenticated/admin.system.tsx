import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/settings.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/system")({
  component: SystemAdmin,
});

const FEATURE_LABELS: Record<string, string> = {
  comments: "Komentarai straipsniuose",
  b2b: "B2B tinklo skiltis",
  promos: "Akcijų srautas",
  events: "Renginiai / seminarai",
  map: "Salonų žemėlapis",
  public_b2c_store: "ENABLE_PUBLIC_B2C_STORE — parduotuvė atvira ir klientams",
  maintenance_mode: "MAINTENANCE_MODE — techninė priežiūra (viešas puslapis uždarytas)",
};

function SystemAdmin() {
  const qc = useQueryClient();
  const get = useServerFn(getSiteSettings);
  const upd = useServerFn(updateSiteSettings);
  const { data } = useQuery({ queryKey: ["site-settings"], queryFn: () => get() });
  const [form, setForm] = useState<SiteSettings | null>(null);
  useEffect(() => { if (data && !form) setForm(data); }, [data, form]);

  const m = useMutation({
    mutationFn: (patch: Partial<SiteSettings>) => upd({ data: patch as any }),
    onSuccess: () => { toast.success("Nustatymai išsaugoti"); qc.invalidateQueries({ queryKey: ["site-settings"] }); },
    onError: (e: Error) => toastError(e),
  });

  if (!form) return <DashboardShell><div className="flex items-center gap-2 text-muted-foreground p-6"><Loader2 className="h-4 w-4 animate-spin" /> Kraunama...</div></DashboardShell>;

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setForm({ ...form, [k]: v });

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Sistemos nustatymai</h1>
        <p className="text-sm text-muted-foreground mt-1">Prekės ženklas, pagrindinio puslapio tekstai, funkcijų jungikliai, skelbimo juosta.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">Prekės ženklas</h2>
          <div><Label>Pavadinimas</Label><Input value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} /></div>
          <div><Label>Šūkis (tagline)</Label><Input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
          <div><Label>Kontaktinis el. paštas</Label><Input value={form.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value || null)} /></div>
          <div><Label>Kontaktinis telefonas</Label><Input value={form.contact_phone ?? ""} onChange={(e) => set("contact_phone", e.target.value || null)} /></div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">Pagrindinis puslapis</h2>
          <div><Label>Hero antraštė</Label><Input value={form.hero_title} onChange={(e) => set("hero_title", e.target.value)} /></div>
          <div><Label>Hero paantraštė</Label><Textarea rows={3} value={form.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} /></div>
          <div><Label>Hero mygtukas</Label><Input value={form.hero_cta_label} onChange={(e) => set("hero_cta_label", e.target.value)} /></div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">Skelbimo juosta</h2>
          <div className="flex items-center justify-between">
            <Label htmlFor="ann">Rodyti juostą</Label>
            <Switch id="ann" checked={form.announcement_active} onCheckedChange={(v) => set("announcement_active", v)} />
          </div>
          <div><Label>Tekstas</Label><Textarea rows={2} value={form.announcement ?? ""} onChange={(e) => set("announcement", e.target.value || null)} placeholder="Pvz. Rugsėjo mokymai su 20% nuolaida" /></div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold">Funkcijų jungikliai</h2>
          {Object.keys(FEATURE_LABELS).map((k) => (
            <div key={k} className="flex items-center justify-between">
              <Label htmlFor={`f-${k}`}>{FEATURE_LABELS[k]}</Label>
              <Switch
                id={`f-${k}`}
                checked={!!form.features?.[k]}
                onCheckedChange={(v) => set("features", { ...(form.features ?? {}), [k]: v })}
              />
            </div>
          ))}

          <div className="border-t border-border pt-4">
            <Label htmlFor="fee">COMMISSION_FEE_AMOUNT — platformos rezervacijos mokestis (€)</Label>
            <Input
              id="fee"
              type="number"
              step="0.01"
              min="0"
              className="mt-2"
              value={String(form.features?.commission_fee_eur ?? 0.49)}
              onChange={(e) =>
                set("features", { ...(form.features ?? {}), commission_fee_eur: Number(e.target.value) || 0 })
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Taikoma rezervacijoms, renginių ir kursų registracijoms. Numatyta 0,49 €.
            </p>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <Label>Techninės priežiūros pranešimas (rodomas visiems, visuose puslapiuose)</Label>
            <Textarea
              rows={3}
              placeholder="Pvz. Atnaujiname rezervacijų sistemą ir mokėjimus."
              value={String(form.features?.maintenance_reason ?? "")}
              onChange={(e) => set("features", { ...(form.features ?? {}), maintenance_reason: e.target.value })}
            />
            <Input
              placeholder="Numatoma trukmė, pvz. apie 2 val. arba iki 18:00"
              value={String(form.features?.maintenance_until ?? "")}
              onChange={(e) => set("features", { ...(form.features ?? {}), maintenance_until: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Įjungus MAINTENANCE_MODE, visi lankytojai matys atsiprašymo langą su šia priežastimi ir trukme.
              Administratoriams svetainė veikia įprastai.
            </p>
          </div>

        </Card>
      </div>


      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => m.mutate(form)}
          disabled={m.isPending}
          className="gradient-gold text-primary-foreground btn-press"
        >
          <Save className="h-4 w-4 mr-2" /> {m.isPending ? "Saugoma..." : "Išsaugoti"}
        </Button>
      </div>
    </DashboardShell>
  );
}
