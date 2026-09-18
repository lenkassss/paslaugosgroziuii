import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSalonDashboard, updateSalonProfile } from "@/lib/platform.functions";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SingleImageUploader, GalleryUploader } from "@/components/image-uploader";
import { CitySelect } from "@/components/city-select";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { BrandMultiSelect } from "@/components/brand-multi-select";
import { getMyBrands, setMyBrands } from "@/lib/provider-brands.functions";
import { Loader2, Save } from "lucide-react";
import { SalonPoliciesEditor } from "@/components/salon-policies-editor";
import { WorkingHoursEditor } from "@/components/working-hours-editor";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import { useIsPro } from "@/components/pro-gate";
import { SERVICE_CATEGORY_LABELS } from "@/lib/service-taxonomy";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Kind = "salon" | "supplier";

export function ProfileEditor({ kind }: { kind: Kind }) {
  const { isPro } = useIsPro();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["salon-dashboard"], queryFn: () => getSalonDashboard({ data: undefined }) });

  const [f, setF] = useState({
    business_name: "",
    owner_name: "",
    city: "",
    address: "",
    phone: "",
    bio: "",
    category: "",
    avatar_url: "",
    cover_url: "",
    gallery_urls: [] as string[],
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });

  useEffect(() => {
    if (data?.staff) {
      setF({
        business_name: data.staff.staff_name ?? "",
        owner_name: data.profile?.owner_name ?? "",
        city: data.salonProfile?.city ?? "",
        address: "",
        phone: data.profile?.phone ?? data.salonProfile?.phone ?? "",
        bio: data.staff.bio ?? data.profile?.bio ?? "",
        category: data.staff.specialization ?? "",
        avatar_url: data.staff.avatar_url ?? data.profile?.avatar_url ?? "",
        cover_url: "",
        gallery_urls: [],
        lat: undefined,
        lng: undefined,
      });
      return;
    }
    if (data?.profile) {
      setF({
        business_name: data.profile.business_name ?? "",
        owner_name: data.profile.owner_name ?? "",
        city: data.profile.city ?? "",
        address: data.profile.address ?? "",
        phone: data.profile.phone ?? "",
        bio: data.profile.bio ?? "",
        category: data.profile.category ?? "",
        avatar_url: data.profile.avatar_url ?? "",
        cover_url: data.profile.cover_url ?? "",
        gallery_urls: data.profile.gallery_urls ?? [],
        lat: data.profile.lat ?? undefined,
        lng: data.profile.lng ?? undefined,
      });
    }
  }, [data]);

  const upd = useServerFn(updateSalonProfile);
  const mut = useMutation({
    mutationFn: () => upd({ data: f }),
    onSuccess: () => {
      toast.success("Išsaugota");
      qc.invalidateQueries({ queryKey: ["salon-dashboard"] });
    },
    onError: (e) => toastError(e),
  });

  // Product brands used by this provider
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const myBrandsFn = useServerFn(getMyBrands);
  const setBrandsFn = useServerFn(setMyBrands);
  const { data: myBrands } = useQuery({ queryKey: ["my-brands"], queryFn: () => myBrandsFn() });
  useEffect(() => {
    if (myBrands?.brands) setBrandIds(myBrands.brands.map((b) => b.id));
  }, [myBrands]);
  const brandsMut = useMutation({
    mutationFn: (ids: string[]) => setBrandsFn({ data: { brandIds: ids } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-brands"] });
      qc.invalidateQueries({ queryKey: ["brands-in-use"] });
      toast.success("Prekės ženklai išsaugoti");
    },
    onError: (e) => toastError(e),
  });


  // Auto-save gallery/images on change (nuotraukos svarbios — nepamiršti spausti Išsaugoti)
  const saveField = <K extends keyof typeof f>(key: K, val: (typeof f)[K]) => {
    setF((prev) => ({ ...prev, [key]: val }));
  };

  const bizLabel = kind === "supplier" ? "Įmonės pavadinimas" : "Verslo pavadinimas";
  const isStaff = data?.staff != null;

  return (
    <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-6">
      {kind === "salon" && (
        <div className="sticky top-[var(--app-chrome-top)] z-20 -mx-4 max-w-[calc(100%+2rem)] overflow-x-auto border-y border-border/50 bg-background/90 px-4 py-2 backdrop-blur-xl no-scrollbar md:static md:mx-0 md:max-w-full md:rounded-2xl md:border">
          <nav className="flex min-w-max gap-1" aria-label="Profilio skiltys">
            {([
              ["profile-photos", "Nuotraukos"], ["profile-details", "Informacija"], ...(isPro ? [["profile-hours", "Darbo laikas"]] : []),
              ...(!isStaff ? [["profile-policies", "Taisyklės"], ["profile-brands", "Prekės ženklai"]] : []),
            ] as string[][]).map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-full px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">{label}</a>
            ))}
          </nav>
        </div>
      )}
      <Card id="profile-photos" className="scroll-mt-36 p-5">
        <h2 className="font-display text-lg mb-4">Nuotraukos</h2>
        <div className={isStaff ? "max-w-[220px]" : "grid gap-5 md:grid-cols-[220px_1fr]"}>
          <SingleImageUploader
            bucket="avatars"
            value={f.avatar_url}
            onChange={(url) => saveField("avatar_url", url)}
            aspect="square"
            label="Logotipas / avataras"
          />
          {!isStaff && <SingleImageUploader
              bucket="covers"
              value={f.cover_url}
              onChange={(url) => saveField("cover_url", url)}
              aspect="wide"
              label="Viršelio nuotrauka"
            />}
        </div>
        {!isStaff && <div className="mt-5">
          <GalleryUploader
            values={f.gallery_urls}
            onChange={(urls) => saveField("gallery_urls", urls)}
          />
        </div>}
      </Card>

      <Card id="profile-details" className="scroll-mt-36 p-5">
        <h2 className="font-display text-lg mb-4">Pagrindinė informacija</h2>
        {isStaff && <p className="mb-4 text-xs text-muted-foreground">Redaguoji savo meistrės profilį ir asmeninį grafiką salone „{data?.salonProfile?.business_name ?? ""}“.</p>}
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>{isStaff ? "Viešas meistrės vardas" : bizLabel}</Label><Input value={f.business_name} onChange={(e) => saveField("business_name", e.target.value)} /></div>
            <div><Label>Kontaktinis asmuo</Label><Input value={f.owner_name} onChange={(e) => saveField("owner_name", e.target.value)} /></div>
          </div>
          {!isStaff && <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Miestas</Label>
              <CitySelect value={f.city} onChange={(v) => saveField("city", v)} className="h-10" />
            </div>
            <div>
              <Label>Adresas</Label>
              <AddressAutocomplete
                value={f.address}
                city={f.city}
                onChange={(v) => saveField("address", v)}
                onPick={(s) => setF((prev) => ({
                  ...prev,
                  address: s.label,
                  city: s.city || prev.city,
                  lat: s.lat,
                  lng: s.lng,
                }))}
              />
            </div>
          </div>}

          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Telefonas</Label><Input value={f.phone} onChange={(e) => saveField("phone", e.target.value)} /></div>
            <div>
              <Label>{isStaff ? "Specializacija" : "Kategorija"}</Label>
              {kind === "salon" ? (
                <Select value={f.category} onValueChange={(value) => saveField("category", value)}>
                  <SelectTrigger><SelectValue placeholder="Pasirink kategoriją" /></SelectTrigger>
                  <SelectContent>{SERVICE_CATEGORY_LABELS.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={f.category} onChange={(e) => saveField("category", e.target.value)} placeholder="Kosmetika / Įranga / Plaukams" />
              )}
            </div>
          </div>
          <div><Label>Aprašymas</Label><Textarea rows={5} value={f.bio} onChange={(e) => saveField("bio", e.target.value)} /></div>
        </div>
      </Card>

      {!isStaff && <Card id="profile-brands" className="scroll-mt-36 p-5">
        <h2 className="font-display text-lg mb-1">Naudojama produkcija / Prekės ženklai</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Šie prekės ženklai rodomi tavo profilyje ir paieškos kortelėse — klientai gali ieškoti meistrų pagal naudojamą produkciją.
        </p>
        <BrandMultiSelect
          value={brandIds}
          onChange={(ids) => { setBrandIds(ids); brandsMut.mutate(ids); }}
        />
      </Card>}



      {kind === "salon" && !isStaff && (
        <Card className="p-5">
          <h2 className="font-display text-lg mb-4">Vieta žemėlapyje</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Platuma (lat)</Label>
              <Input type="number" step="any" value={f.lat ?? ""} onChange={(e) => saveField("lat", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label>Ilguma (lng)</Label>
              <Input type="number" step="any" value={f.lng ?? ""} onChange={(e) => saveField("lng", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Koordinates gali gauti Google Maps → dešinys pelės klavišas → „What's here?".</p>
        </Card>
      )}

      {kind === "salon" && isPro && <div id="profile-hours" className="scroll-mt-36"><WorkingHoursEditor /></div>}

      {!isStaff && <div id="profile-policies" className="scroll-mt-36"><SalonPoliciesEditor /></div>}

      <div className="sticky bottom-[calc(var(--app-bottom-nav-height)+env(safe-area-inset-bottom)+0.75rem)] z-20 flex justify-end md:bottom-4">

        <Button type="submit" disabled={mut.isPending} size="lg" className="gradient-gold text-primary-foreground btn-press shadow-elegant">
          {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Išsaugoti profilį
        </Button>
      </div>
    </form>
  );
}
