import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { listAdSlots, upsertAdSlot, deleteAdSlot, toggleAdActive, searchAdvertisers, listAutoPromos, setProfileFeatured, setArticlePromoted, PLACEMENTS, type Placement } from "@/lib/ads.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Megaphone, Plus, Trash2, Pencil, TrendingUp, Eye, MousePointerClick } from "lucide-react";
import { toast } from "sonner";

const PLACEMENT_LABELS: Record<Placement, string> = {
  home_feed: "Pagr. srautas",
  home_sidebar: "Pagr. šoninė",
  events: "Renginiai",
  promos: "Akcijos",
  search: "Paieška",
  article_detail: "Straipsnis",
  salon_profile: "Salono profilis",
};

const adsOpts = queryOptions({
  queryKey: ["admin", "ads"],
  queryFn: () => listAdSlots(),
});
const autoOpts = queryOptions({
  queryKey: ["admin", "auto-promos"],
  queryFn: () => listAutoPromos(),
});

export const Route = createFileRoute("/_authenticated/admin/ads")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(adsOpts);
    context.queryClient.ensureQueryData(autoOpts);
  },
  component: AdminAdsPage,
});

function AdminAdsPage() {
  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">Super Admin</div>
        <h1 className="mt-1 font-display text-3xl font-semibold flex items-center gap-2"><Megaphone className="h-7 w-7" /> Reklamos valdymas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sponsoruoti blokai ir automatiškai reklamuojami salonai/straipsniai.</p>
      </div>

      <Tabs defaultValue="sponsored">
        <TabsList>
          <TabsTrigger value="sponsored">Sponsoruotos reklamos</TabsTrigger>
          <TabsTrigger value="auto">Automatinis reklamavimas</TabsTrigger>
        </TabsList>
        <TabsContent value="sponsored" className="mt-4"><SponsoredTab /></TabsContent>
        <TabsContent value="auto" className="mt-4"><AutoTab /></TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function SponsoredTab() {
  const { data } = useSuspenseQuery(adsOpts);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const toggleFn = useServerFn(toggleAdActive);
  const delFn = useServerFn(deleteAdSlot);

  const toggle = useMutation({
    mutationFn: (v: { id: string; is_active: boolean }) => toggleFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "ads"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "ads"] }); toast.success("Ištrinta"); },
  });

  const stats = useMemo(() => {
    const active = data.ads.filter((a: any) => a.is_active).length;
    const impressions = data.ads.reduce((s: number, a: any) => s + (a.impressions ?? 0), 0);
    const clicks = data.ads.reduce((s: number, a: any) => s + (a.clicks ?? 0), 0);
    const ctr = impressions ? ((clicks / impressions) * 100).toFixed(2) : "0.00";
    return { active, impressions, clicks, ctr };
  }, [data.ads]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Aktyvių" value={stats.active} icon={Megaphone} />
        <StatCard label="Iš viso reklamų" value={data.ads.length} icon={TrendingUp} />
        <StatCard label="Parodymai" value={stats.impressions.toLocaleString("lt-LT")} icon={Eye} />
        <StatCard label="CTR" value={`${stats.ctr}%`} icon={MousePointerClick} sub={`${stats.clicks} klik.`} />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="gradient-gold text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Naujas reklamos blokas
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pavadinimas</TableHead>
              <TableHead>Reklamuotojas</TableHead>
              <TableHead>Vieta puslapyje</TableHead>
              <TableHead className="text-right">Prioritetas</TableHead>
              <TableHead className="text-right">Dažnis</TableHead>
              <TableHead className="text-right">Parodymai / paspaudimai</TableHead>
              <TableHead>Aktyvi</TableHead>
              <TableHead className="text-right">Veiksmai</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.ads.map((a: any) => {
              const adv = data.advertisers[a.advertiser_id];
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium max-w-[220px] truncate">{a.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{adv?.business_name ?? "—"}</TableCell>
                  <TableCell className="flex flex-wrap gap-1 max-w-[220px]">
                    {(a.placements ?? []).map((p: Placement) => (
                      <Badge key={p} variant="outline" className="text-[10px]">{PLACEMENT_LABELS[p] ?? p}</Badge>
                    ))}
                  </TableCell>
                  <TableCell className="text-right">{a.priority}</TableCell>
                  <TableCell className="text-right">1/{a.frequency}</TableCell>
                  <TableCell className="text-right text-xs">{a.impressions ?? 0} / {a.clicks ?? 0}</TableCell>
                  <TableCell>
                    <Switch checked={a.is_active} onCheckedChange={(v) => toggle.mutate({ id: a.id, is_active: v })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm("Ištrinti?")) del.mutate(a.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {data.ads.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Kol kas nėra reklamos blokų</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AdEditorDialog open={open} onOpenChange={setOpen} initial={editing} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub }: { label: string; value: string | number; icon: any; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function AdEditorDialog({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (v: boolean) => void; initial: any | null }) {
  const qc = useQueryClient();
  const upsertFn = useServerFn(upsertAdSlot);
  const searchFn = useServerFn(searchAdvertisers);
  const [form, setForm] = useState<any>(() => defaults(initial));
  const [advQuery, setAdvQuery] = useState("");
  const [advResults, setAdvResults] = useState<any[]>([]);

  // Reset when opening
  useMemo(() => { if (open) setForm(defaults(initial)); }, [open, initial]);

  const save = useMutation({
    mutationFn: (v: any) => upsertFn({ data: v }),
    onSuccess: () => {
      toast.success("Išsaugota");
      qc.invalidateQueries({ queryKey: ["admin", "ads"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message ?? "Klaida"),
  });

  async function searchAdv() {
    const r = await searchFn({ data: { q: advQuery } });
    setAdvResults(r.profiles);
  }

  function togglePlacement(p: Placement) {
    setForm((f: any) => ({
      ...f,
      placements: f.placements.includes(p) ? f.placements.filter((x: string) => x !== p) : [...f.placements, p],
    }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Redaguoti reklamą" : "Nauja reklama"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Reklamuotojas</Label>
            <div className="flex gap-2">
              <Input placeholder="Ieškoti verslo pagal pavadinimą" value={advQuery} onChange={(e) => setAdvQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchAdv()} />
              <Button type="button" variant="outline" onClick={searchAdv}>Ieškoti</Button>
            </div>
            {advResults.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {advResults.map((p) => (
                  <button key={p.id} type="button" className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary ${form.advertiser_id === p.id ? "bg-primary/10" : ""}`} onClick={() => setForm({ ...form, advertiser_id: p.id, _advName: p.business_name })}>
                    <div className="font-medium">{p.business_name}</div>
                    <div className="text-xs text-muted-foreground">{p.category} · {p.city}</div>
                  </button>
                ))}
              </div>
            )}
            {form.advertiser_id && <div className="text-xs text-muted-foreground">Pasirinkta: {form._advName ?? form.advertiser_id}</div>}
          </div>

          <div className="grid gap-2">
            <Label>Pavadinimas</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Tekstas</Label>
            <Textarea rows={3} value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Paveikslėlio URL</Label>
              <Input value={form.image_url ?? ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>CTA nuoroda</Label>
              <Input value={form.cta_url ?? ""} onChange={(e) => setForm({ ...form, cta_url: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>CTA tekstas</Label>
              <Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Kategorija (nebūtina)</Label>
              <Input value={form.target_category ?? ""} onChange={(e) => setForm({ ...form, target_category: e.target.value })} placeholder="pvz. Nagai" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Rodyti puslapiuose</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLACEMENTS.map((p) => (
                <label key={p} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer ${form.placements.includes(p) ? "border-primary bg-primary/5" : "border-border"}`}>
                  <input type="checkbox" checked={form.placements.includes(p)} onChange={() => togglePlacement(p)} className="accent-primary" />
                  {PLACEMENT_LABELS[p]}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Prioritetas (0-100)</Label>
              <Input type="number" min={0} max={100} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
            </div>
            <div className="grid gap-2">
              <Label>Dažnis (kas N)</Label>
              <Select value={String(form.frequency)} onValueChange={(v) => setForm({ ...form, frequency: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 4, 6, 8, 10, 12].map((n) => <SelectItem key={n} value={String(n)}>1 iš {n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Baigiasi</Label>
              <Input type="date" value={form.ends_at ? form.ends_at.slice(0, 10) : ""} onChange={(e) => setForm({ ...form, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            Aktyvi
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Atšaukti</Button>
          <Button
            className="gradient-gold text-primary-foreground"
            disabled={!form.advertiser_id || !form.title || form.placements.length === 0}
            onClick={() => save.mutate({
              id: initial?.id,
              advertiser_id: form.advertiser_id,
              title: form.title,
              body: form.body || null,
              image_url: form.image_url || null,
              cta_label: form.cta_label || "Sužinoti daugiau",
              cta_url: form.cta_url || null,
              placements: form.placements,
              priority: form.priority,
              frequency: form.frequency,
              target_category: form.target_category || null,
              is_active: form.is_active,
              ends_at: form.ends_at,
            })}
          >Išsaugoti</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaults(initial: any | null) {
  return {
    advertiser_id: initial?.advertiser_id ?? "",
    _advName: undefined as string | undefined,
    title: initial?.title ?? "",
    body: initial?.body ?? "",
    image_url: initial?.image_url ?? "",
    cta_label: initial?.cta_label ?? "Sužinoti daugiau",
    cta_url: initial?.cta_url ?? "",
    placements: initial?.placements ?? ["home_feed"],
    priority: initial?.priority ?? 10,
    frequency: initial?.frequency ?? 6,
    target_category: initial?.target_category ?? "",
    is_active: initial?.is_active ?? true,
    ends_at: initial?.ends_at ?? null,
  };
}

function AutoTab() {
  const { data } = useSuspenseQuery(autoOpts);
  const qc = useQueryClient();
  const setProfileFn = useServerFn(setProfileFeatured);
  const setArticleFn = useServerFn(setArticlePromoted);

  const stopProfile = useMutation({
    mutationFn: (id: string) => setProfileFn({ data: { id, is_featured: false } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "auto-promos"] }); toast.success("Nutraukta"); },
  });
  const stopArticle = useMutation({
    mutationFn: (id: string) => setArticleFn({ data: { id, is_promoted: false } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "auto-promos"] }); toast.success("Nutraukta"); },
  });

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold mb-3">Reklamuojami salonai/tiekėjai</h3>
        {data.profiles.length === 0 ? (
          <div className="text-sm text-muted-foreground">Kol kas nė vienas verslas nesireklamuoja.</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Verslas</TableHead><TableHead>Miestas</TableHead><TableHead>Prioritetas</TableHead><TableHead>Iki</TableHead><TableHead className="text-right">Veiksmai</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.profiles.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.business_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.city ?? "—"}</TableCell>
                  <TableCell>{p.featured_priority}</TableCell>
                  <TableCell className="text-sm">{p.featured_until ? new Date(p.featured_until).toLocaleDateString("lt-LT") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => stopProfile.mutate(p.id)}>Nutraukti</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg font-semibold mb-3">Reklamuojami straipsniai</h3>
        {data.articles.length === 0 ? (
          <div className="text-sm text-muted-foreground">Kol kas nė vienas straipsnis nesireklamuoja.</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Antraštė</TableHead><TableHead>Kategorija</TableHead><TableHead>Iki</TableHead><TableHead className="text-right">Veiksmai</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.articles.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium max-w-[420px] truncate">{a.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.category}</TableCell>
                  <TableCell className="text-sm">{a.promoted_until ? new Date(a.promoted_until).toLocaleDateString("lt-LT") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => stopArticle.mutate(a.id)}>Nutraukti</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
