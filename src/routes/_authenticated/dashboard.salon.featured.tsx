import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FEATURED_PLANS, getFeaturedStatus, purchaseFeaturedDemo, type FeaturedPlan } from "@/lib/featured.functions";
import { Crown, Sparkles, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { planLabel } from "@/lib/role-labels";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/featured")({ component: Page });

function fmt(cents: number) { return (cents / 100).toFixed(2).replace(".", ",") + " €"; }

function Page() {
  const qc = useQueryClient();
  const statusFn = useServerFn(getFeaturedStatus);
  const buyFn = useServerFn(purchaseFeaturedDemo);
  const q = useQuery({ queryKey: ["featured-status"], queryFn: () => statusFn() });
  const buy = useMutation({
    mutationFn: (plan: FeaturedPlan) => buyFn({ data: { plan } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["featured-status"] });
      qc.invalidateQueries({ queryKey: ["salon-dashboard"] });
      toast.success("Paryškinimas aktyvuotas!");
    },
    onError: (e) => toastError(e),
  });

  const active = q.data?.is_featured;
  const until = q.data?.featured_until;

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl">Paryškinimas</h1>
        </div>
        <p className="text-sm text-muted-foreground">Iškelk saloną paieškos viršūnėje ir gauk auksinį rėmelį bei prioritetinę žymą žemėlapyje.</p>
      </div>

      <Card className={`p-5 mb-6 ${active ? "border-primary/50 bg-primary/5" : ""}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${active ? "gradient-gold" : "bg-muted"}`}>
              <Sparkles className={`h-5 w-5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <div>
              <div className="font-medium">{active ? "Paryškintas salonas" : "Nepryškintas"}</div>
              <div className="text-xs text-muted-foreground">
                {active && until ? `Galioja iki ${fmtDate(until)}` : "Aktyvuok planą žemiau"}
              </div>
            </div>
          </div>
          {active && <Badge className="gradient-gold text-primary-foreground border-0">Aktyvus</Badge>}
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {(Object.entries(FEATURED_PLANS) as [FeaturedPlan, typeof FEATURED_PLANS[FeaturedPlan]][]).map(([key, p]) => {
          const isVip = key === "3_months";
          const isBest = key === "1_month";
          return (
            <Card key={key} className={`p-5 flex flex-col ${isVip ? "border-primary/60 bg-gradient-to-br from-primary/10 to-background" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="font-display text-lg">{p.label}</div>
                {isVip && <Badge className="gradient-gold text-primary-foreground border-0">VIP TOP</Badge>}
                {isBest && <Badge variant="outline" className="border-primary/40 text-primary">Populiariausias</Badge>}
              </div>
              <div className="mt-2 font-display text-3xl">{fmt(p.price_cents)}</div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground flex-1">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Rodymas paieškos viršuje</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Auksinis rėmelis kortelėje</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Prioriteto smeigtukas žemėlapyje</li>
                {isVip && <li className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Rekomenduojame · sutaupote iki 45%</li>}
              </ul>
              <Button
                onClick={() => buy.mutate(key)}
                disabled={buy.isPending}
                className={`mt-4 ${isVip ? "gradient-gold text-primary-foreground" : ""}`}
                variant={isVip ? "default" : "outline"}
              >
                {buy.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {active ? "Pratęsti" : "Aktyvuoti"}
              </Button>
              <div className="mt-2 text-[11px] text-muted-foreground text-center">Demo mokėjimas · Stripe integracija ruošiama</div>
            </Card>
          );
        })}
      </div>

      {q.data?.history?.length ? (
        <Card className="mt-8 p-5">
          <div className="font-display text-lg mb-3">Pirkimų istorija</div>
          <div className="divide-y">
            {q.data.history.map((h: any) => (
              <div key={h.id} className="py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{planLabel(h.plan_type)}</Badge>
                  <span className="text-muted-foreground">{fmtDate(h.starts_at)} → {fmtDate(h.ends_at)}</span>
                </div>
                <div className="font-medium">{fmt(h.amount_cents ?? 0)}</div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </DashboardShell>
  );
}
