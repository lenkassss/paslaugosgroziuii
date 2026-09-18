import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyProducts, upsertProduct, deleteProduct, listSupplierOrders, updateOrderStatus } from "@/lib/marketplace.functions";
import { listBrands, suggestBrand } from "@/lib/brands.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { GalleryUploader } from "@/components/image-uploader";

import { Plus, Loader2, Trash2, Pencil, Package, Euro, Check, ChevronsUpDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/supplier/products")({
  component: Page,
});

type ProductForm = {
  id?: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  brand: string;
  brand_id: string | null;
  stock: number;
  discount_percent: number;
  is_active: boolean;
};

const CATEGORIES = [
  "Plaukų priežiūra",
  "Nagų priežiūra",
  "Odos priežiūra",
  "Blakstienos ir antakiai",
  "Įrankiai",
  "Makiažas",
  "Depiliacija",
  "Aksesuarai",
];

const empty: ProductForm = { title: "", description: "", price: 0, currency: "EUR", images: [], category: "", brand: "", brand_id: null, stock: 1, discount_percent: 0, is_active: true };

function Page() {
  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-2">Mano prekės</h1>
      <p className="text-sm text-muted-foreground mb-6">Valdyk savo produktus ir gaunamus užsakymus. Platformos mokestis — 0,49 € už užsakymą.</p>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Prekės</TabsTrigger>
          <TabsTrigger value="orders">Užsakymai</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6"><ProductsTab /></TabsContent>
        <TabsContent value="orders" className="mt-6"><OrdersTab /></TabsContent>
      </Tabs>
    </DashboardShell>
  );
}

function ProductsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyProducts);
  const saveFn = useServerFn(upsertProduct);
  const delFn = useServerFn(deleteProduct);

  const q = useQuery({ queryKey: ["my-products"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(empty);

  const save = useMutation({
    mutationFn: () => saveFn({ data: {
      id: form.id,
      title: form.title,
      description: form.description,
      price: Number(form.price),
      currency: form.currency,
      images: form.images,
      category: form.category,
      brand: form.brand,
      brand_id: form.brand_id,
      stock: Number(form.stock),
      discount_percent: Number(form.discount_percent),
      is_active: form.is_active,
    } }),
    onSuccess: () => { toast.success("Išsaugota"); setOpen(false); qc.invalidateQueries({ queryKey: ["my-products"] }); qc.invalidateQueries({ queryKey: ["mp-products"] }); qc.invalidateQueries({ queryKey: ["mp-facets"] }); },
    onError: (e) => toastError(e),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Pašalinta"); qc.invalidateQueries({ queryKey: ["my-products"] }); },
  });

  const openNew = () => { setForm(empty); setOpen(true); };
  const openEdit = (p: any) => {
    setForm({
      id: p.id, title: p.title, description: p.description ?? "", price: Number(p.price),
      currency: p.currency ?? "EUR", images: p.images ?? [], category: p.category ?? "",
      brand: p.brand ?? "", brand_id: p.brand_id ?? null, stock: p.stock ?? 0,
      discount_percent: p.discount_percent ?? 0, is_active: p.is_active,
    });
    setOpen(true);
  };

  return (
    <>
      <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl">Skelbk pasiūlymus verslo centre</h2>
          <p className="text-sm text-muted-foreground">Specialūs pasiūlymai ir mokymai meistrėms bei salonams — postai matomi verslo erdvėje.</p>
        </div>
        <Button asChild variant="outline" className="shrink-0">
          <Link to="/dashboard/supplier/feed">Kurti postą</Link>
        </Button>
      </Card>

      <div className="flex justify-between mb-4">
        <div className="text-sm text-muted-foreground">{q.data?.items.length ?? 0} prekės (-ių)</div>

        <Button onClick={openNew} className="gradient-gold text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Nauja prekė</Button>
      </div>

      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {q.data?.items.map((p: any) => {
          const img = p.images?.[0];
          return (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {img && <img src={img} alt={p.title} className="h-full w-full object-cover" />}
                {!p.is_active && <Badge className="absolute top-2 left-2" variant="secondary">Neaktyvi</Badge>}
                {p.discount_percent > 0 && <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">−{p.discount_percent}%</Badge>}
              </div>
              <div className="p-3">
                <div className="font-medium line-clamp-1">{p.title}</div>
                <div className="text-xs text-muted-foreground">{p.brand} · {p.category || "—"}</div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="font-display text-lg">{Number(p.price).toFixed(2)} €</span>
                  <span className="text-xs text-muted-foreground">Sand.: {p.stock}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1" /> Redaguoti</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Šalinti?")) del.mutate(p.id); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {q.data && q.data.items.length === 0 && (
        <Card className="p-12 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p>Dar neįkėlėte prekių. Pradėkite dabar.</p>
          <Button onClick={openNew} className="gradient-gold text-primary-foreground mt-4"><Plus className="h-4 w-4 mr-1" /> Pridėti pirmą prekę</Button>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Redaguoti prekę" : "Nauja prekė"}</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <Field label="Pavadinimas *"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Aprašymas"><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prekės ženklas">
                <BrandPicker value={form.brand_id} name={form.brand} onChange={(b) => setForm({ ...form, brand_id: b.id, brand: b.name })} />
              </Field>
              <Field label="Kategorija">
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">— pasirinkti —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Profesionalo kaina, € *"><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /><p className="mt-1 text-[10px] text-muted-foreground">Kliento kaina apskaičiuojama automatiškai: +30%</p></Field>
              <Field label="Kiekis *"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></Field>
              <Field label="Nuolaida, %"><Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} /></Field>
            </div>
            <GalleryUploader values={form.images} onChange={(urls) => setForm({ ...form, images: urls })} />
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              Prekė aktyvi (matoma turguje)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Atšaukti</Button>
              <Button disabled={save.isPending || !form.title || form.price <= 0} onClick={() => save.mutate()} className="gradient-gold text-primary-foreground">
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Išsaugoti"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrdersTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSupplierOrders);
  const updFn = useServerFn(updateOrderStatus);
  const q = useQuery({ queryKey: ["supplier-orders"], queryFn: () => listFn() });
  const mut = useMutation({
    mutationFn: (v: { orderId: string; status: "shipped" | "delivered" | "cancelled" }) => updFn({ data: v }),
    onSuccess: () => { toast.success("Atnaujinta"); qc.invalidateQueries({ queryKey: ["supplier-orders"] }); },
  });

  return (
    <div className="space-y-3">
      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {q.data?.orders.map((o: any) => (
        <Card key={o.id} className="p-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {fmtDate(o.created_at)}</div>
              <div className="text-sm mt-1">{o.contact_email} · {o.contact_phone}</div>
              <div className="text-xs text-muted-foreground">{o.shipping_address?.full_name} · {o.shipping_address?.address}, {o.shipping_address?.city} {o.shipping_address?.postal_code}</div>
            </div>
            <div className="text-right">
              <Badge variant="outline">{o.status}</Badge>
              <div className="font-display text-lg mt-1"><Euro className="h-4 w-4 inline" /> {Number(o.total).toFixed(2)}</div>
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-2 space-y-1 text-sm">
            {o.order_items?.map((it: any, i: number) => (
              <div key={i} className="flex justify-between"><span>{it.qty} × {it.snapshot_title}</span><span className="text-muted-foreground">{(Number(it.unit_price) * it.qty).toFixed(2)} €</span></div>
            ))}
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {o.status === "paid" && <Button size="sm" onClick={() => mut.mutate({ orderId: o.id, status: "shipped" })}>Pažymėti kaip išsiųsta</Button>}
            {o.status === "shipped" && <Button size="sm" onClick={() => mut.mutate({ orderId: o.id, status: "delivered" })}>Pristatyta</Button>}
            {o.status !== "cancelled" && o.status !== "delivered" && <Button size="sm" variant="ghost" onClick={() => mut.mutate({ orderId: o.id, status: "cancelled" })}>Atšaukti</Button>}
          </div>
        </Card>
      ))}
      {q.data && q.data.orders.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">Užsakymų dar nėra.</Card>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}

function BrandPicker({ value, name, onChange }: { value: string | null; name: string; onChange: (b: { id: string | null; name: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const listFn = useServerFn(listBrands);
  const suggestFn = useServerFn(suggestBrand);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["brands"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });
  const allBrands = ((q.data?.brands ?? []) as Array<{ id: string; name: string; is_verified?: boolean }>);
  const needle = search.trim().toLowerCase();
  const brands = needle ? allBrands.filter((b) => b.name.toLowerCase().includes(needle)) : allBrands;
  const exact = allBrands.find((b) => b.name.toLowerCase() === needle);

  const suggest = useMutation({
    mutationFn: (n: string) => suggestFn({ data: { name: n } }),
    onSuccess: (res: any) => {
      const b = res.brand ?? {};
      onChange({ id: b.id ?? null, name: b.name ?? search });
      toast.success(res.existed ? "Prekės ženklas pasirinktas" : "Prekės ženklas pridėtas — laukia patvirtinimo");
      qc.invalidateQueries({ queryKey: ["brands"] });
      setOpen(false);
      setSearch("");
    },
    onError: (e) => toastError(e),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {name || <span className="text-muted-foreground">— pasirinkti —</span>}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Ieškoti prekės ženklo…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>
              {search.trim().length >= 2 ? (
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-accent inline-flex items-center gap-2"
                  onClick={() => suggest.mutate(search.trim())}
                  disabled={suggest.isPending}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Pridėti „{search.trim()}"
                </button>
              ) : (
                <div className="p-3 text-sm text-muted-foreground">Įrašykite bent 2 simbolius…</div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {brands.map((b) => (
                <CommandItem
                  key={b.id}
                  value={b.name}
                  onSelect={() => { onChange({ id: b.id, name: b.name }); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === b.id ? "opacity-100" : "opacity-0")} />
                  {b.name}
                  {b.is_verified && <Badge variant="outline" className="ml-auto text-[10px] border-primary/40 text-primary">✓</Badge>}
                </CommandItem>
              ))}
              {search.trim().length >= 2 && !exact && (
                <CommandItem onSelect={() => suggest.mutate(search.trim())}>
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  Pridėti „{search.trim()}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
