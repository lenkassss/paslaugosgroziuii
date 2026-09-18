import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWallet } from "@/lib/payments.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtMoney, fmtDate } from "@/lib/utils";
import { Wallet, TrendingUp, TrendingDown, Loader2, CreditCard, Info } from "lucide-react";
import { ProGate } from "@/components/pro-gate";


export const Route = createFileRoute("/_authenticated/dashboard/salon/wallet")({ component: Page });

const KIND_LABEL: Record<string, string> = {
  deposit_in: "Kliento depozitas",
  fee_deducted: "Platformos mokestis",
  order_in: "Užsakymas",
  payout: "Išmokėjimas",
  refund: "Grąžinimas",
  adjustment: "Korekcija",
};

function Page() {
  const fn = useServerFn(getWallet);
  const q = useQuery({ queryKey: ["wallet"], queryFn: () => fn() });

  return (
    <DashboardShell>
      <ProGate feature="piniginė ir mokėjimai">
      <h1 className="font-display text-3xl mb-2">Piniginė</h1>
      <p className="text-sm text-muted-foreground mb-6">Kliento depozitai laukia vizito atlikimo, po to perkeliami į galimą išmokėti balansą.</p>

      {/* Demo mode notice */}
      <Card className="p-5 mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"><CreditCard className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-medium">Kortelinės rezervacijos</div>
              <Badge variant="outline" className="text-[10px]">DEMO</Badge>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mt-1">
              Šiuo metu platforma veikia demo režimu — realūs mokėjimai neimami. Netrukus prijungsime saugų atsiskaitymą, kur iš kiekvieno vizito platforma pasilieka 0,49 € mokestį, o likusi suma keliauja tiesiai į Jūsų banko sąskaitą. Visos operacijos šioje piniginėje kol kas yra simuliuojamos.
            </p>
            <div className="mt-3 inline-flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-700">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>Platformos paleidimo metu prijungsime realius mokėjimus — Jums nereikės nieko papildomai konfigūruoti.</span>
            </div>
          </div>
        </div>
      </Card>



      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Wallet className="h-5 w-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Galima išmokėti</div>
              <div className="text-2xl font-display">{fmtMoney(q.data?.balance ?? 0)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Laukiantys depozitai</div>
              <div className="text-2xl font-display">{fmtMoney(q.data?.pending ?? 0)}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="divide-y">
        <div className="p-4 font-medium text-sm">Operacijų istorija</div>
        {q.isLoading && <div className="p-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}
        {q.data?.transactions.map((t) => (
          <div key={t.id} className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {Number(t.amount) >= 0
                ? <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                : <TrendingDown className="h-4 w-4 text-destructive shrink-0" />}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{KIND_LABEL[t.kind] ?? t.kind}</div>
                <div className="text-[11px] text-muted-foreground">{fmtDate(t.created_at)}{t.note ? ` · ${t.note}` : ""}</div>
              </div>
            </div>
            <Badge variant="outline" className={Number(t.amount) >= 0 ? "text-emerald-600 border-emerald-500/40" : "text-destructive border-destructive/40"}>
              {Number(t.amount) >= 0 ? "+" : ""}{fmtMoney(Number(t.amount))}
            </Badge>
          </div>
        ))}
        {q.data && q.data.transactions.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Kol kas operacijų nėra.</div>}
      </Card>
      </ProGate>
    </DashboardShell>
  );
}
