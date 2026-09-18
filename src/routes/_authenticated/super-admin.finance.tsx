import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ownerFinanceReport } from "@/lib/finance.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp, Coins, Sparkles, ShoppingBag, Ticket, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/super-admin/finance")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: p } = await supabase.from("profiles").select("is_primary_owner").eq("id", data.user.id).maybeSingle();
    if (!p?.is_primary_owner) throw redirect({ to: "/" });
  },
  component: FinancePage,
});

function fmt(cents: number) { return (cents / 100).toFixed(2).replace(".", ",") + " €"; }

function FinancePage() {
  const fn = useServerFn(ownerFinanceReport);
  const q = useQuery({ queryKey: ["owner-finance"], queryFn: () => fn() });

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg gradient-gold flex items-center justify-center">
          <Crown className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl">Finansų ataskaita</h1>
          <p className="text-sm text-muted-foreground">Tik pagrindiniam savininkui · platformos pajamos ir mokesčiai.</p>
        </div>
        <Badge className="ml-auto gradient-gold text-primary-foreground border-0">Owner only</Badge>
      </div>

      {q.isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
      {q.data && (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground flex items-center gap-2"><Coins className="h-3 w-3" /> Vizitų mokesčiai (0.49€)</div>
              <div className="mt-2 text-2xl font-semibold">{fmt(q.data.totals.bookingFees)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground flex items-center gap-2"><Sparkles className="h-3 w-3" /> Paryškinimai</div>
              <div className="mt-2 text-2xl font-semibold">{fmt(q.data.totals.featuredRevenue)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground flex items-center gap-2"><Ticket className="h-3 w-3" /> Narystės</div>
              <div className="mt-2 text-2xl font-semibold">{fmt(q.data.totals.membershipRevenue)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs uppercase text-muted-foreground flex items-center gap-2"><ShoppingBag className="h-3 w-3" /> Marketplace</div>
              <div className="mt-2 text-2xl font-semibold">{fmt(q.data.totals.marketplaceFees)}</div>
            </Card>
          </div>
          <Card className="p-5 border-primary/40 bg-gradient-to-br from-primary/5 to-background mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="h-4 w-4 text-primary" /> Bendra platformos apyvarta</div>
              <div className="font-display text-4xl text-gradient-gold">{fmt(q.data.totals.total)}</div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="font-display text-lg mb-3">Mėnesinis suskirstymas</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-2">Mėnuo</th>
                    <th className="py-2 pr-2">Vizitai</th>
                    <th className="py-2 pr-2">Paryšk.</th>
                    <th className="py-2 pr-2">Narystės</th>
                    <th className="py-2 pr-2">Marketpl.</th>
                    <th className="py-2 pr-2 text-right">Viso</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.monthly.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Kol kas nėra duomenų</td></tr>}
                  {q.data.monthly.map((m: any) => (
                    <tr key={m.month} className="border-b last:border-0">
                      <td className="py-2 pr-2 font-mono text-xs">{m.month}</td>
                      <td className="py-2 pr-2">{fmt(m.fees)}</td>
                      <td className="py-2 pr-2">{fmt(m.featured)}</td>
                      <td className="py-2 pr-2">{fmt(m.membership)}</td>
                      <td className="py-2 pr-2">{fmt(m.marketplace)}</td>
                      <td className="py-2 pr-2 text-right font-semibold">{fmt(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
