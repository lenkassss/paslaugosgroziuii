import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyVerification } from "@/lib/payments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ShieldAlert, Clock } from "lucide-react";

export type VerificationState = "unverified" | "pending" | "verified" | "rejected";

export function useVerificationState() {
  const fn = useServerFn(getMyVerification);
  const q = useQuery({ queryKey: ["my-verification"], queryFn: () => fn() });
  const status = (q.data?.verification_status ?? "unverified") as VerificationState;
  return { status, reason: q.data?.rejection_reason ?? null, isLoading: q.isLoading, verified: status === "verified" };
}

/**
 * Mandatory onboarding banner for schools & employers.
 * Publishing is blocked until the account is verified by the PaslaugosGrožiui team.
 */
export function VerificationGate({ kind }: { kind: "school" | "employer" }) {
  const { status, reason, isLoading } = useVerificationState();
  if (isLoading || status === "verified") return null;

  const label = kind === "school" ? "mokyklos" : "darbdavio";

  if (status === "pending") {
    return (
      <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-medium">Jūsų {label} paskyra tikrinama</div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Patvirtinsime per 1–2 darbo dienas. Iki tol galite ruošti turinį, bet jis nebus viešai matomas.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-4 border-destructive/40 bg-destructive/5">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-start">
        <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="min-w-0">
          <div className="font-medium">
            {status === "rejected" ? "Patvirtinimas atmestas" : `Privalomas ${label} patvirtinimas`}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {status === "rejected"
              ? reason || "Pateikti dokumentai neatitiko reikalavimų. Pateikite iš naujo."
              : "Kad skelbimai taptų vieši, pateikite įmonės dokumentus ir asmens tapatybę. Tai apsaugo vartotojus nuo apgaulingų skelbimų."}
          </p>
          <Button asChild size="sm" className="mt-3 gradient-gold text-primary-foreground">
            <Link to="/dashboard/salon/verification">
              <BadgeCheck className="h-4 w-4 mr-1.5" /> Pateikti dokumentus
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
