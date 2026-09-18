import { createFileRoute, Link } from "@tanstack/react-router";
import { infiniteQueryOptions, useInfiniteQuery, useQuery, useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { listEvents } from "@/lib/content.functions";
import { listBrandsInUse } from "@/lib/provider-brands.functions";
import { LT_CITIES } from "@/lib/lt-cities";
import { SERVICE_CATEGORIES } from "@/lib/classified-taxonomy";
import { Combobox } from "@/components/ui/combobox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, ArrowRight, Lock } from "lucide-react";
import { useState } from "react";
import { InfiniteSentinel } from "@/components/feed/infinite-sentinel";
import { GridSkeleton } from "@/components/feed/feed-skeletons";
import { useAuth } from "@/lib/auth-context";

const LIMIT = 12;
const opts = infiniteQueryOptions({
  queryKey: ["events", "upcoming"],
  queryFn: ({ pageParam }) => listEvents({ data: { upcomingOnly: true, page: pageParam as number, limit: LIMIT } }),
  initialPageParam: 0,
  getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  staleTime: 60_000,
  gcTime: 30 * 60_000,
});

/** Mokymų kalendorius: paieška pagal prekės ženklą, miestą, sritį; horizontas 3 arba 6 mėn. */
const filteredOpts = (brandId: string, monthsAhead: number, city: string, category: string) => infiniteQueryOptions({
  queryKey: ["events", "filtered", brandId, monthsAhead, city, category],
  queryFn: ({ pageParam }) => listEvents({ data: {
    upcomingOnly: true, page: pageParam as number, limit: LIMIT, monthsAhead,
    ...(brandId ? { brandId } : {}),
    ...(city ? { city } : {}),
    ...(category ? { category } : {}),
  } }),
  initialPageParam: 0,
  getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  staleTime: 60_000,
});

export const Route = createFileRoute("/feed/renginiai")({
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(opts),
  component: EventsFeed,
  head: () => ({
    meta: [
      { title: "Seminarai ir mokymai · PaslaugosGrožiui" },
      { name: "description", content: "Grožio industrijos mokymai, seminarai ir renginiai. Registruokis ir kelk kvalifikaciją." },
      { property: "og:title", content: "Seminarai ir mokymai · PaslaugosGrožiui" },
      { property: "og:description", content: "Grožio industrijos renginiai visoje Lietuvoje." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function fmtEventDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("lt-LT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function EventsFeed() {
  const [brandId, setBrandId] = useState("");
  const [months, setMonths] = useState(3);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const hasFilter = !!brandId || !!city || !!category || months !== 3;

  const baseQ = useSuspenseInfiniteQuery(opts);
  const filtQ = useInfiniteQuery({ ...filteredOpts(brandId, months, city, category), enabled: hasFilter });
  const q = hasFilter ? filtQ : baseQ;

  const { data: brandData } = useQuery({
    queryKey: ["brands-in-use"],
    queryFn: () => listBrandsInUse(),
    staleTime: 5 * 60_000,
  });

  const { user, loading } = useAuth();
  const pages = q.data?.pages ?? [];
  const items = pages.flatMap((p) => p.events);
  const authors = Object.assign({}, ...pages.map((p) => p.authors));

  const locked = !loading && !user;

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8 relative">
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium">Mokymai · Seminarai</div>
        <h1 className="mt-2 font-display text-4xl font-semibold">Mokymų kalendorius</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">Tiekėjų, salonų ir akademijų seminarai 3–6 mėn. į priekį.</p>
      </div>

      <Card className="mb-8 grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Miestas</div>
          <Combobox
            options={LT_CITIES.map((c) => ({ value: c, label: c }))}
            value={city}
            onChange={setCity}
            placeholder="Visi miestai"
            searchPlaceholder="Ieškoti miesto"
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Paslaugų sritis</div>
          <Combobox
            options={SERVICE_CATEGORIES.map((c) => ({ value: c.label, label: c.label }))}
            value={category}
            onChange={setCategory}
            placeholder="Visos sritys"
            searchPlaceholder="Ieškoti srities"
            className="h-11 rounded-xl bg-background"
          />
        </div>
        <div className="self-end">
          <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Laikotarpis</div>
          <div className="inline-flex rounded-xl border border-border p-1">
            {[3, 6].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${months === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m} mėn.
              </button>
            ))}
          </div>
        </div>
      </Card>


      {items.length === 0 && !locked && !q.isFetching && (
        <div className="text-center py-24 text-muted-foreground">
          {hasFilter ? "Pagal pasirinktus filtrus mokymų nerasta." : "Kol kas nėra artimų mokymų."}
        </div>
      )}


      <div className={locked ? "relative" : ""}>
        <div className={locked ? "pointer-events-none select-none blur-sm" : ""} aria-hidden={locked}>
          <div className="grid md:grid-cols-2 gap-5">
            {(locked && items.length === 0 ? PLACEHOLDER_EVENTS : items).map((e: any) => {
              const author = authors[e.author_id];
              return (
                <Card key={e.id} className="overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-elegant transition-all group">
                  {locked ? (
                    <EventCardBody e={e} author={author} />
                  ) : (
                    <Link to="/article/$slug" params={{ slug: e.slug }} className="block">
                      <EventCardBody e={e} author={author} />
                    </Link>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {locked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Card className="max-w-md text-center p-8 border-primary/40 shadow-elegant bg-background/95 backdrop-blur">
              <div className="mx-auto h-12 w-12 rounded-full gradient-gold flex items-center justify-center mb-3">
                <Lock className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl">Renginiai — tik nariams</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Prisijunk arba užsiregistruok, kad galėtum peržiūrėti seminarus, meistriškumo klases ir užsiregistruoti į renginius.
              </p>
              <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild className="gradient-gold text-primary-foreground">
                  <Link to="/auth" search={{ mode: "signup" }}>Registruotis</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/auth" search={{ mode: "signin" }}>Prisijungti</Link>
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {!locked && q.isFetchingNextPage && <div className="mt-6"><GridSkeleton count={4} cols="md:grid-cols-2" /></div>}
      {!locked && (
        <InfiniteSentinel
          hasNextPage={!!q.hasNextPage}
          isFetchingNextPage={q.isFetchingNextPage}
          fetchNextPage={() => q.fetchNextPage()}
        />
      )}
    </div>
  );
}

function EventCardBody({ e, author }: { e: any; author: any }) {
  return (
    <>
      {e.cover_url && (
        <div className="aspect-[16/9] overflow-hidden bg-muted relative">
          <img src={e.cover_url} alt={e.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="gradient-gold text-primary-foreground border-0">
              <Calendar className="h-3 w-3 mr-1" />Renginys
            </Badge>
            {e.event_price_eur !== null && Number(e.event_price_eur) > 0 && (
              <Badge className="bg-background/90 text-foreground border-primary/30 backdrop-blur">{Number(e.event_price_eur).toFixed(0)} €</Badge>
            )}
          </div>
        </div>
      )}
      <div className="p-5">
        <div className="text-xs text-primary font-semibold flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> {e.event_starts_at && fmtEventDate(e.event_starts_at)}
        </div>
        <h3 className="mt-2 font-display text-xl font-semibold leading-snug group-hover:text-primary transition">{e.title}</h3>
        {e.subtitle && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{e.subtitle}</p>}
        <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex flex-col gap-1 min-w-0">
            {e.event_location && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{e.event_location}</span>}
            {e.event_seats && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.event_seats} vietos</span>}
          </div>
          <Button size="sm" variant="outline" className="border-primary/40 text-primary shrink-0">
            Sužinoti daugiau <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        {author && <div className="mt-3 text-xs text-muted-foreground">Organizuoja: <span className="text-foreground font-medium">{author.business_name}</span></div>}
      </div>
    </>
  );
}

const PLACEHOLDER_EVENTS = [
  { id: "p1", slug: "#", title: "Manikiūro meistriškumo klasė", subtitle: "Praktiniai užsiėmimai su patyrusia meistre", event_starts_at: new Date(Date.now() + 7 * 86400000).toISOString(), event_location: "Vilnius", event_seats: 12, event_price_eur: 89, cover_url: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800" },
  { id: "p2", slug: "#", title: "Kirpėjų seminaras — 2026 trendai", subtitle: "Naujausios technikos ir stiliai", event_starts_at: new Date(Date.now() + 14 * 86400000).toISOString(), event_location: "Kaunas", event_seats: 30, event_price_eur: 149, cover_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800" },
  { id: "p3", slug: "#", title: "Kosmetologės sertifikavimo kursai", subtitle: "Sertifikuoti mokymai", event_starts_at: new Date(Date.now() + 21 * 86400000).toISOString(), event_location: "Klaipėda", event_seats: 20, event_price_eur: 299, cover_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800" },
  { id: "p4", slug: "#", title: "Blakstienų priauginimo intensyvas", subtitle: "Nuo pagrindų iki eksperto lygio", event_starts_at: new Date(Date.now() + 28 * 86400000).toISOString(), event_location: "Šiauliai", event_seats: 8, event_price_eur: 199, cover_url: "https://images.unsplash.com/photo-1583001809873-a128495da465?w=800" },
];
