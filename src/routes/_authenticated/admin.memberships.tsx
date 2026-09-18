import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListMemberships, adminSetMembership } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import { fmtDate } from "@/lib/utils";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { roleLabel, statusLabel } from "@/lib/role-labels";

export const Route = createFileRoute("/_authenticated/admin/memberships")({
  component: AdminMemberships,
});

const TIER_LABELS: Record<string, string> = { silver: "Sidabras", gold: "Auksas", diamond: "Deimantas" };
const BILLING_LABELS: Record<string, string> = { monthly: "Mėnesinis", yearly: "Metinis" };
const STATE_LABELS: Record<string, string> = {
  none: "Nėra", trial: "Bandomasis", active: "Aktyvi", past_due: "Vėluoja",
  cancelled: "Atšaukta", expired: "Pasibaigusi",
};

function AdminMemberships() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListMemberships);
  const setFn = useServerFn(adminSetMembership);
  const [q, setQ] = useState("");

  const query = useQuery({ queryKey: ["admin-memberships"], queryFn: () => listFn() });

  const mut = useMutation({
    mutationFn: (v: { userId: string; action: "grant" | "revoke" | "extend_month" | "extend_year" | "set_tier"; tier?: "silver" | "gold" | "diamond" }) =>
      setFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-memberships"] }); toast.success("Narystė atnaujinta"); },
    onError: (e) => toastError(e),
  });

  const rows = (query.data?.members ?? []).filter((u: any) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return [u.business_name, u.owner_name, u.email, u.city].some((v) => String(v ?? "").toLowerCase().includes(needle));
  });

  return (
    <DashboardShell>
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl">Narystės</h1>
        <p className="mt-1 text-sm text-muted-foreground">Narysčių suteikimas, pratęsimas ir lygio nustatymas.</p>
      </div>

      <Input className="mb-4" placeholder="Paieška: pavadinimas arba el. paštas..." value={q} onChange={(e) => setQ(e.target.value)} />

      {query.isLoading && (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Kraunama...
        </div>
      )}

      <Card className="divide-y overflow-hidden">
        {rows.map((u: any) => {
          const busy = mut.isPending;
          return (
            <div key={u.id} className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{u.business_name || u.owner_name || u.email}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}{u.city ? ` · ${u.city}` : ""}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {u.subscription_active
                      ? `Galioja iki ${u.subscription_expires_at ? fmtDate(u.subscription_expires_at) : "—"}`
                      : "Narystė neaktyvi"}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <Badge variant="outline" className="text-[10px]">{roleLabel(u.role, true)}</Badge>
                  <Badge variant={u.subscription_active ? "default" : "secondary"} className="text-[10px]">
                    {STATE_LABELS[u.subscription_state] ?? statusLabel(u.subscription_state)}
                  </Badge>
                  {u.plan_tier && <Badge variant="outline" className="text-[10px]">{TIER_LABELS[u.plan_tier] ?? u.plan_tier}</Badge>}
                  {u.subscription_billing && (
                    <Badge variant="outline" className="text-[10px]">{BILLING_LABELS[u.subscription_billing] ?? u.subscription_billing}</Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={busy}
                  variant={u.subscription_active ? "outline" : "default"}
                  className={!u.subscription_active ? "gradient-gold text-primary-foreground" : ""}
                  onClick={() => mut.mutate({ userId: u.id, action: u.subscription_active ? "revoke" : "grant" })}>
                  <Sparkles className="mr-1 h-3 w-3" />
                  {u.subscription_active ? "Panaikinti narystę" : "Suteikti narystę"}
                </Button>
                <Button size="sm" variant="outline" disabled={busy}
                  onClick={() => mut.mutate({ userId: u.id, action: "extend_month" })}>
                  +1 mėn.
                </Button>
                <Button size="sm" variant="outline" disabled={busy}
                  onClick={() => mut.mutate({ userId: u.id, action: "extend_year" })}>
                  +1 metai
                </Button>
                {(["silver", "gold", "diamond"] as const).map((t) => (
                  <Button key={t} size="sm" variant={u.plan_tier === t ? "secondary" : "outline"} disabled={busy}
                    onClick={() => mut.mutate({ userId: u.id, action: "set_tier", tier: t })}>
                    {TIER_LABELS[t]}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
        {!query.isLoading && rows.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Narysčių nerasta.</div>
        )}
      </Card>
    </DashboardShell>
  );
}
