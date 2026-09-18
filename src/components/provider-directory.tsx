import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProviders, type ProviderCard } from "@/lib/providers.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CitySelect } from "@/components/city-select";
import { MapPin, Sparkles, Search, Lock, BadgeCheck, CalendarCheck } from "lucide-react";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";

/**
 * Salonų / individualių meistrų katalogas: visi profiliai, kuriuos galima naršyti.
 * PRO narystę turintys profiliai atsidaro (galima registruotis), be PRO – tik informacija.
 */
export function ProviderDirectory({ kind, title, lead }: { kind: "salon" | "specialist"; title: string; lead: string }) {
  const page = kind === "salon" ? "salonai" : "meistrai";
  const block = useSection(page, "intro");
  const fn = useServerFn(listProviders);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const query = useQuery({
    queryKey: ["providers", kind, city],
    queryFn: () => fn({ data: { kind, city: city || undefined } }),
    staleTime: 60_000,
  });

  const all = query.data?.providers ?? [];
  const needle = q.trim().toLowerCase();
  const list = needle
    ? all.filter((p) =>
        [p.business_name, p.owner_name, p.category, p.city, ...p.brands, ...p.services.map((s) => s.name)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle)),
      )
    : all;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
      <h1 className="font-display text-3xl leading-tight md:text-4xl">{block?.title || title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{block?.subtitle || lead}</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ieškoti pavadinimo, paslaugos, prekės ženklo…"
            className="h-11 bg-background pl-9"
          />
        </div>
        <CitySelect value={city} onChange={setCity} placeholder="Visi miestai" className="h-11" />
      </div>

      {query.isLoading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card className="mt-6 p-12 text-center text-muted-foreground">Pagal šią paiešką profilių nerasta.</Card>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProviderTile key={p.id} p={p} />
          ))}
        </div>
      )}
      <SiteBlocks page={page} />
    </div>
  );
}

function ProviderTile({ p }: { p: ProviderCard }) {
  const photo = p.gallery_urls?.[0] ?? p.cover_url ?? p.avatar_url ?? null;
  const body = (
    <Card
      className={`h-full overflow-hidden border-border/60 transition-all ${
        p.canBook ? "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elegant" : "opacity-95"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {photo ? (
          <img src={photo} alt={p.business_name ?? ""} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground/50">
            <Sparkles className="h-8 w-8" />
          </div>
        )}
        {p.verification_status === "verified" && (
          <Badge className="absolute right-2 top-2 border-0 gradient-gold text-primary-foreground">
            <BadgeCheck className="mr-1 h-3 w-3" /> Patvirtinta
          </Badge>
        )}
        <Badge
          variant={p.canBook ? "default" : "outline"}
          className={`absolute left-2 top-2 ${p.canBook ? "border-0 bg-foreground text-background" : "bg-background/90"}`}
        >
          {p.canBook ? (
            <>
              <CalendarCheck className="mr-1 h-3 w-3" /> Galima registruotis
            </>
          ) : (
            <>
              <Lock className="mr-1 h-3 w-3" /> Tik informacija
            </>
          )}
        </Badge>
      </div>
      <div className="p-4">
        <h2 className="font-display text-lg leading-snug">{p.business_name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {p.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {p.city}
            </span>
          )}
          {p.category && <Badge variant="outline">{p.category}</Badge>}
        </div>
        {p.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.bio}</p>}
        {p.brands.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Dirba su: </span>
            {p.brands.slice(0, 4).join(" · ")}
          </p>
        )}
        {p.services.length > 0 && (
          <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {p.services.slice(0, 3).map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-2">
                <span className="truncate">{s.name}</span>
                <span className="shrink-0 font-medium text-foreground">{Number(s.price).toFixed(0)} €</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );

  if (!p.canBook) return <div aria-disabled className="cursor-default">{body}</div>;
  return (
    <Link to="/salon/$id" params={{ id: p.id }} className="group block">
      {body}
    </Link>
  );
}
