import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { scrapeShopUrl, importScrapedProducts } from "@/lib/shop-scraper.functions";
import type { ScrapedPreviewItem } from "@/lib/shop-scraper-types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Globe, Loader2, Sparkles, CheckCircle2, ImageOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export function ShopUrlScraper() {
  const qc = useQueryClient();
  const scrapeFn = useServerFn(scrapeShopUrl);
  const importFn = useServerFn(importScrapedProducts);

  const [url, setUrl] = useState("");
  const [markup, setMarkup] = useState(30);
  const [items, setItems] = useState<ScrapedPreviewItem[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [meta, setMeta] = useState<{ platform: string; domain: string } | null>(null);

  const scrape = useMutation({
    mutationFn: () => scrapeFn({ data: { url, limit: 120 } }),
    onSuccess: (r) => {
      setItems(r.items);
      setMeta({ platform: r.platform, domain: r.domain });
      const all: Record<number, boolean> = {};
      r.items.forEach((_, i) => (all[i] = true));
      setSelected(all);
      if (r.count === 0) toast.error("Produktų nerasta — pabandyk konkretų katalogo puslapį");
      else toast.success(`Rasta ${r.count} produktų (${r.platform})`);
    },
    onError: (e) => toastError(e),
  });

  const chosen = useMemo(() => items.filter((_, i) => selected[i]), [items, selected]);

  const importMut = useMutation({
    mutationFn: () =>
      importFn({
        data: {
          b2cMarkupPct: markup,
          defaultBrand: meta?.domain,
          items: chosen.map((i) => ({
            title: i.title,
            description: i.description,
            html: i.html,
            price: i.price,
            images: i.images ?? [],
            brand: i.brand,
            category: i.category,
            stock: i.stock,
            volume: i.volume,
            inci: i.inci,
          })),
        },
      }),
    onSuccess: (r) => {
      toast.success(`Importuota ${r.imported} prekių`);
      setItems([]);
      setSelected({});
      qc.invalidateQueries({ queryKey: ["my-products"] });
      qc.invalidateQueries({ queryKey: ["mp-products"] });
      qc.invalidateQueries({ queryKey: ["mp-facets"] });
    },
    onError: (e) => toastError(e),
  });

  const toggleAll = (v: boolean) => {
    const next: Record<number, boolean> = {};
    items.forEach((_, i) => (next[i] = v));
    setSelected(next);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-background p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg gradient-gold p-2.5 text-primary-foreground shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg">Tiesioginė svetainės nuoroda</h3>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">Shopify · WooCommerce · HTML</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Įklijuok savo e-parduotuvės arba katalogo nuorodą — atpažinsime platformą ir nuskaitysime prekes automatiškai.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
              <div>
                <Label className="text-xs">Parduotuvės / katalogo nuoroda</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://glowsolutions.lt/produktai/"
                  className="bg-background mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">B2C antkainis (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={markup}
                  onChange={(e) => setMarkup(Number(e.target.value) || 0)}
                  className="bg-background mt-1"
                />
              </div>
            </div>

            <Button
              onClick={() => scrape.mutate()}
              disabled={!url || scrape.isPending}
              className="mt-3 gradient-gold text-primary-foreground"
            >
              {scrape.isPending ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Nuskaitoma…</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" /> Nuskaityti parduotuvę</>
              )}
            </Button>

            {scrape.isPending && (
              <div className="mt-3 rounded-lg border border-border/60 bg-background p-3 text-sm text-muted-foreground animate-pulse">
                Nuskaitoma {(() => { try { return new URL(url).host; } catch { return "parduotuvė"; } })()} parduotuvė…
              </div>
            )}
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Rasta <b>{items.length}</b> produktų iš <b>{meta?.domain}</b>
              <Badge variant="secondary" className="text-[10px] uppercase">{meta?.platform}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>Pažymėti visus</Button>
              <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>Nuimti</Button>
              <Button
                onClick={() => importMut.mutate()}
                disabled={!chosen.length || importMut.isPending}
                className="gradient-gold text-primary-foreground"
              >
                {importMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Importuoti {chosen.length} produktus
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => {
              const wholesale = p.price ?? 0;
              const retail = Math.round(wholesale * (1 + markup / 100) * 100) / 100;
              return (
                <div
                  key={i}
                  className={`group rounded-xl border transition-all duration-300 overflow-hidden bg-background ${
                    selected[i] ? "border-primary/50 shadow-elegant" : "border-border/60 opacity-70"
                  }`}
                >
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <ImageOff className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={!!selected[i]}
                        onCheckedChange={(v) => setSelected((s) => ({ ...s, [i]: !!v }))}
                        className="bg-background/90 border-primary/50"
                      />
                    </div>
                    {p.volume && (
                      <Badge className="absolute bottom-2 right-2 bg-background/90 text-foreground border border-border/60">
                        {p.volume}
                      </Badge>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="font-medium text-sm line-clamp-2">{p.title}</div>
                    {p.brand && <div className="text-[11px] text-muted-foreground">{p.brand}</div>}
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-sm font-semibold">{retail.toFixed(2)} €</span>
                      <span className="text-[11px] text-muted-foreground">B2B {wholesale.toFixed(2)} €</span>
                    </div>
                    {p.inci && (
                      <details className="text-[11px] text-muted-foreground">
                        <summary className="cursor-pointer">INCI sudėtis</summary>
                        <p className="mt-1 line-clamp-6">{p.inci}</p>
                      </details>
                    )}
                    {!p.price && (
                      <div className="flex items-center gap-1 text-[11px] text-destructive">
                        <AlertCircle className="h-3 w-3" /> Kaina nerasta — bus 0 €
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
