import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { fmtDate } from "@/lib/utils";

export function MembershipBanner({ active, isPro = false, expiresAt, ctaPath }: { active: boolean; isPro?: boolean; expiresAt?: string | null; ctaPath: string }) {
  if (active) {
    return (
      <Card className="p-4 mb-6 border-success/40 bg-success/10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <div className="text-sm font-medium">{isPro ? "PRO narystė aktyvi" : "Bazinė narystė aktyvi"}</div>
              {expiresAt && <div className="text-xs text-muted-foreground">Galioja iki {fmtDate(expiresAt)}</div>}
            </div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <Card className="p-4 mb-6 border-destructive/40 bg-destructive/5 animate-slide-up">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <div className="text-sm font-medium">Jūsų narystė neaktyvi</div>
            <div className="text-xs text-muted-foreground">Jūs nesate rodomi žemėlapyje ir negalite rašyti į B2B tinklą.</div>
          </div>
        </div>
        <Button asChild size="sm" className="gradient-gold text-primary-foreground btn-press">
          <Link to={ctaPath}>Aktyvuoti narystę</Link>
        </Button>
      </div>
    </Card>
  );
}
