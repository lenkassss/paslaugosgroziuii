import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProGate } from "@/components/pro-gate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSalonDashboard, upsertService, deleteService, purchaseHighlight } from "@/lib/platform.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock, Tag, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { fmtMoney } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";
import { ServiceSuggestionCard } from "@/components/service-suggestion-card";
import { useQuery as useTaxonomyQuery } from "@tanstack/react-query";
import { listStandardServices } from "@/lib/services.functions";
import { Combobox } from "@/components/ui/combobox";

export const Route = createFileRoute("/_authenticated/dashboard/salon/services")({
  component: ServicesPage,
});

type ServiceForm = {
  id?: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  duration_mins: number;
  discount_percent?: number | null;
  discount_price?: number | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
  discount_label?: string | null;
};

function effectivePrice(s: { price: number | string; discount_percent?: number | null; discount_price?: number | null; discount_starts_at?: string | null; discount_ends_at?: string | null }) {
  const now = Date.now();
  const okStart = !s.discount_starts_at || new Date(s.discount_starts_at).getTime() <= now;
  const okEnd = !s.discount_ends_at || new Date(s.discount_ends_at).getTime() >= now;
  if (!okStart || !okEnd) return { price: Number(s.price), original: null as number | null };
  if (s.discount_price != null) return { price: Number(s.discount_price), original: Number(s.price) };
  if (s.discount_percent != null) return { price: Number(s.price) * (1 - Number(s.discount_percent) / 100), original: Number(s.price) };
  return { price: Number(s.price), original: null };
}

function ServicesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["salon-dashboard"], queryFn: () => getSalonDashboard({ data: undefined }) });
  const [editing, setEditing] = useState<ServiceForm | null>(null);
  const taxonomy = useTaxonomyQuery({ queryKey: ["standard-services"], queryFn: () => listStandardServices(), staleTime: 10 * 60 * 1000 });
  const categories = Array.from(new Set((taxonomy.data?.services ?? []).map((service) => service.category))).sort((a, b) => a.localeCompare(b, "lt"));

  const upsert = useServerFn(upsertService);
  const del = useServerFn(deleteService);
  const boost = useServerFn(purchaseHighlight);
  const upsertMut = useMutation({
    mutationFn: (v: ServiceForm) => upsert({ data: v }),
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["salon-dashboard"] }); toast.success("Išsaugota"); },
    onError: (e) => toastError(e),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salon-dashboard"] }); toast.success("Ištrinta"); },
  });
  const boostMut = useMutation({
    mutationFn: (v: { id: string; weeks: number }) => boost({ data: { targetKind: "service", targetId: v.id, weeks: v.weeks } }),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: ["salon-dashboard"] }); toast.success(`Paslauga paryškinta! Sumokėta ${r.amountEur.toFixed(2)}€`); },
    onError: (e) => toastError(e),
  });

  return (
    <DashboardShell>
      <ProGate feature="paslaugų valdymas">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-3xl">Paslaugos</h1>
          <p className="text-sm text-muted-foreground mt-1">Redaguok kainas, uždėk nuolaidas, paryškink konkrečią paslaugą.</p>
        </div>
        <Button onClick={() => setEditing({ name: "", category: "", price: 0, duration_mins: 60 })} className="gradient-gold text-primary-foreground btn-press">
          <Plus className="h-4 w-4 mr-1" /> Pridėti
        </Button>
      </div>

      <div className="grid gap-3">
        {data?.services.map((s: any) => {
          const eff = effectivePrice(s);
          const hasDiscount = eff.original != null;
          return (
            <Card key={s.id} className="p-4 flex justify-between items-center flex-wrap gap-3">
              <div className="min-w-0">
                <div className="font-medium flex items-center gap-2">
                  {s.name}
                  {hasDiscount && (
                    <Badge className="bg-red-500/15 text-red-600 border-0"><Tag className="h-3 w-3 mr-1" />{s.discount_label ?? "Akcija"}</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">{s.category} · <Clock className="inline h-3 w-3" /> {s.duration_mins} min</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  {hasDiscount ? (
                    <>
                      <div className="font-semibold text-red-600">{fmtMoney(eff.price)}</div>
                      <div className="text-xs text-muted-foreground line-through">{fmtMoney(eff.original!)}</div>
                    </>
                  ) : (
                    <div className="font-semibold">{fmtMoney(eff.price)}</div>
                  )}
                </div>
                <Button variant="outline" size="sm" title="Paryškinti 1 sav. – 4,99€" onClick={() => boostMut.mutate({ id: s.id, weeks: 1 })} disabled={boostMut.isPending}>
                  <Sparkles className="h-4 w-4 mr-1 text-primary" /> Paryškinti
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setEditing({
                  id: s.id, name: s.name, category: s.category, description: s.description ?? "",
                  price: Number(s.price), duration_mins: s.duration_mins,
                  discount_percent: s.discount_percent, discount_price: s.discount_price,
                  discount_starts_at: s.discount_starts_at, discount_ends_at: s.discount_ends_at,
                  discount_label: s.discount_label,
                })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => delMut.mutate(s.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          );
        })}
        {data && data.services.length === 0 && <Card className="p-8 text-center text-muted-foreground">Kol kas paslaugų nėra.</Card>}
      </div>

      <div className="mt-6">
        <ServiceSuggestionCard />
      </div>


      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Redaguoti paslaugą" : "Nauja paslauga"}</DialogTitle></DialogHeader>
          {editing && (
            <form
              className="space-y-3"
              onSubmit={(e) => { e.preventDefault(); upsertMut.mutate(editing); }}
            >
              <div>
                <Label>Pavadinimas</Label>
                <Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Kategorija</Label>
                <Combobox
                  options={categories.map((category) => ({ value: category, label: category }))}
                  value={editing.category}
                  onChange={(category) => setEditing({ ...editing, category })}
                  placeholder="Pasirink kategoriją"
                  searchPlaceholder="Ieškoti kategorijos…"
                />
              </div>
              <div>
                <Label>Aprašymas</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Kaina (€)</Label>
                  <Input required type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Trukmė (min)</Label>
                  <Input required type="number" value={editing.duration_mins} onChange={(e) => setEditing({ ...editing, duration_mins: Number(e.target.value) })} />
                </div>
              </div>

              <div className="border rounded-md p-3 bg-red-50/50 dark:bg-red-950/10 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600"><Tag className="h-4 w-4" /> Nuolaida (neprivaloma)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nuolaida %</Label>
                    <Input type="number" min={0} max={90} placeholder="pvz. 20"
                      value={editing.discount_percent ?? ""}
                      onChange={(e) => setEditing({ ...editing, discount_percent: e.target.value ? Number(e.target.value) : null, discount_price: null })} />
                  </div>
                  <div>
                    <Label className="text-xs">Arba fiksuota kaina (€)</Label>
                    <Input type="number" step="0.01" placeholder="pvz. 19.99"
                      value={editing.discount_price ?? ""}
                      onChange={(e) => setEditing({ ...editing, discount_price: e.target.value ? Number(e.target.value) : null, discount_percent: null })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Galioja nuo</Label>
                    <Input type="datetime-local"
                      value={editing.discount_starts_at?.slice(0, 16) ?? ""}
                      onChange={(e) => setEditing({ ...editing, discount_starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </div>
                  <div>
                    <Label className="text-xs">Iki</Label>
                    <Input type="datetime-local"
                      value={editing.discount_ends_at?.slice(0, 16) ?? ""}
                      onChange={(e) => setEditing({ ...editing, discount_ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Etiketė</Label>
                  <Input placeholder="pvz. Vasaros akcija" maxLength={60}
                    value={editing.discount_label ?? ""}
                    onChange={(e) => setEditing({ ...editing, discount_label: e.target.value || null })} />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={upsertMut.isPending} className="gradient-gold text-primary-foreground">Išsaugoti</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      </ProGate>
    </DashboardShell>
  );
}
