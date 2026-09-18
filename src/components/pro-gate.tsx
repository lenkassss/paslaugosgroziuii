import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSalonDashboard, upgradeToPro } from "@/lib/platform.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, CalendarCheck, CreditCard, BellRing, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";
import { TIER_PRICING, eurFromNumber } from "@/lib/access";

/** Ar naudotojas turi PRO narystę (rezervacijos, kalendorius, paslaugos). */
export function useIsPro() {
  const { data, isLoading } = useQuery({
    queryKey: ["salon-dashboard"],
    queryFn: () => getSalonDashboard({ data: undefined }),
    retry: false,
  });
  const profile = data?.profile as { membership_level?: string; subscription_active?: boolean } | null | undefined;
  const active = !!profile?.subscription_active;
  const level = active ? (profile?.membership_level === "pro" ? "pro" : "basic") : "none";
  return { isPro: active && level === "pro", level, active, loading: isLoading };
}

/**
 * Prabangūs PRO vartai: bazinės narystės nariams funkcija užrakinta —
 * atrakinama per „Papildomos paslaugos“ (PRO priedas).
 */
export function ProGate({ feature, children }: { feature: string; children: ReactNode }) {
  const { isPro, loading } = useIsPro();
  const qc = useQueryClient();
  const upgrade = useServerFn(upgradeToPro);

  const mut = useMutation({
    mutationFn: () => upgrade({ data: undefined }),
    onSuccess: (r) => {
      toast.success(`PRO priedas aktyvuotas už ${r.price.toFixed(2).replace(".", ",")} €`);
      qc.invalidateQueries();
    },
    onError: (e) => toastError(e),
  });

  if (loading || isPro) return <>{children}</>;

  return (
    <Card className="relative overflow-hidden rounded-3xl border-primary/30 bg-[radial-gradient(120%_120%_at_100%_0%,hsl(var(--primary)/0.18),transparent_60%)] p-6 shadow-elegant sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative mx-auto max-w-xl text-center">
        <Badge className="gradient-gold border-0 text-primary-foreground">PRO priedas</Badge>
        <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-gold shadow-glow">
          <Lock className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="mt-5 font-display text-2xl leading-tight sm:text-3xl">{feature} — užrakinta</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bazinė narystė yra informacinė: profilis, darbų foto, kontaktai, skelbimai, tiekėjų pasiūlymai ir mokymai.
          Registracijų sistemą atrakina <strong>PRO priedas</strong> — {eurFromNumber(TIER_PRICING.proUpgrade.eur)}/mėn.
        </p>

        <div className="mt-6 grid gap-2 text-left text-sm">
          {[
            { Icon: CalendarCheck, text: "Kalendorius, darbo laikas ir laikų uždarymas" },
            { Icon: Crown, text: "Paslaugų kainos, trukmės ir depozitai" },
            { Icon: BellRing, text: "Automatiniai patvirtinimai ir priminimai" },
            { Icon: CreditCard, text: "Apmokėjimai aplikacijoje ir apsauga nuo neatvykimų" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-3.5 backdrop-blur">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <f.Icon className="h-4 w-4 text-primary" />
              </span>
              <span className="min-w-0">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 grid gap-2 sm:grid-cols-2">
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            size="lg"
            className="gradient-gold text-primary-foreground btn-press shadow-elegant"
          >
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Atrakinti PRO
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard/addons">
              <Sparkles className="mr-2 h-4 w-4" /> Visos papildomos paslaugos
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Likusios bazinės narystės dienos automatiškai įskaitomos į PRO kainą.
        </p>
      </div>
    </Card>
  );
}
