import { createFileRoute } from "@tanstack/react-router";
import { useSection } from "@/lib/use-site-content";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchSuppliers, listSupplierFacets } from "@/lib/suppliers.functions";
import { useAuth } from "@/lib/auth-context";
import { canSee } from "@/lib/access";
import { B2BOnlyNotice } from "@/components/b2b-only-notice";
import { B2BBubbles } from "@/components/b2b-bubbles";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { VerifiedBadge } from "@/components/verified-badge";
import { LT_CITIES } from "@/lib/lt-cities";
import { Package, MapPin, Phone, Mail, SearchX } from "lucide-react";

export const Route = createFileRoute("/tiekejai")({
  component: SuppliersPage,
  head: () => ({
    meta: [
      { title: "Tiekėjų katalogas – paieška pagal produkciją ir brandą" },
      {
        name: "description",
        content: "Uždaras grožio industrijos tiekėjų katalogas verslo paskyroms: rask tiekėją pagal produktą, brandą ar miestą.",
      },
      { property: "og:title", content: "Tiekėjų katalogas" },
      { property: "og:description", content: "Rask tiekėją pagal produkciją – pirštinės, šampūnai, įranga ir kt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function SuppliersPage() {
  const block = useSection("tiekejai", "intro");
  const { role, loading } = useAuth();
  const isBusiness = canSee(role, "suppliers");
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState("all");
  const [city, setCity] = useState("Visi");

  const searchFn = useServerFn(searchSuppliers);
  const facetsFn = useServerFn(listSupplierFacets);

  const facets = useQuery({
    queryKey: ["supplier-facets"],
    queryFn: () => facetsFn(),
    enabled: isBusiness,
    staleTime: 5 * 60_000,
  });

  const results = useQuery({
    queryKey: ["suppliers", q, brand, category, city],
    queryFn: () =>
      searchFn({
        data: {
          q: q.trim() || null,
          brand: brand === "all" ? null : brand,
          category: category === "all" ? null : category,
          city: city === "Visi" ? null : city,
          limit: 40,
        },
      }),
    enabled: isBusiness,
    staleTime: 30_000,
  });

  if (!loading && !isBusiness) {
    return (
      <B2BOnlyNotice
        title="Tiekėjų katalogas skirtas verslo paskyroms"
        description="Tiekėjų katalogas skirtas meistrėms, salonams ir tiekėjams. Skelbikams ir klientams ši skiltis neprieinama."
      />
    );
  }

  const items = results.data?.items ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      <B2BBubbles />

      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-primary">
          <Package className="h-4 w-4" /> Verslas verslui
        </div>
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{block?.title || "Tiekėjų katalogas"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ieškok tiekėjo pagal produkciją — pvz. „guminės pirštinės“ ar konkretaus brando šampūnas. Rasime visus tiekėjus, kurie tai turi.
        </p>
      </div>

      <Card className="mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">Produktas ar brandas</Label>
          <Input className="mt-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pvz. guminės pirštinės" />
        </div>
        <div>
          <Label className="text-xs">Brandas</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Visi brandai</SelectItem>
              {(facets.data?.brands ?? []).map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Kategorija</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Visos kategorijos</SelectItem>
              {(facets.data?.categories ?? []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
      </Card>

      {results.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Tiekėjų nerasta"
          description="Pabandyk kitą produkto pavadinimą, brandą arba miestą."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((s) => (
            <Card key={s.id} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-lg font-semibold">{s.business_name ?? "Tiekėjas"}</h2>
                    <VerifiedBadge status={s.verification_status} />
                  </div>
                  {s.city && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />{s.city}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">{s.product_count} prekės</Badge>
              </div>

              {s.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.bio}</p>}

              {s.brands.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.brands.map((b) => <Badge key={b} variant="secondary" className="text-[10px]">{b}</Badge>)}
                </div>
              )}

              {s.matches.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {s.matches.slice(0, 4).map((m) => (
                    <li key={m.id} className="truncate">• {m.title}{m.brand ? ` · ${m.brand}` : ""}</li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap gap-2 pt-1">
                {s.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`tel:${s.phone}`}><Phone className="mr-1.5 h-3.5 w-3.5" />Skambinti</a>
                  </Button>
                )}
                {s.email && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${s.email}`}><Mail className="mr-1.5 h-3.5 w-3.5" />Rašyti</a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
