import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelMyAppointment, previewCancellation } from "@/lib/policies.functions";
import { PaymentCardPicker } from "@/components/payment-card-picker";
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR" }).format(n);
}

export function CancelAppointmentDialog({
  appointmentId,
  open,
  onOpenChange,
}: {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const qc = useQueryClient();
  const preview = useServerFn(previewCancellation);
  const cancelFn = useServerFn(cancelMyAppointment);
  const [cardId, setCardId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cancel-preview", appointmentId],
    queryFn: () => preview({ data: { appointmentId: appointmentId! } }),
    enabled: !!appointmentId && open,
    retry: false,
  });

  const mut = useMutation({
    mutationFn: () => cancelFn({ data: { appointmentId: appointmentId!, ...(cardId ? { cardId } : {}) } }),
    onSuccess: (r) => {
      onOpenChange(false);
      toast.success(r.fee > 0 ? `Vizitas atšauktas · nuskaityta ${fmt(r.fee)}` : "Vizitas atšauktas");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
      qc.invalidateQueries({ queryKey: ["client-appts"] });
    },
    onError: (e) => {
      const msg = (e as Error).message;
      toast.error(msg === "NO_CARD" ? "Pridėk kortelę, kad galėtume nuskaityti atšaukimo mokestį." : msg);
    },
  });

  const late = !!data?.late && (data?.fee ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md overflow-hidden rounded-2xl">
        <DialogHeader>
          <div className={`mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full ${late ? "bg-destructive/15" : "bg-success/15"}`}>
            {late ? <AlertTriangle className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6 text-success" />}
          </div>
          <DialogTitle className="text-center font-display text-2xl">Atšaukti vizitą?</DialogTitle>
          <DialogDescription className="text-center">
            {isLoading
              ? "Tikriname saloną ir atšaukimo politiką…"
              : late
                ? `${data?.salonName} taiko ${data?.feePercent}% mokestį už vėlyvą atšaukimą.`
                : "Atšaukimas nemokamas — laiko dar pakankamai."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <div className="skeleton h-20 rounded-xl" />}

        {!isLoading && data && (
          <div className="space-y-3">
            <div className="rounded-xl border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paslaugos kaina</span>
                <span className="font-medium">{fmt(data.price)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-muted-foreground">Atšaukimo mokestis</span>
                <span className={`font-semibold ${late ? "text-destructive" : "text-success"}`}>
                  {late ? fmt(data.fee) : "0,00 €"}
                </span>
              </div>
              {data.windowMins > 0 && data.feePercent > 0 && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Mokestis taikomas, kai iki vizito lieka mažiau nei {Math.round(data.windowMins / 60)} val.
                </p>
              )}
            </div>

            {late && (
              <div>
                <div className="mb-1.5 text-xs font-medium">Kortelė nuskaitymui</div>
                <PaymentCardPicker compact selectedId={cardId} onSelect={setCardId} />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Palikti vizitą</Button>
          <Button
            variant={late ? "destructive" : "default"}
            disabled={mut.isPending || isLoading}
            onClick={() => mut.mutate()}
            className={late ? "" : "gradient-gold text-primary-foreground"}
          >
            {mut.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {late ? `Atšaukti · ${fmt(data?.fee ?? 0)}` : "Atšaukti"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
