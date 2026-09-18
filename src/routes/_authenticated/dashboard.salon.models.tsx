import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AddonGate, AddonLockBanner, useAddonCredits } from "@/components/addon-lock";
import { MODEL_KEYS } from "@/lib/packages";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard-shell";
import { listMyModelCalls, saveModelCall, deleteModelCall } from "@/lib/model-calls.functions";
import { SERVICE_CATEGORY_LABELS } from "@/lib/service-taxonomy";
import { CitySelect } from "@/components/city-select";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/salon/models")({
  component: ModelsPage,
  head: () => ({
    meta: [
      { title: "Ieškomi modeliai · Valdymas · PaslaugosGrožiui" },
      { name: "description", content: "Skelbk modelių paieškas savo procedūroms – paslauga, miestas, kaina ir vietų skaičius." },
      { property: "og:title", content: "Ieškomi modeliai · Valdymas" },
      { property: "og:description", content: "Modelių paieškos skelbimų valdymas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const EMPTY = {
  service_name: "",
  service_category: "",
  city: "",
  description: "",
  price: "",
  spots: "1",
  starts_on: "",
  contact_phone: "",
  contact_email: "",
};

function ModelsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });
  const credits = useAddonCredits(MODEL_KEYS);
  const { data, isLoading } = useQuery({ queryKey: ["my-model-calls"], queryFn: () => listMyModelCalls() });

  const save = useMutation({
    mutationFn: () =>
      saveModelCall({
        data: {
          service_name: form.service_name.trim(),
          service_category: form.service_category || null,
          city: form.city || null,
          description: form.description || null,
          price_cents: Math.round(Number(form.price || 0) * 100),
          spots: Math.max(1, Number(form.spots || 1)),
          starts_on: form.starts_on || null,
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
        },
      }),
    onSuccess: () => {
      toast.success("Skelbimas paskelbtas");
      setForm({ ...EMPTY });
      qc.invalidateQueries({ queryKey: ["my-model-calls"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteModelCall({ data: { id } }),
    onSuccess: () => {
      toast.success("Skelbimas pašalintas");
      qc.invalidateQueries({ queryKey: ["my-model-calls"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <h1 className="mb-4 font-display text-2xl font-semibold">Ieškomi modeliai</h1>
      {credits.unlocked && <AddonLockBanner remaining={credits.remaining} unlocked unit="modelių paieškos" />}
      <AddonGate unlocked={credits.unlocked} loading={credits.loading}>
      <Card className="mb-6 grid gap-3 p-4 md:grid-cols-2">
        <div className="md:col-span-2 text-sm text-muted-foreground">
          Paskelbk, kokiai procedūrai ieškai modelio. Skelbimas rodomas klientams skiltyje „Ieškomi modeliai“.
        </div>
        <Field label="Paslauga">
          <Input
            value={form.service_name}
            onChange={(e) => setForm({ ...form, service_name: e.target.value })}
            placeholder="Pvz. Blakstienų priauginimas 2D"
            className="h-11 rounded-xl"
          />
        </Field>
        <Field label="Paslaugų sritis">
          <Combobox
            options={SERVICE_CATEGORY_LABELS.map((label) => ({ value: label, label }))}
            value={form.service_category}
            onChange={(v) => setForm({ ...form, service_category: v })}
            placeholder="Pasirinkite sritį"
            searchPlaceholder="Ieškoti srities..."
            className="h-11 rounded-xl bg-background"
          />
        </Field>
        <Field label="Miestas">
          <CitySelect value={form.city} onChange={(v) => setForm({ ...form, city: v })} className="h-11 rounded-xl bg-background" />
        </Field>
        <Field label="Data (nebūtina)">
          <Input type="date" value={form.starts_on} onChange={(e) => setForm({ ...form, starts_on: e.target.value })} className="h-11 rounded-xl" />
        </Field>
        <Field label="Kaina modeliui (€)">
          <Input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" className="h-11 rounded-xl" />
        </Field>
        <Field label="Vietų skaičius">
          <Input value={form.spots} onChange={(e) => setForm({ ...form, spots: e.target.value })} className="h-11 rounded-xl" />
        </Field>
        <Field label="Telefonas">
          <Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="h-11 rounded-xl" />
        </Field>
        <Field label="El. paštas">
          <Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="h-11 rounded-xl" />
        </Field>
        <div className="md:col-span-2">
          <Field label="Aprašymas">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Ko ieškai, kiek laiko užims, ką modelis gaus."
              className="rounded-xl"
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Button
            onClick={() => save.mutate()}
            disabled={form.service_name.trim().length < 2 || save.isPending}
            className="w-full rounded-xl md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" /> Paskelbti
          </Button>
        </div>
      </Card>
      </AddonGate>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : (data?.calls ?? []).length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          <Users className="mx-auto mb-2 h-7 w-7" /> Kol kas nėra paskelbtų modelių paieškų.
        </Card>
      ) : (
        <div className="space-y-3">
          {(data?.calls ?? []).map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="truncate font-medium">{c.service_name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {[c.city, c.service_category, `${c.spots} viet.`, c.starts_on].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="secondary">{c.price_cents > 0 ? `${(c.price_cents / 100).toFixed(2)} €` : "Nemokamai"}</Badge>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)} aria-label="Pašalinti">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}
