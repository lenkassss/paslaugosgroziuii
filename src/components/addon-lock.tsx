import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listMyAddons } from "@/lib/addons.functions";
import { useLanguage } from "@/lib/use-language";
import { uiText } from "@/lib/ui-copy";

/**
 * Kiek liko nupirktų kreditų pasirinktoms paslaugoms.
 * Kol kreditų nėra, forma rodoma užrakinta ir vartotojas nukreipiamas pirkti paketą.
 */
export function useAddonCredits(keys: string[]) {
  const q = useQuery({ queryKey: ["my-addons"], queryFn: () => listMyAddons({ data: undefined }) });
  const remaining = (q.data?.addons ?? [])
    .filter((a) => keys.includes(a.key) && a.active)
    .reduce((sum, a) => sum + Math.max(0, a.credits_remaining ?? 0), 0);
  return { remaining, unlocked: remaining > 0, loading: q.isLoading };
}

/**
 * Kietas užraktas: kol nėra kreditų, forma rodoma neryški, visi laukai išjungti,
 * o viršuje – užrakto sluoksnis su pirkimo mygtuku.
 */
export function AddonGate({
  unlocked,
  loading,
  children,
}: {
  unlocked: boolean;
  loading?: boolean;
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const copy = (v: string) => uiText(v, lang);
  if (unlocked || loading) return <>{children}</>;
  return (
    <div className="relative">
      <fieldset disabled aria-hidden className="pointer-events-none select-none blur-[3px] saturate-50 opacity-60">
        {children}
      </fieldset>
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </span>
          <p className="text-sm font-semibold">
            {copy("Funkcija užrakinta. Jūs neturite aktyvaus plano/kreditų šiai paslaugai.")}
          </p>
          <Button asChild className="mt-4 h-11 w-full rounded-xl">
            <Link to="/dashboard/addons">{copy("PIRKTI PAKETĄ")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Užrakto juosta virš kūrimo formos. */
export function AddonLockBanner({
  remaining,
  unlocked,
  unit = "publikacijos",
}: {
  remaining: number;
  unlocked: boolean;
  unit?: string;
}) {
  const { lang } = useLanguage();
  const copy = (v: string) => uiText(v, lang);
  if (unlocked) {
    return (
      <div className="mb-4 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm">
        {copy("Turite nepanaudotų kreditų")}: <strong>{remaining}</strong> {copy(unit)}.
      </div>
    );
  }
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2 font-medium">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        {copy("Ši funkcija neaktyvi. Įsigykite paketą, kad galėtumėte publikuoti.")}
      </span>
      <Button asChild size="sm" className="shrink-0 rounded-xl">
        <Link to="/dashboard/addons">{copy("PIRKTI PAKETĄ")}</Link>
      </Button>
    </div>
  );
}
