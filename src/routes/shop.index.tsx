import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMarketplaceProducts, listMarketplaceFacets } from "@/lib/marketplace.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShoppingBag, Sparkles, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { useStoreAccess } from "@/lib/use-store-access";
import { B2BOnlyNotice } from "@/components/b2b-only-notice";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  brand: fallback(z.string(), "").default(""),
  sort: fallback(z.string(), "new").default("new"),
});

export const Route = createFileRoute("/shop/")({
  validateSearch: zodValidator(searchSchema),
  component: Shop,
  head: () => ({
    meta: [
      { title: "Grožio prekių parduotuvė · PaslaugosGrožiui" },
      { name: "description", content: "Profesionalios grožio priemonės — kosmetika, įranga, priedai. Meistrėms ir salonams — didmeninė kaina." },
      { property: "og:title", content: "Grožio prekių parduotuvė · PaslaugosGrožiui" },
      { property: "og:description", content: "Grožio priemonės iš patvirtintų tiekėjų." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Shop() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const listFn = useServerFn(listMarketplaceProducts);
  const facetFn = useServerFn(listMarketplaceFacets);
  const [q, setQ] = useState(search.q);
  const access = useStoreAccess();

  const facets = useQuery({ queryKey: ["mp-facets"], queryFn: () => facetFn(), enabled: access.canShop, retry: false });
  const products = useQuery({
    queryKey: ["mp-products", search.q, search.category, search.brand, search.sort],
    queryFn: () => listFn({ data: {
      q: search.q || undefined,
      category: search.category || undefined,
      brand: search.brand || undefined,
      sort: (search.sort as "new" | "price_asc" | "price_desc") || "new",
      limit: 48,
      offset: 0,
    } }),
    enabled: access.canShop,
    retry: false,
  });

  const applyQ = () => navigate({ search: (p: any) => ({ ...p, q }) });

  if (!access.loading && !access.canShop) {
    return (
      <B2BOnlyNotice
        title="Parduotuvė prieinama tik profesionalams"
        description="Profesionalių grožio priemonių katalogas skirtas meistrėms, salonams ir tiekėjams. Prisijunk su profesionalo paskyra arba užsiregistruok."
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-10 mb-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="flex items-center gap-2 mb-3">
          <Badge className="gradient-gold text-primary-foreground border-0">Parduotuvė</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-5xl leading-tight">
          Profesionalios <span className="text-gradient-gold">grožio priemonės</span>
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Kosmetika, įranga ir priedai iš patvirtintų tiekėjų. Klientai perka mažmenine kaina, meistrės ir salonai gauna geresnę B2B kainą po prisijungimo.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") applyQ(); }}
              placeholder="Ieškoti prekės, prekės ženklo…" className="pl-9 h-11 bg-background" />
          </div>
          <Button onClick={applyQ} className="gradient-gold text-primary-foreground h-11 px-6">Ieškoti</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Select value={search.category || "__all"} onValueChange={(v) => navigate({ search: (p: any) => ({ ...p, category: v === "__all" ? "" : v }) })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Kategorija" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Visos kategorijos</SelectItem>
            {facets.data?.categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={search.brand || "__all"} onValueChange={(v) => navigate({ search: (p: any) => ({ ...p, brand: v === "__all" ? "" : v }) })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Prekės ženklas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Visi ženklai</SelectItem>
            {facets.data?.brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={search.sort} onValueChange={(v) => navigate({ search: (p: any) => ({ ...p, sort: v }) })}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Naujausios</SelectItem>
            <SelectItem value="price_asc">Kaina: pigiausios</SelectItem>
            <SelectItem value="price_desc">Kaina: brangiausios</SelectItem>
          </SelectContent>
        </Select>
        {(search.q || search.category || search.brand) && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); navigate({ search: () => ({ q: "", category: "", brand: "", sort: search.sort }) }); }}>
            Išvalyti
          </Button>
        )}
        <div className="ml-auto text-sm text-muted-foreground">
          {products.data ? `${products.data.items.length} prekių` : ""}
        </div>
      </div>

      {products.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : products.data && products.data.items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.data.items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <Card className="p-14 text-center">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg">Prekių pagal jūsų paiešką nerasta</p>
          <p className="text-sm text-muted-foreground mt-1">Pabandykite kitą kategoriją ar išvalykite filtrus.</p>
        </Card>
      )}
    </div>
  );
}

function ProductCard({ p }: { p: any }) {
  const { role } = useAuth();
  const isPro = role === "salon" || role === "staff" || role === "supplier" || role === "admin";
  const img = Array.isArray(p.images) && p.images[0] ? p.images[0] : null;

  const wholesale = Number(p.price_wholesale ?? p.price);
  const retail = Number(p.price_retail ?? wholesale * 1.30);
  const base = isPro ? wholesale : retail;
  const shown = base * (1 - (p.discount_percent || 0) / 100);
  const verified = p.profiles?.verification_status === "verified";

  return (
    <Link to="/shop/$slug" params={{ slug: p.slug }} className="group block">
      <Card className="overflow-hidden border-border/60 hover:border-primary/50 hover:shadow-elegant transition-all">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {img ? (
            <img src={img} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Sparkles className="h-8 w-8" /></div>
          )}
          {p.discount_percent > 0 && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground border-0">−{p.discount_percent}%</Badge>
          )}
          {isPro && (
            <Badge className="absolute bottom-2 left-2 gradient-gold text-primary-foreground border-0 text-[10px]">B2B kaina</Badge>
          )}
          {p.stock <= 3 && p.stock > 0 && (
            <Badge variant="outline" className="absolute top-2 right-2 bg-background/90">Liko {p.stock}</Badge>
          )}
        </div>
        <div className="p-3">
          {p.brand && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.brand}</div>}
          <div className="font-medium text-sm line-clamp-2 min-h-[2.5rem] mt-0.5">{p.title}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <span className="truncate">{p.profiles?.business_name ?? "Tiekėjas"}</span>
            {verified && <BadgeCheck className="h-3 w-3 text-primary shrink-0" />}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-lg font-semibold">{shown.toFixed(2)} €</span>
            {isPro && retail > wholesale && (
              <span className="text-xs text-muted-foreground line-through">{retail.toFixed(2)} €</span>
            )}
          </div>
          {!isPro && (
            <div className="mt-1 text-[10px] text-muted-foreground">Meistrėms / salonams — B2B kaina po prisijungimo</div>
          )}
        </div>
      </Card>
    </Link>
  );
}
