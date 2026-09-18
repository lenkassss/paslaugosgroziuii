import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createArticleUnified, createEvent, createPromo, deleteMyContent, listMyContent } from "@/lib/content.functions";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Calendar, Tag, Trash2, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import { AddonGate, AddonLockBanner, useAddonCredits } from "@/components/addon-lock";
import { COURSE_KEYS } from "@/lib/packages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/content")({
  component: SalonContent,
});

function SalonContent() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-content"], queryFn: () => listMyContent({ data: undefined }) });
  const courseCredits = useAddonCredits(COURSE_KEYS);
  const promoCredits = useAddonCredits([
    "supplier_offers",
    ...(["b2c", "b2b"] as const).flatMap((a) => [7, 14, 21, 30].map((d) => `special_offer_${a}_${d}`)),
  ]);

  const createArt = useServerFn(createArticleUnified);
  const createEvt = useServerFn(createEvent);
  const createPrm = useServerFn(createPromo);
  const del = useServerFn(deleteMyContent);

  type ArticleInput = { title: string; subtitle?: string; excerpt?: string; body_md: string; cover_url?: string; category: string; tags: string[] };
  type EventInput = { title: string; subtitle?: string; excerpt?: string; body_md: string; cover_url?: string; category: string; event_starts_at: string; event_ends_at?: string; event_location: string; event_price_eur?: number; event_seats?: number };
  type PromoInput = { title: string; subtitle?: string; excerpt?: string; body_md: string; cover_url?: string; promo_discount_pct: number; promo_starts_at?: string; promo_ends_at: string; promo_service_ids: string[]; audience: "b2c" | "b2b" };

  const artMut = useMutation({
    mutationFn: (v: ArticleInput) => createArt({ data: v }),
    onSuccess: () => { toast.success("Straipsnis paskelbtas"); qc.invalidateQueries({ queryKey: ["my-content"] }); },
    onError: (e: Error) => toastError(e),
  });
  const evtMut = useMutation({
    mutationFn: (v: EventInput) => createEvt({ data: v }),
    onSuccess: () => { toast.success("Renginys paskelbtas"); qc.invalidateQueries({ queryKey: ["my-content"] }); },
    onError: (e: Error) => toastError(e),
  });
  const prmMut = useMutation({
    mutationFn: (v: PromoInput) => createPrm({ data: v }),
    onSuccess: () => { toast.success("Akcija paskelbta"); qc.invalidateQueries({ queryKey: ["my-content"] }); },
    onError: (e: Error) => toastError(e),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Ištrinta"); qc.invalidateQueries({ queryKey: ["my-content"] }); },
  });

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Turinys</h1>
          <p className="text-sm text-muted-foreground mt-1">Skelbk naujienas, mokymus ir pasiūlymus pasirinktai auditorijai.</p>
        </div>
        <Badge variant="outline"><Sparkles className="h-3 w-3 mr-1" />Publikacijos</Badge>
      </div>

      <Tabs defaultValue="article">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="article"><Newspaper className="h-4 w-4 mr-1.5" />Straipsnis</TabsTrigger>
           <TabsTrigger value="event"><Calendar className="h-4 w-4 mr-1.5" />Mokymas</TabsTrigger>
           <TabsTrigger value="promo"><Tag className="h-4 w-4 mr-1.5" />Pasiūlymas</TabsTrigger>
        </TabsList>

        <TabsContent value="article">
          <ArticleForm onSubmit={artMut.mutate} pending={artMut.isPending} />
        </TabsContent>
        <TabsContent value="event">
          {courseCredits.unlocked && <AddonLockBanner remaining={courseCredits.remaining} unlocked unit="mokymų paskelbimai" />}
          <AddonGate unlocked={courseCredits.unlocked} loading={courseCredits.loading}>
            <EventForm onSubmit={evtMut.mutate} pending={evtMut.isPending} />
          </AddonGate>
        </TabsContent>
        <TabsContent value="promo">
          {promoCredits.unlocked && <AddonLockBanner remaining={promoCredits.remaining} unlocked unit="pasiūlymų planai" />}
          <AddonGate unlocked={promoCredits.unlocked} loading={promoCredits.loading}>
            <PromoForm onSubmit={prmMut.mutate} pending={prmMut.isPending} />
          </AddonGate>
        </TabsContent>
      </Tabs>

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold mb-4">Mano publikacijos</h2>
        <div className="space-y-2">
          {!data?.items.length && <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">Kol kas nieko nepaskelbei.</div>}
          {data?.items.map((it) => (
            <Card key={it.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {it.kind === "event" ? "Renginys" : it.kind === "promo" ? "Akcija" : "Straipsnis"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{new Date(it.published_at).toLocaleDateString("lt-LT")}</span>
                  <span className="text-xs text-muted-foreground">· {it.views} peržiūros</span>
                </div>
                <div className="mt-1 font-medium truncate">{it.title}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button asChild variant="ghost" size="icon">
                  <Link to="/article/$slug" params={{ slug: it.slug }} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => delMut.mutate(it.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}

function ArticleForm({ onSubmit, pending }: { onSubmit: (v: { title: string; subtitle?: string; excerpt?: string; body_md: string; cover_url?: string; category: string; tags: string[] }) => void; pending: boolean }) {
  const [title, setTitle] = useState(""); const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState(""); const [body, setBody] = useState("");
  const [cover, setCover] = useState(""); const [category, setCategory] = useState("Naujienos");
  const [tags, setTags] = useState("");
  const [audience, setAudience] = useState<"b2c" | "b2b">("b2c");
  return (
    <Card className="p-6 mt-4 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Antraštė *"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Vasaros tendencijos: 5 spalvos, kurias mylės klientės" /></Field>
        <Field label="Kategorija"><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Naujienos, Tendencijos, Patarimai..." /></Field>
      </div>
      <Field label="Paantraštė"><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
      <Field label="Kam skirtas šis straipsnis? *">
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <Button type="button" className="h-auto whitespace-normal py-2 text-xs" variant={audience === "b2c" ? "default" : "outline"} onClick={() => setAudience("b2c")}>Visiems lankytojams ir klientams</Button>
          <Button type="button" className="h-auto whitespace-normal py-2 text-xs" variant={audience === "b2b" ? "default" : "outline"} onClick={() => setAudience("b2b")}>Verslui ir grožio meistrams</Button>
        </div>
      </Field>
      <Field label="Trumpas anonsas"><Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={300} /></Field>
      <Field label="Nuoroda į viršelio nuotrauką"><Input type="url" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://..." /></Field>
      <Field label="Turinys (markdown) *"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} placeholder={`## Įžanga\n\nParašyk pilną straipsnį naudojant ## antraštes ir - punktus.`} /></Field>
      <Field label="Žymos (kableliais)"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tendencijos, plaukai, 2026" /></Field>
      <Button disabled={!title || !body || pending} onClick={() => onSubmit({ title, subtitle: subtitle || undefined, excerpt: excerpt || undefined, body_md: body, cover_url: cover || undefined, category, tags: [audience, ...tags.split(",").map((s) => s.trim()).filter(Boolean)] })} className="btn-press">
        {pending ? "Skelbiama..." : "Skelbti straipsnį"}
      </Button>
    </Card>
  );
}

function EventForm({ onSubmit, pending }: { onSubmit: (v: { title: string; subtitle?: string; excerpt?: string; body_md: string; cover_url?: string; category: string; event_starts_at: string; event_ends_at?: string; event_location: string; event_price_eur?: number; event_seats?: number }) => void; pending: boolean }) {
  const [title, setTitle] = useState(""); const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState(""); const [body, setBody] = useState("");
  const [cover, setCover] = useState(""); const [starts, setStarts] = useState(""); const [ends, setEnds] = useState("");
  const [location, setLocation] = useState(""); const [price, setPrice] = useState(""); const [seats, setSeats] = useState("");
  return (
    <Card className="p-6 mt-4 space-y-4">
      <Field label="Pavadinimas *"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Seminaras: naujoji nagų technika" /></Field>
      <Field label="Paantraštė"><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Data ir pradžios laikas *"><Input type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
        <Field label="Pabaigos laikas"><Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
      </div>
      <Field label="Vieta *"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Vilnius, Konstitucijos pr. 12" /></Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Kaina (€)"><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="189" /></Field>
        <Field label="Vietų skaičius"><Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} placeholder="20" /></Field>
      </div>
      <Field label="Trumpas anonsas"><Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={300} /></Field>
      <Field label="Viršelio nuotrauka (URL)"><Input type="url" value={cover} onChange={(e) => setCover(e.target.value)} /></Field>
      <Field label="Aprašymas *"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Programa, lektorius, ką gaus dalyviai..." /></Field>
      <Button disabled={!title || !starts || !location || !body || pending}
        onClick={() => onSubmit({
          title, subtitle: subtitle || undefined, excerpt: excerpt || undefined, body_md: body,
          cover_url: cover || undefined, category: "Mokymai",
          event_starts_at: new Date(starts).toISOString(),
          event_ends_at: ends ? new Date(ends).toISOString() : undefined,
          event_location: location,
          event_price_eur: price ? Number(price) : undefined,
          event_seats: seats ? Number(seats) : undefined,
        })}
        className="btn-press">
        {pending ? "Skelbiama..." : "Skelbti renginį"}
      </Button>
    </Card>
  );
}

function PromoForm({ onSubmit, pending }: { onSubmit: (v: { title: string; subtitle?: string; excerpt?: string; body_md: string; cover_url?: string; promo_discount_pct: number; promo_starts_at?: string; promo_ends_at: string; promo_service_ids: string[]; audience: "b2c" | "b2b" }) => void; pending: boolean }) {
  const [title, setTitle] = useState(""); const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState(""); const [body, setBody] = useState("");
  const [cover, setCover] = useState(""); const [pct, setPct] = useState("20");
  const [ends, setEnds] = useState("");
  const [audience, setAudience] = useState<"b2c" | "b2b">("b2c");
  return (
    <Card className="p-6 mt-4 space-y-4">
      <Field label="Pavadinimas *"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="-25% visoms nagų procedūroms iki liepos pabaigos" /></Field>
      <Field label="Paantraštė"><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
      <Field label="Kam skirtas šis pasiūlymas? *">
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <Button type="button" className="h-auto whitespace-normal py-2 text-xs" variant={audience === "b2c" ? "default" : "outline"} onClick={() => setAudience("b2c")}>Klientams (ne verslui)</Button>
          <Button type="button" className="h-auto whitespace-normal py-2 text-xs" variant={audience === "b2b" ? "default" : "outline"} onClick={() => setAudience("b2b")}>Verslui – meistrams ir salonams</Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {audience === "b2c" ? "Bus rodoma viešoje „Specialūs pasiūlymai“ skiltyje." : "Bus rodoma tik profesionalams – „Tiekėjų pasiūlymai“ skiltyje."}
        </p>
      </Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Nuolaida (%) *"><Input type="number" min="1" max="90" value={pct} onChange={(e) => setPct(e.target.value)} /></Field>
        <Field label="Galioja iki *"><Input type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
      </div>
      <Field label="Trumpas anonsas"><Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={300} /></Field>
      <Field label="Viršelio nuotrauka (URL)"><Input type="url" value={cover} onChange={(e) => setCover(e.target.value)} /></Field>
      <Field label="Sąlygos ir detalės *"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Kam taikoma, kada galioja, kaip pasinaudoti..." /></Field>
      <Button disabled={!title || !ends || !body || pending}
        onClick={() => onSubmit({
          title, subtitle: subtitle || undefined, excerpt: excerpt || undefined, body_md: body,
          cover_url: cover || undefined, promo_discount_pct: Number(pct),
          promo_ends_at: new Date(ends).toISOString(),
          promo_service_ids: [], audience,
        })}
        className="btn-press">
        {pending ? "Skelbiama..." : "Skelbti akciją"}
      </Button>
    </Card>
  );
}
