import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  submitClassifiedApplication,
  payForClassified,
  listClassifieds,
  listMyClassifieds,
  deleteClassified,
  type ClassifiedListing,
  revealClassifiedContact,
} from "@/lib/classifieds.functions";
import { purchaseClassifiedHighlight } from "@/lib/addons.functions";
import { Sparkles } from "lucide-react";
import {
  LISTING_KINDS,
  SUBTYPES_BY_KIND,
  SERVICE_CATEGORIES,
  placeTypesFor,
  filterOrder,
  kindLabel,
  subtypeLabel,
  placeLabel,
  serviceLabel,
  type ListingKind,
} from "@/lib/classified-taxonomy";

import { useAuth } from "@/lib/auth-context";
import { useSection } from "@/lib/use-site-content";
import { canSee, TIER_PRICING, eur } from "@/lib/access";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveModal } from "@/components/responsive-modal";
import { EmptyState } from "@/components/empty-state";
import { B2BOnlyNotice } from "@/components/b2b-only-notice";
import { AdvertiserApply } from "@/components/advertiser-apply";
import { B2BBubbles } from "@/components/b2b-bubbles";
import { LT_CITIES } from "@/lib/lt-cities";
import { statusLabel } from "@/lib/role-labels";
import { toast } from "sonner";
import { GalleryUploader } from "@/components/image-uploader";
import { toastError } from "@/lib/error-messages";
import { Megaphone, MapPin, Phone, Mail, Plus, Loader2, SearchX, Trash2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/skelbimai")({
  component: ClassifiedsPage,
  head: () => ({
    meta: [
      { title: "Skelbimai profesionalams – patalpos, įranga, verslas, darbas" },
      {
        name: "description",
        content:
          "Uždara grožio industrijos skelbimų lenta verslo paskyroms: patalpų nuoma, įranga, verslo pardavimas ir darbo skelbimai.",
      },
      { property: "og:title", content: "Grožio industrijos skelbimai" },
      { property: "og:description", content: "Patalpos, įranga, verslas ir darbo skelbimai vienoje vietoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const PERIOD_LABEL: Record<string, string> = { month: "/ mėn.", day: "/ d.", once: "" };

function money(n: number | null) {
  if (n === null || n === undefined) return null;
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function ClassifiedsPage() {
  const intro = useSection("skelbimai", "intro");
  const { role, loading, user } = useAuth();
  const [kind, setKind] = useState<ListingKind>("nuoma");
  const [subtype, setSubtype] = useState<string>("patalpos");
  const [placeType, setPlaceType] = useState<string>("all");
  const [serviceCat, setServiceCat] = useState<string>("all");
  const [city, setCity] = useState<string>("Visi");
  const [q, setQ] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const isBusiness = canSee(role, "classifieds");

  const subtypes = SUBTYPES_BY_KIND[kind];
  const effSubtype = subtypes.length ? subtype : null;
  const order = filterOrder(kind, (effSubtype as never) ?? null);

  const listFn = useServerFn(listClassifieds);
  const listQ = useQuery({
    queryKey: ["classifieds", kind, effSubtype, placeType, serviceCat, city, q],
    queryFn: () =>
      listFn({
        data: {
          kind,
          subtype: (effSubtype as never) ?? null,
          place_type: (order.includes("place") && placeType !== "all" ? placeType : null) as never,
          service_category: (order.includes("service") && serviceCat !== "all" ? serviceCat : null) as never,
          city: order.includes("city") && city !== "Visi" ? city : null,
          q: q.trim() || null,
          limit: 60,
        },
      }),
    enabled: isBusiness,
    staleTime: 30_000,
  });

  if (!loading && !isBusiness) {
    return (
      <>
        <B2BOnlyNotice
          title="Skelbimų lenta skirta verslo paskyroms"
          description="Patalpų nuoma, įranga, verslo ir darbo skelbimai prieinami tik meistrėms, salonams, tiekėjams, mokykloms ir patvirtintiems skelbikams. Prisijunk su profesionalo paskyra arba užsiregistruok."
        />
        {user && <div className="px-4 pb-16">{<AdvertiserApply />}</div>}
      </>
    );
  }


  const items = listQ.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <B2BBubbles />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
            <Megaphone className="h-4 w-4" /> Uždara skelbimų lenta
          </div>
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">{intro?.title || "Skelbimai — nuoma, pardavimai, darbas"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {intro?.subtitle || "Patalpų ir įrangos nuoma, pardavimai, verslo perleidimas ir darbo skelbimai — tik grožio industrijos profesionalams."}
          </p>
        </div>
        <Button onClick={() => setOpenForm(true)} className="btn-press">
          <Plus className="mr-2 h-4 w-4" /> Pateikti skelbimą · nuo {eur(200)}
        </Button>
      </div>

      {/* 1 lygis — skelbimo tipas */}
      <div className="mb-3 flex flex-wrap gap-2">
        {LISTING_KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => {
              setKind(k.key);
              setSubtype(SUBTYPES_BY_KIND[k.key][0] ?? "");
              setPlaceType("all");
              setServiceCat("all");
            }}
            className={`h-10 rounded-full border px-4 text-sm font-medium transition active:scale-95 ${
              kind === k.key ? "gradient-gold border-transparent text-primary-foreground shadow-elegant" : "border-border/60 bg-background/60"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* 2 lygis — potipis */}
      {subtypes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {subtypes.map((s) => (
            <button
              key={s}
              onClick={() => { setSubtype(s); setPlaceType("all"); setServiceCat("all"); }}
              className={`h-9 rounded-full border px-3.5 text-xs font-medium transition active:scale-95 ${
                subtype === s ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background/60 text-muted-foreground"
              }`}
            >
              {subtypeLabel(s)}
            </button>
          ))}
        </div>
      )}

      {/* 3 lygis — miestas / patalpos tipas / paslaugų sritis pagal schemą */}
      <Card className="mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {order.includes("city") && (
          <div>
            <Label className="text-xs">Miestas</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="Visi">Visi miestai</SelectItem>
                {LT_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {order.includes("place") && (
          <div>
            <Label className="text-xs">Patalpos tipas</Label>
            <Select value={placeType} onValueChange={setPlaceType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visi tipai</SelectItem>
                {placeTypesFor(kind).map((p) => <SelectItem key={p} value={p}>{placeLabel(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {order.includes("service") && (
          <div>
            <Label className="text-xs">Paslaugų sritis</Label>
            <Select value={serviceCat} onValueChange={setServiceCat}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">Visos sritys</SelectItem>
                {SERVICE_CATEGORIES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-xs">Paieška</Label>
          <Input className="mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pvz. kabinetas, lazeris…" />
        </div>
      </Card>


      {listQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Skelbimų nerasta"
          description="Pabandyk kitą kategoriją arba miestą. Naują skelbimą patvirtina administratorius per kelias valandas."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => <ListingCard key={it.id} item={it} />)}
        </div>
      )}

      <MyListings />
      <NewListingModal open={openForm} onOpenChange={setOpenForm} />
    </div>
  );
}

function ListingCard({ item }: { item: ClassifiedListing }) {
  const reveal = useServerFn(revealClassifiedContact);
  const [contacts, setContacts] = useState<{ contact_phone: string | null; contact_email: string | null } | null>(null);
  const [revealing, setRevealing] = useState(false);
  const chips = [
    kindLabel(item.listing_kind),
    subtypeLabel(item.subtype),
    placeLabel(item.place_type),
    serviceLabel(item.service_category),
  ].filter(Boolean) as string[];
  const price = money(item.price);

  const doReveal = async () => {
    setRevealing(true);
    try {
      const res = await reveal({ data: { id: item.id } });
      setContacts({ contact_phone: res.contact_phone, contact_email: res.contact_email });
    } catch (e) {
      toastError(e);
    } finally {
      setRevealing(false);
    }
  };

  return (
    <Card
      className={`flex h-full flex-col overflow-hidden rounded-2xl transition-all hover:shadow-elegant ${
        item.is_highlighted ? "ring-2 ring-primary/70 shadow-glow" : ""
      }`}
    >
      {item.images[0] && (
        <img src={item.images[0]} alt={item.title} loading="lazy" className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-1">
          {chips.map((c) => (
            <Badge key={c} variant="outline" className="w-fit text-[10px]">{c}</Badge>
          ))}
          {item.is_highlighted && <Badge className="text-[10px]">Paryškinta</Badge>}
        </div>

        <h2 className="font-display text-lg font-semibold leading-tight">{item.title}</h2>
        {item.description && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {item.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.city}</span>}
          {price && (
            <span className="font-semibold text-foreground">
              {price} {PERIOD_LABEL[item.price_period ?? "once"] ?? ""}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2 pt-1">
          {!contacts && (item.contact_phone || item.contact_email) && (
            <Button size="sm" variant="outline" onClick={doReveal} disabled={revealing}>
              {revealing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Phone className="mr-1.5 h-3.5 w-3.5" />}
              Rodyti kontaktus
            </Button>
          )}
          {contacts?.contact_phone && (
            <Button size="sm" variant="outline" asChild>
              <a href={`tel:${contacts.contact_phone}`}><Phone className="mr-1.5 h-3.5 w-3.5" />{contacts.contact_phone}</a>
            </Button>
          )}
          {contacts?.contact_email && (
            <Button size="sm" variant="outline" asChild>
              <a href={`mailto:${contacts.contact_email}`}><Mail className="mr-1.5 h-3.5 w-3.5" />Rašyti</a>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function MyListings() {
  const qc = useQueryClient();
  const mineFn = useServerFn(listMyClassifieds);
  const payFn = useServerFn(payForClassified);
  const delFn = useServerFn(deleteClassified);
  const mine = useQuery({ queryKey: ["my-classifieds"], queryFn: () => mineFn(), retry: false });

  const pay = useMutation({
    mutationFn: (id: string) => payFn({ data: { id, card_last4: "4242" } }),
    onSuccess: () => { toast.success("Mokėjimas gautas — skelbimas keliauja tvirtinti."); qc.invalidateQueries({ queryKey: ["my-classifieds"] }); },
    onError: (e) => toastError(e),
  });
  const highlightFn = useServerFn(purchaseClassifiedHighlight);
  const highlight = useMutation({
    mutationFn: (id: string) => highlightFn({ data: { id, weeks: 1 } }),
    onSuccess: () => { toast.success("Skelbimas paryškintas savaitei (demo)."); qc.invalidateQueries({ queryKey: ["my-classifieds"] }); qc.invalidateQueries({ queryKey: ["classifieds"] }); },
    onError: (e) => toastError(e),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { toast.success("Skelbimas ištrintas"); qc.invalidateQueries({ queryKey: ["my-classifieds"] }); qc.invalidateQueries({ queryKey: ["classifieds"] }); },
    onError: (e) => toastError(e),
  });

  const items = mine.data?.items ?? [];
  if (items.length === 0) return null;

  return (
    <Card className="mt-10 p-4">
      <h2 className="font-display text-xl">Mano skelbimai</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Skelbimas paskelbiamas viešai tik po apmokėjimo ({eur(TIER_PRICING.classified.cents)}) ir administratoriaus patvirtinimo.
      </p>
      <div className="mt-3 divide-y">
        {items.map((it) => (
          <div key={it.id} className="flex flex-wrap items-center gap-2 py-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{it.title}</div>
              <div className="text-xs text-muted-foreground">
                {[kindLabel(it.listing_kind), subtypeLabel(it.subtype), serviceLabel(it.service_category)].filter(Boolean).join(" · ")}
                {it.rejection_note ? ` · ${it.rejection_note}` : ""}
              </div>
            </div>
            <Badge variant={it.status === "approved" ? "default" : it.status === "rejected" ? "destructive" : "secondary"}>
              {it.status === "pending_approval" ? "Tvirtinama" : statusLabel(it.status)}
            </Badge>
            <Badge variant="outline">{it.payment_status === "paid" ? "Apmokėta" : "Neapmokėta"}</Badge>
            {it.payment_status !== "paid" && (
              <Button size="sm" disabled={pay.isPending} onClick={() => pay.mutate(it.id)}>
                Apmokėti {eur(TIER_PRICING.classified.cents)}
              </Button>
            )}
            {it.payment_status === "paid" && (
              <Button size="sm" variant="outline" disabled={highlight.isPending} onClick={() => highlight.mutate(it.id)}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Paryškinti {eur(TIER_PRICING.highlight.cents)}
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={remove.isPending} onClick={() => remove.mutate(it.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewListingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const submit = useServerFn(submitClassifiedApplication);
  const [kind, setKind] = useState<ListingKind>("nuoma");
  const [subtype, setSubtype] = useState<string>("patalpos");
  const [placeType, setPlaceType] = useState<string>("kabinetas");
  const [serviceCat, setServiceCat] = useState<string>("plaukai");
  const [applicant, setApplicant] = useState("");
  const [personType, setPersonType] = useState<"individual" | "legal">("individual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("Vilnius");
  const [price, setPrice] = useState("");
  const [period, setPeriod] = useState<"month" | "day" | "once">("month");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [touched, setTouched] = useState(false);
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (applicant.trim().length < 3) e.applicant = "Įrašykite vardą, pavardę arba įmonės pavadinimą (bent 3 simboliai).";
    if (title.trim().length < 3) e.title = "Pavadinimas — bent 3 simboliai.";
    if (description.trim().length < 10) e.description = `Aprašymas — bent 10 simbolių (dabar ${description.trim().length}).`;
    if (phone.trim().length < 6) e.phone = "Įrašykite telefono numerį (bent 6 simboliai).";
    if (!/.+@.+\..+/.test(email)) e.email = "Įrašykite tikrą el. pašto adresą.";
    return e;
  }, [title, applicant, description, phone, email]);
  const valid = Object.keys(errors).length === 0;
  const fieldError = (key: string) =>
    touched && errors[key] ? <p className="mt-1 text-xs text-destructive">{errors[key]}</p> : null;

  const mut = useMutation({
    mutationFn: () =>
      submit({
        data: {
          listing_kind: kind,
          subtype: (SUBTYPES_BY_KIND[kind].length ? subtype : null) as never,
          place_type: (subtype === "patalpos" ? placeType : null) as never,
          service_category: (subtype === "verslas" ? null : serviceCat) as never,
          applicant_name: applicant.trim(),
          person_type: personType,
          contact_phone: phone.trim(),
          contact_email: email.trim(),
          social_links: social.trim() || undefined,
          title: title.trim(),
          description: description.trim(),
          city,
          price: price ? Number(price.replace(",", ".")) : null,
          price_period: period,
          images,
        },
      }),

    onSuccess: () => {
      toast.success("Paraiška pateikta! Apmokėk skelbimą ir jį patvirtins administratorius.");
      onOpenChange(false);
      setTitle(""); setDescription(""); setPrice(""); setImages([]);
      qc.invalidateQueries({ queryKey: ["my-classifieds"] });
    },
    onError: (e) => toastError(e),
  });

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Skelbimo paraiška">
      <div className="space-y-3">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Paskelbimas — {eur(TIER_PRICING.classified.cents)}
          </span>
          <p className="mt-1">Skelbimas viešai matomas tik po apmokėjimo ir administratoriaus patvirtinimo.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Skelbimo tipas</Label>
            <Select value={kind} onValueChange={(v) => { setKind(v as ListingKind); setSubtype(SUBTYPES_BY_KIND[v as ListingKind][0] ?? ""); }}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LISTING_KINDS.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {SUBTYPES_BY_KIND[kind].length > 0 && (
            <div>
              <Label className="text-xs">Ko ieškote / siūlote</Label>
              <Select value={subtype} onValueChange={setSubtype}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pasirinkite" /></SelectTrigger>
                <SelectContent>
                  {SUBTYPES_BY_KIND[kind].map((s) => (
                    <SelectItem key={s} value={s}>{subtypeLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {subtype === "patalpos" && (
            <div>
              <Label className="text-xs">Patalpos tipas</Label>
              <Select value={placeType} onValueChange={setPlaceType}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pasirinkite" /></SelectTrigger>
                <SelectContent>
                  {placeTypesFor(kind).map((p) => <SelectItem key={p} value={p}>{placeLabel(p)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {subtype !== "verslas" && (
            <div>
              <Label className="text-xs">Paslaugų sritis</Label>
              <Select value={serviceCat} onValueChange={setServiceCat}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pasirinkite" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {SERVICE_CATEGORIES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Asmens statusas</Label>
            <Select value={personType} onValueChange={(v) => setPersonType(v as typeof personType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Fizinis asmuo</SelectItem>
                <SelectItem value="legal">Juridinis asmuo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>


        <div>
          <Label className="text-xs">Vardas, pavardė / įmonės pavadinimas *</Label>
          <Input className="mt-1" value={applicant} maxLength={120} aria-invalid={touched && !!errors.applicant} onChange={(e) => setApplicant(e.target.value)} placeholder="Pvz. Rasa Petraitienė" />
          {fieldError("applicant")}
        </div>
        <div>
          <Label className="text-xs">Pavadinimas *</Label>
          <Input className="mt-1" value={title} maxLength={120} aria-invalid={touched && !!errors.title} onChange={(e) => setTitle(e.target.value)} placeholder="Pvz. Kabinetas nuomai Vilniaus centre" />
          {fieldError("title")}
        </div>
        <div className="rounded-xl border border-border p-3">
          <Label className="text-xs">Nuotraukos (rekomenduojame bent 5)</Label>
          <div className="mt-2"><GalleryUploader values={images} onChange={setImages} /></div>
        </div>
        <div>
          <Label className="text-xs">Aprašymas *</Label>
          <Textarea className="mt-1" rows={4} maxLength={4000} aria-invalid={touched && !!errors.description} value={description} onChange={(e) => setDescription(e.target.value)} />
          {fieldError("description")}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Miestas</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                {LT_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div>
              <Label className="text-xs">Kaina, €</Label>
              <Input className="mt-1" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
            </div>
            <div>
              <Label className="text-xs">Periodas</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <SelectTrigger className="mt-1 w-[110px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">/ mėn.</SelectItem>
                  <SelectItem value="day">/ dieną</SelectItem>
                  <SelectItem value="once">Vienkartinė</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Telefonas *</Label>
            <Input className="mt-1" value={phone} maxLength={40} aria-invalid={touched && !!errors.phone} onChange={(e) => setPhone(e.target.value)} placeholder="+370…" />
            {fieldError("phone")}
          </div>
          <div>
            <Label className="text-xs">El. paštas *</Label>
            <Input className="mt-1" type="email" value={email} maxLength={120} aria-invalid={touched && !!errors.email} onChange={(e) => setEmail(e.target.value)} />
            {fieldError("email")}
          </div>
        </div>
        <div>
          <Label className="text-xs">Socialiniai tinklai (nebūtina)</Label>
          <Input className="mt-1" value={social} maxLength={300} onChange={(e) => setSocial(e.target.value)} placeholder="instagram.com/…" />
        </div>

        {touched && !valid && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            Paraiška nepateikta — užpildykite pažymėtus laukus (žymėti *).
          </div>
        )}

        <Button
          onClick={() => { setTouched(true); if (valid) mut.mutate(); }}
          disabled={mut.isPending}
          className="w-full btn-press"
        >
          {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pateikti paraišką
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Pateikdami sutinkate su <Link to="/taisykles" className="underline">skelbimų taisyklėmis</Link>.
        </p>
      </div>
    </ResponsiveModal>
  );
}
