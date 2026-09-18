import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPromotions, adminSetPromotion } from "@/lib/promotions.functions";
import { Pin, Euro, Crown, X } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { useState } from "react";
import { planLabel } from "@/lib/role-labels";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/promotions")({
  component: AdminPromotions,
});

function eur(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function AdminPromotions() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListPromotions);
  const setFn = useServerFn(adminSetPromotion);
  const [days, setDays] = useState<Record<string, string>>({});
  const [prio, setPrio] = useState<Record<string, string>>({});

  const q = useQuery({ queryKey: ["admin-promotions"], queryFn: () => listFn() });
  const save = useMutation({
    mutationFn: (v: { articleId: string; isPromoted: boolean; days: number; priority?: number }) => setFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Atnaujinta");
    },
    onError: (e) => toastError(e),
  });

  const rows = q.data?.purchases ?? [];

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-2">
        <Pin className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl">Reklamuojami straipsniai</h1>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Euro className="h-4 w-4" />Pajamos</div>
          <div className="font-display text-2xl">{eur(q.data?.revenueCents ?? 0)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Crown className="h-4 w-4" />Aktyvios</div>
          <div className="font-display text-2xl">{q.data?.activeCount ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pirkimų</div>
          <div className="font-display text-2xl">{rows.length}</div>
        </Card>
      </div>

      {q.isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}</div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Kol kas reklamos pirkimų nėra.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map((p) => {
            const a = (q.data?.articles as any)?.[p.target_id];
            const owner = (q.data?.owners as any)?.[p.user_id];
            const active = new Date(p.ends_at).getTime() > Date.now();
            return (
              <Card key={p.id} className={`p-4 ${active ? "border-primary/40" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{planLabel(p.plan_type)}</Badge>
                      {active ? (
                        <Badge className="gradient-gold border-0 text-[10px] text-primary-foreground">Aktyvi</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Baigėsi</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{fmtDate(p.starts_at)} → {fmtDate(p.ends_at)}</span>
                    </div>
                    <div className="mt-1 font-medium">
                      {a?.slug ? (
                        <Link to="/article/$slug" params={{ slug: a.slug }} className="hover:text-primary hover:underline">{a.title}</Link>
                      ) : (a?.title ?? "Straipsnis pašalintas")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {owner?.business_name || owner?.owner_name || owner?.email || p.user_id} · {eur(p.amount_cents ?? 0)}
                      {a?.promoted_priority ? ` · prioritetas ${a.promoted_priority}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      className="h-9 w-20"
                      type="number"
                      min={1}
                      placeholder="dienos"
                      value={days[p.target_id] ?? ""}
                      onChange={(e) => setDays((s) => ({ ...s, [p.target_id]: e.target.value }))}
                    />
                    <Input
                      className="h-9 w-24"
                      type="number"
                      min={0}
                      placeholder="prioritetas"
                      value={prio[p.target_id] ?? ""}
                      onChange={(e) => setPrio((s) => ({ ...s, [p.target_id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      disabled={save.isPending}
                      onClick={() => save.mutate({
                        articleId: p.target_id,
                        isPromoted: true,
                        days: Number(days[p.target_id] || 7),
                        ...(prio[p.target_id] ? { priority: Number(prio[p.target_id]) } : {}),
                      })}
                    >
                      Prikabinti
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={save.isPending}
                      onClick={() => save.mutate({ articleId: p.target_id, isPromoted: false, days: 0 })}
                    >
                      <X className="mr-1 h-4 w-4" />Nuimti
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
