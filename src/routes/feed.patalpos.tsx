import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listRentals, sendRentalInquiry } from "@/lib/rentals.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Ruler, Phone, Mail, Home, Sparkles, Send, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/feed/patalpos")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    const list = (roles ?? []).map((r) => r.role);
    const ok = list.some((r) => r === "salon" || r === "staff" || r === "supplier" || r === "admin" || r === "super_admin");
    if (!ok) throw redirect({ to: "/" });
  },
  component: Page,
  head: () => ({
    meta: [
      { title: "Patalpų nuoma B2B · PaslaugosGrožiui" },
      { name: "description", content: "Kabinetai, darbo vietos ir grožio salonai nuomai. Uždaras B2B skelbimų srautas salonams, meistrėms ir tiekėjams." },
      { property: "og:title", content: "Patalpų nuoma B2B" },
      { property: "og:description", content: "Uždaras patalpų nuomos srautas grožio profesionalams." },
      { property: "og:type", content: "website" },
    ],
  }),
});

const PERIOD_LT: Record<string, string> = { hour: "val.", day: "d.", month: "mėn." };

function Page() {
  const listFn = useServerFn(listRentals);
  const q = useQuery({ queryKey: ["rentals", "list"], queryFn: () => listFn({ data: { limit: 60 } }), staleTime: 60_000 });
  const items = (q.data?.items ?? []) as any[];
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10 mb-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <Badge className="gradient-gold text-primary-foreground border-0 mb-3 inline-flex items-center gap-1"><Lock className="h-3 w-3" /> B2B tik</Badge>
        <h1 className="font-display text-3xl md:text-5xl leading-tight">
          Patalpos <span className="text-gradient-gold">grožio verslui</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Uždaras skelbimų srautas — matomas tik salonams, meistrėms ir tiekėjams. Susisiek tiesiai su savininku.
        </p>
      </div>

      {q.isLoading ? (
        <div className="py-14 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-14 text-center">
          <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg">Kol kas skelbimų nėra</p>
          <p className="text-sm text-muted-foreground mt-1">Grįžkite netrukus — nauji pasiūlymai pridedami kasdien.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((r) => {
            const img = r.images?.[0];
            return (
              <button key={r.id} onClick={() => setSelected(r)} className="text-left">
                <Card className="overflow-hidden group hover:border-primary/50 hover:shadow-elegant transition h-full">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {img ? (
                      <img src={img} alt={r.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Sparkles className="h-10 w-10" /></div>
                    )}
                    <Badge className="absolute top-3 left-3 gradient-gold text-primary-foreground border-0">
                      {Number(r.price).toFixed(0)} € / {PERIOD_LT[r.price_period]}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg font-semibold line-clamp-1">{r.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {r.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
                      {r.area_sqm && <span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3" />{Number(r.area_sqm)} m²</span>}
                    </div>
                    {r.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                    {r.amenities && r.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {r.amenities.slice(0, 4).map((a: string) => (
                          <Badge key={a} variant="outline" className="text-[10px] font-normal">{a}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </button>
            );
          })}
        </div>
      )}

      <Card className="mt-10 p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <h3 className="font-display text-xl">Turi patalpą nuomai?</h3>
            <p className="text-sm text-muted-foreground mt-1">Salonai ir tiekėjai gali skelbti patalpas iš savo darbastalio.</p>
          </div>
          <Button asChild className="gradient-gold text-primary-foreground">
            <Link to="/dashboard/salon/rentals">Skelbti patalpą</Link>
          </Button>
        </div>
      </Card>

      <RentalDetailDialog rental={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function RentalDetailDialog({ rental, onClose }: { rental: any | null; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!rental) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("Sveiki, mane domina jūsų nuomojama patalpa. Ar ji dar laisva?");
        return;
      }
      const { data: p } = await supabase
        .from("profiles")
        .select("business_name, owner_name, category, city, phone, bio")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(p);
      const name = p?.business_name || p?.owner_name || "grožio meistrė";
      const specialization = p?.category ? ` (${p.category})` : "";
      const city = p?.city ? `, dirbanti ${p.city}` : "";
      const phone = p?.phone ? `\n\nTel.: ${p.phone}` : "";
      setMessage(
        `Sveiki,\n\nesu ${name}${specialization}${city}. Domina jūsų nuomojama patalpa "${rental.title}"${rental.city ? ` (${rental.city})` : ""}. Ar ji dar laisva ir kokiomis sąlygomis būtų galima susitarti?\n\nDėkoju už atsakymą.${phone}`,
      );
    })();
  }, [rental]);

  const inqFn = useServerFn(sendRentalInquiry);
  const mut = useMutation({
    mutationFn: () => inqFn({ data: { rental_id: rental.id, message } }),
    onSuccess: () => { toast.success("Užklausa išsiųsta savininkui"); onClose(); },
    onError: (e) => toastError(e),
  });
  if (!rental) return null;

  const imgs: string[] = rental.images ?? [];

  return (
    <Dialog open={!!rental} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{rental.title}</DialogTitle>
        </DialogHeader>
        {imgs.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 md:col-span-2 aspect-[4/3] rounded-lg overflow-hidden bg-muted">
              <img loading="lazy" decoding="async" src={imgs[0]} alt={rental.title} className="h-full w-full object-cover" />
            </div>
            <div className="hidden md:grid grid-rows-2 gap-2">
              {imgs.slice(1, 3).map((s, i) => (
                <div key={i} className="rounded-lg overflow-hidden bg-muted">
                  <img loading="lazy" decoding="async" src={s} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-3 mt-2">
          <Card className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Kaina</div>
            <div className="font-display text-lg">{Number(rental.price).toFixed(0)} € <span className="text-xs text-muted-foreground">/ {PERIOD_LT[rental.price_period]}</span></div>
            {rental.price_per_day && <div className="text-xs text-muted-foreground">Dienai: {Number(rental.price_per_day).toFixed(0)} €</div>}
            {rental.price_per_month && <div className="text-xs text-muted-foreground">Mėnesiui: {Number(rental.price_per_month).toFixed(0)} €</div>}
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Vieta</div>
            <div className="text-sm">{rental.city ?? "—"}</div>
            {rental.address && <div className="text-xs text-muted-foreground">{rental.address}</div>}
          </Card>
          <Card className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Komunaliniai</div>
            <div className="text-sm">{rental.utilities_included ? "Įskaičiuoti į kainą" : "Skaičiuojami atskirai"}</div>
            {rental.area_sqm && <div className="text-xs text-muted-foreground">Plotas: {Number(rental.area_sqm)} m²</div>}
          </Card>
        </div>
        {rental.description && <p className="text-sm text-muted-foreground whitespace-pre-line">{rental.description}</p>}
        {rental.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {rental.amenities.map((a: string) => <Badge key={a} variant="outline">{a}</Badge>)}
          </div>
        )}
        <div className="rounded-lg border p-3 space-y-2">
          <div className="text-sm font-medium">Siųsti užklausą savininkui</div>
          <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Trumpai apie save ir kada norite išsinuomoti..." />
          <div className="flex flex-wrap gap-2">
            {rental.contact_phone && (
              <Button asChild size="sm" variant="outline"><a href={`tel:${rental.contact_phone}`}><Phone className="h-3 w-3 mr-1" />{rental.contact_phone}</a></Button>
            )}
            {rental.contact_email && (
              <Button asChild size="sm" variant="outline"><a href={`mailto:${rental.contact_email}`}><Mail className="h-3 w-3 mr-1" />{rental.contact_email}</a></Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Uždaryti</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || message.trim().length < 3} className="gradient-gold text-primary-foreground">
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Siųsti užklausą
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
