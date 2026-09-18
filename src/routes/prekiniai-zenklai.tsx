import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { searchBrandCatalog } from "@/lib/provider-brands.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { CitySelect } from "@/components/city-select";
import { Search, Tag, Users, ArrowRight } from "lucide-react";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";

export const Route = createFileRoute("/prekiniai-zenklai")({
  component: BrandCatalogPage,
  head: () => ({
    meta: [
      { title: "Prekiniai ženklai grožio salonuose · PaslaugosGrožiui" },
      {
        name: "description",
        content: "Ieškok grožio prekinių ženklų pagal pavadinimą ar miestą ir rask meistrus bei salonus, kurie su jais dirba.",
      },
      { property: "og:title", content: "Prekiniai ženklai · PaslaugosGrožiui" },
      { property: "og:description", content: "Kurie meistrai ir salonai dirba su tavo mėgstamu prekiniu ženklu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function BrandCatalogPage() {
  const [q, setQ] = useState("");
  const category = "";
  const [city, setCity] = useState("");
  const [brandId, setBrandId] = useState("");

  const all = useQuery({
    queryKey: ["brand-catalog", "all"],
    queryFn: () => searchBrandCatalog({ data: {} }),
    staleTime: 5 * 60_000,
  });
  const filtered = useQuery({
    queryKey: ["brand-catalog", q, category, city, brandId],
    queryFn: () => searchBrandCatalog({
      data: {
        ...(q ? { q } : {}),
        ...(category ? { category } : {}),
        ...(city && city !== "Visi" ? { city } : {}),
        ...(brandId ? { brandId } : {}),
      },
    }),
    staleTime: 60_000,
  });

  const brands = filtered.data?.brands ?? [];
  const block = useSection("prekiniai-zenklai", "intro");
  const brandOptions = (all.data?.brands ?? []).map((b) => ({ value: b.id, label: b.name }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyclamen">Prekinis ženklas</div>
        <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{block?.title || "Rask meistrą pagal prekinį ženklą"}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {block?.subtitle || "Ieškok pagal ženklo pavadinimą, pasirink ženklą iš sąrašo arba filtruok pagal miestą."}
        </p>
      </div>

      <Card className="mb-8 grid gap-3 p-4 md:grid-cols-3">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pagal pavadinimą</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pvz. OPI"
              className="h-11 rounded-xl pl-9"
            />
          </div>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Prekinis ženklas</div>
          <Combobox
            options={brandOptions}
            value={brandId}
            onChange={setBrandId}
            placeholder="Visi ženklai"
            searchPlaceholder="Ieškoti ženklo..."
            emptyText="Prekės ženklų nerasta."
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Miestas</div>
          <CitySelect value={city} onChange={setCity} className="h-11 rounded-xl bg-background" />
        </div>
      </Card>

      {filtered.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : brands.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <Tag className="mx-auto mb-2 h-8 w-8" />
          Pagal šiuos filtrus ženklų nerasta — pabandyk kitą paiešką.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Card key={b.id} className="flex flex-col gap-3 p-4 transition hover:border-cyclamen/50">
              <div className="flex items-center gap-3">
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className="h-11 w-11 rounded-xl object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-secondary"><Tag className="h-4 w-4" /></span>
                )}
                <div className="min-w-0">
                  <div className="truncate font-display text-lg">{b.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />{b.provider_count} specialist(ų)
                  </div>
                </div>
              </div>
              {(b.categories.length > 0 || b.cities.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {b.categories.slice(0, 3).map((c) => (
                    <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>
                  ))}
                  {b.cities.slice(0, 2).map((c) => (
                    <Badge key={c} variant="outline" className="text-[11px]">{c}</Badge>
                  ))}
                </div>
              )}
              <Button asChild size="sm" variant="outline" className="mt-auto justify-between">
                <Link
                  to="/search"
                  search={{
                    q: "",
                    city: city && city !== "Visi" ? city : "Visi",
                    category: category || "Visos",
                    service: "",
                    brandId: b.id,
                    date: "",
                    from: "",
                    to: "",
                    onlyAvailable: false,
                  } as never}
                >
                  Rodyti specialistus <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
      <SiteBlocks page="prekiniai-zenklai" />
    </div>
  );
}
