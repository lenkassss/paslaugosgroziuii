import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Copy, Users } from "lucide-react";
import { getMyReferralStatus } from "@/lib/referrals.functions";

/** Nemokamo periodo ir pakvietimų kortelė: 2 mėn. + 3-ias už 10 pakvietimų. */
export function ReferralCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["referral-status"],
    queryFn: () => getMyReferralStatus(),
    staleTime: 60_000,
  });

  if (isLoading) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (!data) return null;

  const link = typeof window !== "undefined" && data.code
    ? `${window.location.origin}/for-business?ref=${data.code}`
    : "";
  const pct = Math.min(100, Math.round((data.invitedCount / data.goal) * 100));

  return (
    <Card className="mt-4 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-semibold">
          <Gift className="h-4 w-4 text-cyclamen" /> Nemokamas periodas
        </div>
        {data.freeUntil && (
          <span className="text-xs text-muted-foreground">
            Nemokama iki {new Date(data.freeUntil).toLocaleDateString("lt-LT")}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Pirmi 2 mėnesiai – nemokamai. Pakviesk {data.goal} žmonių ir gauk dar 1 mėnesį.
      </p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{data.invitedCount} / {data.goal} pakvietimų</span>
          {data.bonusGranted && <span className="text-cyclamen">Papildomas mėnuo gautas</span>}
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-cyclamen transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {link && (
        <div className="mt-4 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs">{link}</code>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                toast.success("Nuoroda nukopijuota");
              } catch {
                toast.error("Nepavyko nukopijuoti");
              }
            }}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />Kopijuoti
          </Button>
        </div>
      )}
    </Card>
  );
}
