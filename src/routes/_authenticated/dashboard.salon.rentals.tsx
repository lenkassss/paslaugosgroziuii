import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyRentals, upsertRental, deleteRental } from "@/lib/rentals.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GalleryUploader } from "@/components/image-uploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Home, Plus, Pencil, Trash2, MapPin, Ruler } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/rentals")({ component: Page });

type Rental = {
  id?: string;
  title: string;
  description?: string;
  city?: string;
  address?: string;
  price: number;
  price_period: "hour" | "day" | "month";
  area_sqm?: number;
  amenities?: string[];
  images?: string[];
  contact_phone?: string;
  contact_email?: string;
  is_active?: boolean;
};

const EMPTY: Rental = { title: "", price: 0, price_period: "month", amenities: [], images: [], is_active: true };

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyRentals);
  const saveFn = useServerFn(upsertRental);
  const delFn = useServerFn(deleteRental);

  const q = useQuery({ queryKey: ["my-rentals"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Rental>(EMPTY);
  const [amenityInput, setAmenityInput] = useState("");

  const saveMut = useMutation({
    mutationFn: (input: Rental) => saveFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-rentals"] });
      qc.invalidateQueries({ queryKey: ["rentals"] });
      setOpen(false);
      setDraft(EMPTY);
      toast.success("Išsaugota");
    },
    onError: (e) => toastError(e),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-rentals"] });
      qc.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Ištrinta");
    },
  });

  const openNew = () => { setDraft(EMPTY); setOpen(true); };
  const openEdit = (r: Rental) => { setDraft({ ...r }); setOpen(true); };

  const addAmenity = () => {
    const v = amenityInput.trim();
    if (!v) return;
    setDraft({ ...draft, amenities: [...(draft.amenities ?? []), v] });
    setAmenityInput("");
  };

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Patalpų nuoma</h1>
          <p className="text-sm text-muted-foreground mt-1">Skelbk kabinetą, darbo vietą arba visą saloną nuomai.</p>
        </div>
        <Button onClick={openNew} className="gradient-gold text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> Naujas skelbimas
        </Button>
      </div>

      {q.data?.items.length === 0 ? (
        <Card className="p-14 text-center">
          <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg">Kol kas skelbimų nėra</p>
          <Button onClick={openNew} className="mt-4 gradient-gold text-primary-foreground">Sukurti pirmą</Button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {q.data?.items.map((r: any) => (
            <Card key={r.id} className="overflow-hidden">
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {r.images?.[0] && <img src={r.images[0]} alt={r.title} className="h-full w-full object-cover" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium line-clamp-1">{r.title}</h3>
                  {!r.is_active && <Badge variant="outline">Neaktyvus</Badge>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-3">
                  {r.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
                  {r.area_sqm && <span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3" />{Number(r.area_sqm)} m²</span>}
                </div>
                <div className="mt-2 font-display text-lg">{Number(r.price).toFixed(0)} € <span className="text-xs text-muted-foreground">/ {r.price_period === "hour" ? "val." : r.price_period === "day" ? "d." : "mėn."}</span></div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="h-3 w-3 mr-1" />Keisti</Button>
                  <Button size="sm" variant="outline" onClick={() => confirm("Ištrinti skelbimą?") && delMut.mutate(r.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Redaguoti skelbimą" : "Naujas skelbimas"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Pavadinimas *</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Jaukus kabinetas Vilniaus centre" />
            </div>
            <div>
              <Label>Aprašymas</Label>
              <Textarea rows={4} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Miestas</Label>
                <Input value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
              </div>
              <div>
                <Label>Adresas</Label>
                <Input value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Kaina *</Label>
                <Input type="number" min={0} value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Laikotarpis</Label>
                <Select value={draft.price_period} onValueChange={(v) => setDraft({ ...draft, price_period: v as "hour" | "day" | "month" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Valandai</SelectItem>
                    <SelectItem value="day">Dienai</SelectItem>
                    <SelectItem value="month">Mėnesiui</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plotas (m²)</Label>
                <Input type="number" min={0} value={draft.area_sqm ?? ""} onChange={(e) => setDraft({ ...draft, area_sqm: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kontaktinis telefonas</Label>
                <Input value={draft.contact_phone ?? ""} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} />
              </div>
              <div>
                <Label>Kontaktinis el. paštas</Label>
                <Input type="email" value={draft.contact_email ?? ""} onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Patogumai</Label>
              <div className="flex gap-2 mt-1">
                <Input value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAmenity(); } }} placeholder="pvz., WiFi, plovykla, stovėjimas" />
                <Button type="button" variant="outline" onClick={addAmenity}>Pridėti</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(draft.amenities ?? []).map((a, i) => (
                  <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setDraft({ ...draft, amenities: draft.amenities!.filter((_, x) => x !== i) })}>
                    {a} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Nuotraukos</Label>
              <div className="mt-1">
                <GalleryUploader values={draft.images ?? []} onChange={(urls) => setDraft({ ...draft, images: urls })} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Aktyvus skelbimas</div>
                <div className="text-xs text-muted-foreground">Neaktyvūs skelbimai nematomi lankytojams.</div>
              </div>
              <Switch checked={draft.is_active !== false} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Atšaukti</Button>
            <Button
              disabled={!draft.title || !draft.price || saveMut.isPending}
              onClick={() => saveMut.mutate(draft)}
              className="gradient-gold text-primary-foreground"
            >
              Išsaugoti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
