import { Link } from "@tanstack/react-router";
import { Briefcase, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { isBusinessRole } from "@/lib/access";
import { dashboardPathFor } from "@/lib/dashboard-path";

/**
 * Verslo paskyra eina tiesiai į savo valdymo skiltį (šoninė juosta),
 * kiti – į verslo rolių puslapį.
 */
export function BusinessCta() {
  const { role } = useAuth();

  if (isBusinessRole(role)) {
    return (
      <Link
        to={dashboardPathFor(role) as never}
        className="inline-flex items-center gap-2 rounded-full border border-cyclamen/40 bg-cyclamen/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-cyclamen transition active:scale-95 hover:bg-cyclamen/15"
      >
        <Briefcase className="h-3.5 w-3.5" /> Mano valdymas
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  return (
    <Link
      to="/for-business"
      className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-bold uppercase tracking-wide text-background transition active:scale-95 hover:opacity-90"
    >
      <Briefcase className="h-3.5 w-3.5" /> Verslui
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
