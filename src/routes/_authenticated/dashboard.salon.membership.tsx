import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activateDemoMembership, getSalonDashboard, upgradeMembership, upgradeToPro, previewUpgradePrice, PRICING, STARTER_PRICING, type PlanTier } from "@/lib/platform.functions";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, Sparkles, Loader2, ShieldCheck, TrendingUp, Crown, Megaphone } from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/membership")({
  component: Membership,
});

function Membership() {
  return <MembershipView />;
}

function fmt(n: number) { return n.toFixed(2).replace(".", ",") + " €"; }

export function MembershipView() {
  const qc = useQueryClient();
  const { role } = useAuth();
  const tier: PlanTier = role === "supplier" ? "supplier" : role === "salon" ? "salon" : "master";
  const tierLabel = { master: "Meistras", salon: "Salonas", supplier: "Tiekėjas" }[tier];
  const prices = PRICING[tier];

  const { data } = useQuery({ queryKey: ["salon-dashboard"], queryFn: () => getSalonDashboard({ data: undefined }) });
  const upgradePreview = useQuery({ queryKey: ["upgrade-preview"], queryFn: () => previewUpgradePrice({ data: undefined }) });

  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [selectedLevel, setSelectedLevel] = useState<"starter" | "pro">("pro");
  const [success, setSuccess] = useState<null | { plan: "monthly" | "yearly"; amount: number }>(null);
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");

  const activate = useServerFn(activateDemoMembership);
  const upgradeFn = useServerFn(upgradeMembership);
  const toProFn = useServerFn(upgradeToPro);

  const mut = useMutation({
    mutationFn: () => activate({ data: { cardNumber: card, expiry, cvc, plan_type: selectedPlan, level: selectedLevel } }),
    onSuccess: (r) => {
      setOpen(false);
      setSuccess({ plan: r.plan_type as "monthly" | "yearly", amount: r.amount });
      qc.invalidateQueries();
    },
    onError: (e) => {
      const msg = (e as Error).message;
      if (msg.includes("DEMO_INVALID_CARD")) toast.error("Demo režime naudokite kortelę 4242 4242 4242 4242");
      else toast.error(msg);
    },
  });

  const upgrade = useMutation({
    mutationFn: () => upgradeFn({ data: undefined }),
    onSuccess: (r) => {
      setSuccess({ plan: "yearly", amount: r.price });
      qc.invalidateQueries();
    },
    onError: (e) => toastError(e),
  });

  const toPro = useMutation({
    mutationFn: () => toProFn({ data: undefined }),
    onSuccess: (r) => { setSuccess({ plan: currentPlan ?? "monthly", amount: r.price }); qc.invalidateQueries(); },
    onError: (e) => toastError(e),
  });

  const active = !!data?.profile?.subscription_active;
  const expires = data?.profile?.subscription_expires_at;
  const currentPlan = data?.profile?.plan_type as "monthly" | "yearly" | undefined;
  const level = ((data?.profile as { membership_level?: string } | null | undefined)?.membership_level ?? "pro") as "starter" | "pro";
  const isStarter = active && level === "starter";

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Narystė</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tavo lygis: <Badge variant="outline">{tierLabel}</Badge>
          </p>
        </div>
        {active && (
          <div className="rounded-lg bg-success/10 border border-success/40 px-3 py-2 text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-success" />
            <div>
              <div className="font-medium">Aktyvi ({currentPlan === "yearly" ? "metinė" : "mėnesinė"})</div>
              <div className="text-xs text-muted-foreground">iki {expires ? fmtDate(expires) : "—"}</div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade banner */}
      {active && currentPlan === "monthly" && upgradePreview.data?.canUpgrade && (
        <Card className="mb-6 p-5 border-primary/40 bg-gradient-to-br from-primary/5 to-background">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Pereik į metinį — sutaupyk {fmt(prices.monthly * 12 - prices.yearly)}</div>
                <div className="text-sm text-muted-foreground">
                  Kaina šiandien: <strong className="text-foreground">{fmt(upgradePreview.data.price)}</strong>{" "}
                  <span className="text-xs">(–{fmt(upgradePreview.data.credit)} kreditas už likusias {upgradePreview.data.daysLeft} d.)</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => upgrade.mutate()}
              disabled={upgrade.isPending}
              className="gradient-gold text-primary-foreground btn-press hover:opacity-90"
            >
              {upgrade.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Perkelti į metinį
            </Button>
          </div>
        </Card>
      )}

      {/* Starter -> PRO */}
      {isStarter && (
        <Card className="mb-6 border-primary/40 bg-gradient-to-br from-primary/10 to-background p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Turi bazinę narystę</div>
                <div className="text-sm text-muted-foreground">
                  Skelbimai, tiekėjai ir renginiai jau atviri. PRO priedas atveria klientų registracijas, kalendorių ir
                  mokėjimus — likusios bazinės narystės dienos įskaitomos į kainą.
                </div>
              </div>
            </div>
            <Button onClick={() => toPro.mutate()} disabled={toPro.isPending} className="gradient-gold text-primary-foreground btn-press">
              {toPro.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Pereiti į PRO
            </Button>
          </div>
        </Card>
      )}

      {/* Starter lygis */}
      {!active && (
        <Card className="mb-5 p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Megaphone className="h-4 w-4" /> Bazinė narystė
          </div>
          <div className="mt-2 font-display text-4xl">
            {fmt(STARTER_PRICING.monthly)} <span className="font-sans text-sm text-muted-foreground">/ mėn</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Arba {fmt(STARTER_PRICING.yearly)} / metams (2 mėn. nemokamai). Tinka, jei nori būti matoma ir naudotis
            skelbimais, bet registracijų per platformą nepriimi.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {["Viešas informacinis profilis", "Skelbimų skiltis (patalpos, įranga)", "Tiekėjų naujienos ir pasiūlymai", "Profesionalų tinklas"].map((x) => (
              <li key={x} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {x}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-secondary/50 p-3 text-[11px] text-muted-foreground">
            Be internetinių registracijų ir kalendoriaus — tam reikia PRO priedo (+10,00 € / mėn.).
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => { setSelectedLevel("starter"); setSelectedPlan("monthly"); setOpen(true); }}>
              Bazinė — mėnesinė
            </Button>
            <Button variant="outline" onClick={() => { setSelectedLevel("starter"); setSelectedPlan("yearly"); setOpen(true); }}>
              Bazinė — metinė
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-3 text-sm font-medium text-muted-foreground">PRO narystė (bazinė + PRO priedas) — pilna sistema su registracijomis</div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Monthly */}
        <Card className={`p-6 ${active && currentPlan === "monthly" ? "border-primary" : ""}`}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Mėnesinis
          </div>
          <div className="mt-2 text-4xl font-display">{fmt(prices.monthly)} <span className="text-sm text-muted-foreground font-sans">/ mėn</span></div>
          <p className="mt-1 text-xs text-muted-foreground">Lanksčiai — atsisakyk bet kada.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {["Viešas profilis su portfolio", "Rezervacijos ir kalendorius", "B2B tinklas", "Prioritetinis palaikymas"].map((x) => (
              <li key={x} className="flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> {x}</li>
            ))}
          </ul>
          {active && currentPlan === "monthly" ? (
            <Button disabled className="mt-6 w-full" variant="outline">Aktyvus planas</Button>
          ) : !active && (
            <Button onClick={() => { setSelectedLevel("pro"); setSelectedPlan("monthly"); setOpen(true); }} className="mt-6 w-full">Aktyvuoti mėnesinį</Button>
          )}
        </Card>

        {/* Yearly */}
        <Card className={`p-6 relative border-primary/40 ${active && currentPlan === "yearly" ? "border-primary shadow-elegant" : ""}`}>
          <div className="absolute -top-3 right-6 rounded-full gradient-gold px-3 py-1 text-[10px] font-semibold text-primary-foreground uppercase tracking-wide">
            2 mėn. nemokamai
          </div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
            <Sparkles className="h-4 w-4" /> Metinis
          </div>
          <div className="mt-2 text-4xl font-display">{fmt(prices.yearly)} <span className="text-sm text-muted-foreground font-sans">/ metams</span></div>
          <p className="mt-1 text-xs text-muted-foreground">≈ {fmt(prices.yearly / 12)} / mėn — sutaupai {fmt(prices.monthly * 12 - prices.yearly)}.</p>
          <ul className="mt-5 space-y-2 text-sm">
            {["Viskas iš mėnesinio", "2 mėnesiai dovanų", "Auksinis VIP ženklas visus metus", "Nemokamas straipsnių promotinimas 1x/mėn"].map((x) => (
              <li key={x} className="flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> {x}</li>
            ))}
          </ul>
          {active && currentPlan === "yearly" ? (
            <Button disabled className="mt-6 w-full" variant="outline">Aktyvus planas</Button>
          ) : (!active) && (
            <Button onClick={() => { setSelectedLevel("pro"); setSelectedPlan("yearly"); setOpen(true); }} className="mt-6 w-full gradient-gold text-primary-foreground btn-press hover:opacity-90">
              Aktyvuoti metinį
            </Button>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h3 className="font-display text-lg">Kaip veikia mokėjimai</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Demo režime naudojame simuliuojamą Stripe Sandbox. Įvedus testinę kortelę 4242 4242 4242 4242, tavo narystė iškart aktyvuojasi. Realūs mokėjimai bus prijungti platformos paleidimo metu.
          Pasibaigus narystei <strong>visi duomenys išlieka</strong> — reaktyvavus, viskas grįžta į vietas.
        </p>
        <div className="mt-4">
          <Link to="/pricing" className="text-primary text-sm hover:underline">Palyginti visus planus →</Link>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              Apmokėti {selectedLevel === "starter" ? "bazinę" : "PRO"} {selectedPlan === "yearly" ? "metinę" : "mėnesinę"} narystę
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs p-3 mb-4 font-medium">
            [DEMO] Kortelė: 4242 4242 4242 4242
          </div>
          <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-3">
            <div><Label>Kortelės numeris</Label><Input value={card} onChange={(e) => setCard(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Galiojimas</Label><Input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" /></div>
              <div><Label>CVC</Label><Input value={cvc} onChange={(e) => setCvc(e.target.value)} /></div>
            </div>
            <Button type="submit" disabled={mut.isPending} className="w-full gradient-gold text-primary-foreground btn-press">
              {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sumokėti {fmt(selectedLevel === "starter" ? STARTER_PRICING[selectedPlan] : prices[selectedPlan])}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!success} onOpenChange={() => setSuccess(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-success/20 flex items-center justify-center animate-spring-in">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <h2 className="mt-4 font-display text-2xl">Mokėjimas sėkmingas!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {success && `Tavo ${success.plan === "yearly" ? "metinė" : "mėnesinė"} narystė aktyvuota už ${fmt(success.amount)}.`}
            </p>
            <Button onClick={() => setSuccess(null)} className="mt-6 gradient-gold text-primary-foreground">Puiku!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
