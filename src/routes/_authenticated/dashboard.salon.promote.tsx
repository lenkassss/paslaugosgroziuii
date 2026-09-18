import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  PROMO_PLANS,
  listMyPromotableContent,
  purchaseArticlePromotion,
  stopArticlePromotion,
  type PromoPlan,
} from "@/lib/promotions.functions";
import { Crown, Pin, Loader2, TrendingUp, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { useState } from "react";
import { ResponsiveModal } from "@/components/responsive-modal";
import { planLabel } from "@/lib/role-labels";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/promote")({
  component: PromotePage,
  head: () => ({
    meta: [
      { title: "Straipsnių reklamavimas – PaslaugosGrožiui" },
      { name: "description", content: "Iškelk savo straipsnį, akciją ar renginį į naujienų srauto viršų ir gauk daugiau klientų." },
      { property: "og:title", content: "Straipsnių reklamavimas" },
      { property: "og:description", content: "Prikabink turinį srauto viršuje 1 dienai, 3 dienoms, savaitei ar mėnesiui." },
    ],
  }),
});

function eur(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

const KIND_LABEL: Record<string, string> = { article: "Straipsnis", event: "Renginys", promo: "Akcija" };

function PromotePage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyPromotableContent);
  const buyFn = useServerFn(purchaseArticlePromotion);
  const stopFn = useServerFn(stopArticlePromotion);
  const [picking, setPicking] = useState<{ id: string; title: string } | null>(null);

  const q = useQuery({ queryKey: ["my-promotable"], queryFn: () => listFn() });

  const buy = useMutation({
    mutationFn: (v: { articleId: string; plan: PromoPlan }) => buyFn({ data: v }),
    onSuccess: (r) => {
      setPicking(null);
      qc.invalidateQueries({ queryKey: ["my-promotable"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["notif-count"] });
      toast.success(`Reklama aktyvi iki ${fmtDate(r.ends_at)}`);
    },
    onError: (e) => toastError(e),
  });

  const stop = useMutation({
    mutationFn: (articleId: string) => stopFn({ data: { articleId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-promotable"] });
      toast.success("Reklama išjungta");
    },
    onError: (e) => toastError(e),
  });

  const items = q.data?.items ?? [];
  const purchases = q.data?.purchases ?? [];
  const spent = purchases.filter((p) => p.payment_status === "paid").reduce((s, p) => s + (p.amount_cents ?? 0), 0);

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Pin className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">Turinio reklamavimas</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Prikabink straipsnį, akciją ar renginį naujienų srauto viršuje. Prikabintas turinys gauna prabangų „Sponsored / VIP" rėmelį ir nenuslysta žemiau.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(Object.entries(PROMO_PLANS) as [PromoPlan, (typeof PROMO_PLANS)[PromoPlan]][]).map(([key, p]) => (
          <Card key={key} className={`p-4 ${key === "1_month" ? "border-primary/60 bg-gradient-to-br from-primary/10 to-background" : ""}`}>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{p.label}</div>
            <div className="font-display text-2xl">{eur(p.price_cents)}</div>
            <Badge variant="outline" className="mt-2 border-primary/40 text-[10px] text-primary">{p.badge}</Badge>
          </Card>
        ))}
      </div>

      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="h-4 w-4 text-primary" />
          Aktyvios reklamos: <strong>{items.filter((i) => i.promotion_active).length}</strong>
        </div>
        <div className="text-sm text-muted-foreground">Iš viso investuota: <strong className="text-foreground">{eur(spent)}</strong></div>
      </Card>

      {q.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <Crown className="mx-auto mb-2 h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Dar neturi turinio. Sukurk straipsnį ar akciją ir grįžk čia jo reklamuoti.</p>
          <Link to="/dashboard/salon/content" className="mt-3 inline-block text-sm text-primary hover:underline">Kurti turinį →</Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className={`flex flex-wrap items-center gap-4 p-4 ${a.promotion_active ? "border-primary/50 bg-primary/5" : ""}`}>
              {a.cover_url ? (
                <img src={a.cover_url} alt={a.title} loading="lazy" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted"><Pin className="h-5 w-5 text-muted-foreground" /></div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{KIND_LABEL[a.kind] ?? a.kind}</Badge>
                  {a.promotion_active && (
                    <Badge className="gradient-gold border-0 text-[10px] text-primary-foreground">{a.promoted_label || "Reklama"}</Badge>
                  )}
                </div>
                <div className="mt-1 truncate font-medium">{a.title}</div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{a.views}</span>
                  {a.promotion_active && a.promoted_until && <span>iki {fmtDate(a.promoted_until)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.promotion_active && (
                  <Button variant="ghost" size="sm" onClick={() => stop.mutate(a.id)} disabled={stop.isPending}>
                    <X className="mr-1 h-4 w-4" />Stabdyti
                  </Button>
                )}
                <Button size="sm" onClick={() => setPicking({ id: a.id, title: a.title })}>
                  {a.promotion_active ? "Pratęsti" : "Reklamuoti"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {purchases.length > 0 && (
        <Card className="mt-8 p-5">
          <div className="mb-3 font-display text-lg">Pirkimų istorija</div>
          <div className="divide-y">
            {purchases.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{planLabel(p.plan_type)}</Badge>
                  <span className="text-muted-foreground">{fmtDate(p.starts_at)} → {fmtDate(p.ends_at)}</span>
                </div>
                <div className="font-medium">{eur(p.amount_cents ?? 0)}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ResponsiveModal open={!!picking} onOpenChange={(o) => !o && setPicking(null)} title="Pasirink reklamos trukmę">
        <div className="space-y-3 p-1">
          <p className="text-sm text-muted-foreground line-clamp-2">„{picking?.title}"</p>
          {(Object.entries(PROMO_PLANS) as [PromoPlan, (typeof PROMO_PLANS)[PromoPlan]][]).map(([key, p]) => (
            <button
              key={key}
              disabled={buy.isPending}
              onClick={() => picking && buy.mutate({ articleId: picking.id, plan: key })}
              className="flex w-full items-center justify-between rounded-xl border border-border/60 p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 active:scale-[0.99] disabled:opacity-60"
            >
              <div>
                <div className="font-medium">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.badge} · pinned srauto viršuje</div>
              </div>
              <div className="flex items-center gap-2 font-display text-lg">
                {buy.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {eur(p.price_cents)}
              </div>
            </button>
          ))}
          <p className="pt-1 text-center text-[11px] text-muted-foreground">Demo mokėjimas · Stripe integracija ruošiama</p>
        </div>
      </ResponsiveModal>
    </DashboardShell>
  );
}
