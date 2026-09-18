import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Wrench, Clock, ShieldCheck } from "lucide-react";
import { getSiteSettings } from "@/lib/settings.functions";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

/**
 * MAINTENANCE_MODE gate (admin toggle in Sistemos nustatymai).
 * When on, EVERY page for every visitor shows the maintenance screen —
 * with the admin-provided reason and expected duration.
 * Admins keep full access; /auth stays reachable so admins can sign in.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { realRole, loading: authLoading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => getSiteSettings(),
    staleTime: 60_000,
  });

  const on = !!data?.features?.maintenance_mode;
  const bypass =
    authLoading ||
    realRole === "admin" ||
    realRole === "super_admin" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin");

  if (!on || bypass) return <>{children}</>;

  const reason = String(data?.features?.maintenance_reason ?? "").trim();
  const duration = String(data?.features?.maintenance_until ?? "").trim();
  const brand = data?.brand_name || "PaslaugosGrožiui";

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-accent/60 blur-3xl" />

      <div className="relative w-full max-w-lg animate-slide-up rounded-3xl glass p-7 text-center shadow-elegant sm:p-9">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full gradient-gold text-primary-foreground">
          <Wrench className="h-7 w-7" />
        </div>

        <h1 className="mt-5 font-display text-2xl sm:text-3xl">Šiuo metu vyksta atnaujinimai</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Atsiprašome už laikinus techninius nesklandumus — {brand} platforma šiuo metu atnaujinama, kad viskas
          veiktų dar sklandžiau. Netrukus grįžtame.
        </p>

        {reason && (
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 p-4 text-left">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Priežastis
            </div>
            <p className="text-sm">{reason}</p>
          </div>
        )}

        {duration && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-sm font-medium">
            <Clock className="h-4 w-4 text-primary" /> Numatoma trukmė: {duration}
          </div>
        )}

        {data?.announcement && (
          <p className="mt-4 text-xs text-muted-foreground">{data.announcement}</p>
        )}

        <Button asChild variant="outline" className="mt-7 h-11 w-full rounded-xl active:scale-95">
          <Link to="/auth" search={{ mode: "signin" }}>Administratoriaus prisijungimas</Link>
        </Button>
      </div>
    </div>
  );
}
