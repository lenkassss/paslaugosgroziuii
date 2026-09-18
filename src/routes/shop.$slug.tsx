import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketplaceProduct } from "@/lib/marketplace.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, ChevronLeft, Loader2, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/shop/$slug")({
  component: Detail,
  head: () => ({
    meta: [
      { title: "Prekė · PaslaugosGrožiui parduotuvė" },
      { name: "description", content: "Profesionali grožio priemonė iš patvirtinto tiekėjo: sudėtis (INCI), naudojimas, tūris ir kilmės šalis." },
      { property: "og:title", content: "Prekė · PaslaugosGrožiui parduotuvė" },
      { property: "og:description", content: "Grožio priemonė su pilna specifikacija — B2C ir B2B kainos." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});


function Detail() {
  const { slug } = Route.useParams();
  const fn = useServerFn(getMarketplaceProduct);
  const q = useQuery({ queryKey: ["mp-product", slug], queryFn: () => fn({ data: { slug } }) });
  const { user, role } = useAuth();
  const canShop = role === "salon" || role === "staff" || role === "supplier" || role === "admin";
  const [activeImg, setActiveImg] = useState(0);


  if (q.isLoading) return <div className="p-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>;
  if (q.isError || !q.data) return <div className="p-20 text-center text-muted-foreground">Prekė nerasta. <Link to="/shop" className="text-primary underline">Grįžti į turgų</Link></div>;

  const p: any = q.data.product;
  const images: string[] = Array.isArray(p.images) ? p.images : [];
  const wholesale = Number(p.price_wholesale ?? p.price);
  const retail = Number(p.price_retail ?? wholesale * 1.3);
  const base = canShop ? wholesale : retail;
  const effective = base * (1 - (p.discount_percent || 0) / 100);
  const verified = p.profiles?.verification_status === "verified";


  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
      <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ChevronLeft className="h-4 w-4" /> Grįžti į turgų
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <Card className="overflow-hidden aspect-square bg-muted">
            {images[activeImg] ? (
              <img loading="lazy" decoding="async" src={images[activeImg]} alt={p.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Sparkles className="h-10 w-10" /></div>
            )}
          </Card>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((src, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden rounded-md border ${i === activeImg ? "border-primary" : "border-border"}`}>
                  <img loading="lazy" decoding="async" src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {p.brand && <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.brand}</div>}
          <h1 className="font-display text-3xl md:text-4xl mt-1">{p.title}</h1>

          <div className="mt-3 flex items-center gap-2">
            {p.category && <Badge variant="outline">{p.category}</Badge>}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>{p.profiles?.business_name ?? "Tiekėjas"}</span>
              {verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-semibold">{effective.toFixed(2)} €</span>
            {p.discount_percent > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">{base.toFixed(2)} €</span>
                <Badge className="bg-destructive text-destructive-foreground border-0">−{p.discount_percent}%</Badge>
              </>
            )}
            {canShop ? (
              <Badge className="gradient-gold text-primary-foreground border-0">B2B kaina</Badge>
            ) : (
              retail > wholesale && (
                <span className="text-xs text-muted-foreground">Meistrėms / salonams — {wholesale.toFixed(2)} €</span>
              )
            )}
          </div>

          <div className="mt-5">
            <Tabs defaultValue="desc">
              <TabsList className="w-full grid grid-cols-4 h-auto">
                <TabsTrigger value="desc" className="text-xs py-2">Aprašymas</TabsTrigger>
                <TabsTrigger value="usage" className="text-xs py-2">Naudojimas</TabsTrigger>
                <TabsTrigger value="inci" className="text-xs py-2">INCI</TabsTrigger>
                <TabsTrigger value="specs" className="text-xs py-2">Specifikacija</TabsTrigger>
              </TabsList>
              <TabsContent value="desc" className="text-sm text-muted-foreground whitespace-pre-wrap pt-3">
                {p.description || "Aprašymo nėra."}
              </TabsContent>
              <TabsContent value="usage" className="text-sm text-muted-foreground whitespace-pre-wrap pt-3">
                {p.usage_instructions || "Naudojimo instrukcija nepateikta."}
              </TabsContent>
              <TabsContent value="inci" className="text-sm text-muted-foreground whitespace-pre-wrap pt-3 break-words">
                {p.inci || "Sudėtis (INCI) nepateikta."}
              </TabsContent>
              <TabsContent value="specs" className="pt-3">
                <dl className="text-sm divide-y divide-border/60">
                  <div className="flex justify-between py-2"><dt className="text-muted-foreground">Prekės ženklas</dt><dd>{p.brand || "—"}</dd></div>
                  <div className="flex justify-between py-2"><dt className="text-muted-foreground">Tūris / kiekis</dt><dd>{p.volume || "—"}</dd></div>
                  <div className="flex justify-between py-2"><dt className="text-muted-foreground">Kilmės šalis</dt><dd>{p.country_of_origin || "—"}</dd></div>
                  <div className="flex justify-between py-2"><dt className="text-muted-foreground">Kategorija</dt><dd>{p.category || "—"}</dd></div>
                  <div className="flex justify-between py-2"><dt className="text-muted-foreground">Likutis</dt><dd>{p.stock} vnt.</dd></div>
                </dl>
              </TabsContent>
            </Tabs>
          </div>


          <div className="mt-6 text-xs text-muted-foreground">Sandėlyje: {p.stock}</div>

          {canShop ? (
            <Card className="mt-4 p-4">
              <div className="text-sm font-medium">Susitark dėl užsakymo su tiekėju</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Kainos ir pristatymas derinami tiesiogiai su tiekėju.
              </p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/feed/akcijos">Tiekėjų pasiūlymai</Link>
              </Button>
            </Card>
          ) : (
            <Card className="mt-4 p-4 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-primary" /> B2B turgus tik profesionalams
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Prekės parduodamos tik registruotiems salonams ir tiekėjams. {user ? "Susisiekite su administracija dėl rolės." : "Prisijunkite arba registruokitės kaip verslas."}
              </p>
              {!user && (
                <Button asChild size="sm" className="mt-3 gradient-gold text-primary-foreground">
                  <Link to="/auth" search={{ mode: "signup" }}>Registruotis verslui</Link>
                </Button>
              )}
            </Card>
          )}


          <Card className="mt-6 p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Saugus mokėjimas per platformą</div>
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Pristatymas visoje Lietuvoje</div>
            <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> 14 d. grąžinimas be klausimų</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
