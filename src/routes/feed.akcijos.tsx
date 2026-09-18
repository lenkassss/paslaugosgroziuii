import { createFileRoute, Link } from "@tanstack/react-router";
import { infiniteQueryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { listPromos } from "@/lib/content.functions";
import { listBrandsInUse } from "@/lib/provider-brands.functions";
import { SERVICE_CATEGORIES } from "@/lib/classified-taxonomy";
import { Combobox } from "@/components/ui/combobox";
import { CitySelect } from "@/components/city-select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag, Clock, ArrowRight, Flame, Search } from "lucide-react";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";
import { useState } from "react";
import { InfiniteSentinel } from "@/components/feed/infinite-sentinel";
import { GridSkeleton } from "@/components/feed/feed-skeletons";
import { useAuth } from "@/lib/auth-context";
import { worldFor } from "@/lib/access";

const LIMIT = 12;

/** Klientams (`b2c`) rodome tik salonų ir meistrių pasiūlymus; verslui – visus. */
const promoOpts = (audience: "b2c" | "b2b", brandId = "", category = "", city = "") => infiniteQueryOptions({
  queryKey: ["promos", audience, brandId, category, city],
  queryFn: ({ pageParam }) => listPromos({ data: {
    activeOnly: true, page: pageParam as number, limit: LIMIT, audience,
    ...(brandId ? { brandId } : {}),
    ...(category ? { category } : {}),
    ...(city ? { city } : {}),
  } }),
  initialPageParam: 0,
  getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  staleTime: 60_000,
  gcTime: 30 * 60_000,
});

export const Route = createFileRoute("/feed/akcijos")({
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(promoOpts("b2c")),
  component: PromosFeed,

  head: () => ({
    meta: [
      { title: "Grožio akcijos ir nuolaidos · PaslaugosGrožiui" },
      { name: "description", content: "Aktyvūs salonų ir meistrų pasiūlymai, sezoninės nuolaidos grožio procedūroms." },
      { property: "og:title", content: "Grožio akcijos · PaslaugosGrožiui" },
      { property: "og:description", content: "Salonų ir meistrų nuolaidos bei specialūs pasiūlymai vienoje vietoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function daysLeft(iso: string | null) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  const d = Math.max(0, Math.ceil(diff / 86400000));
  return d;
}

function PromosFeed() {
  const { role } = useAuth();
  const business = worldFor(role) === "b2b";
  const block = useSection("akcijos", "intro");
  const audience: "b2c" | "b2b" = business ? "b2b" : "b2c";
  const [brandId, setBrandId] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const q = useInfiniteQuery(promoOpts(audience, business ? brandId : "", category, city === "Visi" ? "" : city));

  const { data: brandData } = useQuery({
    queryKey: ["brands-in-use"],
    queryFn: () => listBrandsInUse(),
    enabled: business,
    staleTime: 5 * 60_000,
  });

  const pages = q.data?.pages ?? [];
  const items = pages.flatMap((p) => p.promos);
  const authors = Object.assign({}, ...pages.map((p) => p.authors));


  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">Specialūs pasiūlymai</div>
        <h1 className="mt-2 font-display text-4xl font-semibold">{block?.title || (<>Šiuo metu galiojantys <span className="text-gradient-gold">pasiūlymai</span></>)}</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          {block?.subtitle || (business
            ? "Salonų, meistrų ir tiekėjų pasiūlymai. Ieškok pagal prekės ženklą arba paslaugų sritį."
            : "Salonų ir meistrų nuolaidos bei specialūs pasiūlymai.")}
        </p>
      </div>

      {/* Paieška: pagal paslaugą ir miestą (visiems), pagal prekės ženklą – verslui */}
      <Card className="mb-8 grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Paslauga</div>
          <Combobox
            options={SERVICE_CATEGORIES.map((c) => ({ value: c.label, label: c.label }))}
            value={category}
            onChange={setCategory}
            placeholder="Visos paslaugos"
            searchPlaceholder="Ieškoti paslaugos"
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Miestas</div>
          <CitySelect value={city} onChange={setCity} className="h-11 rounded-xl bg-background" />
        </div>
        {business && (
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Prekės ženklas</div>
            <Combobox
              options={(brandData?.brands ?? []).map((b) => ({ value: b.id, label: b.name }))}
              value={brandId}
              onChange={setBrandId}
              placeholder="Visi ženklai"
              searchPlaceholder="Ieškoti ženklo"
              emptyText="Prekės ženklų nerasta."
              className="h-11 rounded-xl bg-background"
            />
          </div>
        )}
        <Button
          variant="outline"
          className="h-11 self-end"
          onClick={() => { setBrandId(""); setCategory(""); setCity(""); }}
          disabled={!(brandId || category || city)}
        >
          <Search className="mr-2 h-4 w-4" /> Išvalyti
        </Button>
      </Card>

      {items.length === 0 && !q.isFetching && (
        <div className="text-center py-24 text-muted-foreground">
          {brandId || category || city ? "Pagal pasirinktus filtrus pasiūlymų nerasta." : "Šiuo metu aktyvių pasiūlymų nėra."}
        </div>
      )}




      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((p) => {
          const author = authors[p.author_id];
          const left = daysLeft(p.promo_ends_at);
          const urgent = left !== null && left <= 3;
          return (
            <Card key={p.id} className="overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-elegant transition-all group relative">
              {urgent && (
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-destructive text-destructive-foreground border-0 animate-pulse"><Flame className="h-3 w-3 mr-1" />Baigiasi</Badge>
                </div>
              )}
              <Link to="/article/$slug" params={{ slug: p.slug }} className="block">
                {p.cover_url && (
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <div className="font-display font-bold text-4xl text-gradient-gold drop-shadow">-{p.promo_discount_pct}%</div>
                      <Badge variant="outline" className="border-primary/40 text-primary bg-background/80 backdrop-blur">
                        <Tag className="h-3 w-3 mr-1" />Akcija
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold leading-snug group-hover:text-primary transition">{p.title}</h3>
                  {p.excerpt && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>}

                  <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {left !== null ? `dar ${left} d.` : "neribotai"}
                    </div>
                    <Button size="sm" variant="outline" className="border-primary/40 text-primary">
                      Užsisakyti <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  {author && <div className="mt-3 text-xs text-muted-foreground truncate">{author.business_name} · {author.city}</div>}
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      {q.isFetchingNextPage && <div className="mt-6"><GridSkeleton count={6} cols="sm:grid-cols-2 lg:grid-cols-3" /></div>}
      <InfiniteSentinel
        hasNextPage={!!q.hasNextPage}
        isFetchingNextPage={q.isFetchingNextPage}
        fetchNextPage={() => q.fetchNextPage()}
      />
      <SiteBlocks page="akcijos" />
    </div>

  );
}
