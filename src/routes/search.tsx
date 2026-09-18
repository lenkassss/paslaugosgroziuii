import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAvailability, type AvailabilitySalon } from "@/lib/availability.functions";
import { listStandardServices } from "@/lib/services.functions";
import { listBrandsInUse } from "@/lib/provider-brands.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { Search as SearchIcon, Map as MapIcon, List, Clock, SearchX } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { SalonMap } from "@/components/salon-map";
import { MarketCalendar } from "@/components/market-calendar";
import { SalonCard } from "@/components/salon-card";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { ServiceDiscoveryFields } from "@/components/service-discovery-fields";


const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  city: fallback(z.string(), "Visi").default("Visi"),
  category: fallback(z.string(), "Visos").default("Visos"),
  service: fallback(z.string(), "").default(""),
  serviceId: fallback(z.string(), "").default(""),
  brandId: fallback(z.string(), "").default(""),
  date: fallback(z.string(), "").default(""),
  from: fallback(z.string(), "").default(""),
  to: fallback(z.string(), "").default(""),
  onlyAvailable: fallback(z.boolean(), false).default(false),
  type: fallback(z.enum(["all", "master", "salon"]), "all").default("all"),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Grožio salonų paieška su laisvais laikais – PaslaugosGrožiui" },
      { name: "description", content: "Rask salonus, kurie turi laisvą laiką tavo pasirinktą dieną ir valandą. Momentinė rezervacija." },
      { property: "og:title", content: "Rask laisvą laiką grožio salonuose" },
      { property: "og:description", content: "Pasirink miestą, kategoriją ir konkrečią grožio paslaugą vienoje aiškioje paieškoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function SearchPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [view, setView] = useState<"list" | "map">("list");
  const [hovered, setHovered] = useState<string | null>(null);

  const set = <K extends keyof typeof search>(k: K, v: (typeof search)[K]) =>
    navigate({ search: (prev: typeof search) => ({ ...prev, [k]: v }) });

  const { data, isLoading } = useQuery({
    queryKey: ["availability", search],
    queryFn: () => searchAvailability({
      data: {
        query: search.q || undefined,
        city: search.city === "Visi" ? undefined : search.city,
        category: search.category === "Visos" ? undefined : search.category,
        service: search.service || undefined,
        standardServiceId: search.serviceId || undefined,
        brandId: search.brandId || undefined,
        date: search.date || undefined,
        fromTime: search.from || undefined,
        toTime: search.to || undefined,
        onlyAvailable: search.onlyAvailable,
      },
    }),
  });
  const allSalons: AvailabilitySalon[] = data?.salons ?? [];
  const salons: AvailabilitySalon[] =
    search.type === "master"
      ? allSalons.filter((x) => x.kind === "specialist")
      : search.type === "salon"
        ? allSalons.filter((x) => x.kind === "salon")
        : allSalons;

  const { data: brandData } = useQuery({
    queryKey: ["brands-in-use"],
    queryFn: () => listBrandsInUse(),
    staleTime: 5 * 60 * 1000,
  });
  const brandOptions = (brandData?.brands ?? []).map((b) => ({ value: b.id, label: b.name }));
  const { data: stdData } = useQuery({
    queryKey: ["standard-services"],
    queryFn: () => listStandardServices(),
    staleTime: 10 * 60 * 1000,
  });
  const stdServices = stdData?.services ?? [];
  /** Kategorija = URL parametras, kad rezultatai tikrai filtruotųsi. */
  const svcCat = search.category && search.category !== "Visos" ? search.category : "";

  const [showAdvanced, setShowAdvanced] = useState(!!(search.date || search.from || search.to));

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">
      <div data-drag-scroll className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {([
          { v: "all", label: "Visi" },
          { v: "master", label: "Meistrės" },
          { v: "salon", label: "Salonai" },
        ] as const).map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => navigate({ search: (prev) => ({ ...prev, type: o.v }) })}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all active:scale-95 ${
              search.type === o.v
                ? "gradient-gold border-transparent text-primary-foreground shadow-glow"
                : "border-border/60 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Rask laisvą <span className="text-gradient-gold">laiką</span></h1>
          <p className="text-sm text-muted-foreground mt-1">{salons.length} {t("search.results")}{data?.date && ` · ${new Date(data.date + "T00:00:00").toLocaleDateString("lt-LT", { day: "numeric", month: "long" })}`}</p>
        </div>
        <div className="flex gap-2 lg:hidden">
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
          <Button size="sm" variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")}><MapIcon className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card className="p-4 mb-4 border-border/60">
        <ServiceDiscoveryFields
          city={search.city === "Visi" ? "" : search.city}
          category={svcCat}
          serviceId={search.serviceId}
          services={stdServices}
          onCityChange={(city) => navigate({ search: (prev) => ({ ...prev, city: city || "Visi" }) })}
          onCategoryChange={(category) => navigate({ search: (prev) => ({ ...prev, category: category || "Visos", serviceId: "", service: "" }) })}
          onServiceChange={(serviceId) => navigate({ search: (prev) => ({ ...prev, serviceId, service: "" }) })}
        />
        {/* Kalendorius matomas iškart — be jokių papildomų paspaudimų. */}
        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1 text-xs"><Clock className="h-3 w-3 text-primary" />Laisvos dienos</Label>
            {(search.date || search.from) && (
              <button
                type="button"
                onClick={() => navigate({ search: (prev: typeof search) => ({ ...prev, date: "", from: "", to: "" }) })}
                className="text-[11px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Rodyti visą mėnesį
              </button>
            )}
          </div>
          <MarketCalendar
            compact
            city={search.city === "Visi" ? undefined : search.city}
            category={search.category === "Visos" ? undefined : search.category}
            serviceId={search.serviceId || undefined}
            brandId={search.brandId || undefined}
            onPick={(date, time) =>
              navigate({
                search: (prev: typeof search) => ({
                  ...prev,
                  date,
                  from: time ?? "",
                  to: time ? `${String(Number(time.slice(0, 2)) + 2).padStart(2, "0")}:00` : "",
                  onlyAvailable: prev.onlyAvailable || !!(date || time),
                }),
              })
            }
          />
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="mt-3 text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            {showAdvanced ? "Slėpti papildomus filtrus" : "Papildomi filtrai"}
          </button>
        </div>
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-border/60 grid md:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
            <div className="relative md:col-span-1">
              <Label className="text-xs">Salono pavadinimas</Label>
              <div className="relative mt-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Ieškoti..." value={search.q} onChange={(e) => set("q", e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Naudojama produkcija / prekės ženklas</Label>
              <Combobox
                options={brandOptions}
                value={search.brandId}
                onChange={(v) => set("brandId", v)}
                placeholder="Pvz. Olaplex, Victoria Vynn…"
                searchPlaceholder="Ieškoti prekės ženklo…"
                emptyText="Prekės ženklų nerasta."
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={search.onlyAvailable} onCheckedChange={(v) => set("onlyAvailable", v)} id="only-avail" />
              <Label htmlFor="only-avail" className="text-sm cursor-pointer">Tik su laisvomis vietomis</Label>
            </div>
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-[1fr_460px] gap-6">
        <div className={view === "map" ? "hidden lg:block" : ""}>
          <div className="grid sm:grid-cols-2 gap-4">
            {isLoading && Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>
              </Card>
            ))}
            {!isLoading && salons.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={SearchX}
                  title="Pagal pasirinktus filtrus salonų nerasta"
                  description="Pabandyk kitą miestą, paslaugą arba laisvesnį laiką — laisvų vietų atsiranda kelis kartus per dieną."
                />
              </div>
            )}
            {!isLoading && salons.map((s) => (
              <div key={s.id} onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)}>
                <SalonCard salon={s} className={hovered === s.id ? "ring-2 ring-primary" : ""} />
              </div>
            ))}
          </div>
        </div>

        <div className={`${view === "list" ? "hidden lg:block" : ""} lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]`}>
          <Card className="overflow-hidden h-[500px] lg:h-full">
            <SalonMap
              salons={salons.map((s) => ({
                id: s.id,
                business_name: s.business_name,
                city: s.city,
                lat: s.lat,
                lng: s.lng,
                category: s.category,
                cover_url: s.cover_url,
              }))}
              highlightedId={hovered}
              onHighlight={setHovered}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
