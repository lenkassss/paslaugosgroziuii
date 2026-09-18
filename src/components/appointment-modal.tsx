import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { rescheduleAppointment, cancelAppointment, setAppointmentStatus } from "@/lib/platform.functions";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarClock, X, CheckCircle2, UserX, Phone, Mail, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export type ApptRow = {
  id: string; service_name: string; client_name: string; client_phone: string; client_email: string | null;
  appointment_date: string; time_slot: string; duration_mins: number; status: string;
  confirmation_channel?: string | null; notes?: string | null; cancellation_reason?: string | null;
};

export function AppointmentModal({ appt, open, onClose }: { appt: ApptRow | null; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"view" | "reschedule" | "cancel">("view");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");

  const resFn = useServerFn(rescheduleAppointment);
  const cancFn = useServerFn(cancelAppointment);
  const statusFn = useServerFn(setAppointmentStatus);

  const reschedMut = useMutation({
    mutationFn: () => resFn({ data: { id: appt!.id, date, time } }),
    onSuccess: () => { toast.success("Vizitas perkeltas"); done(); },
    onError: (e) => toastError(e),
  });
  const cancMut = useMutation({
    mutationFn: () => cancFn({ data: { id: appt!.id, reason: reason || undefined } }),
    onSuccess: () => { toast.success("Vizitas atšauktas"); done(); },
    onError: (e) => toastError(e),
  });
  const statusMut = useMutation({
    mutationFn: (s: "confirmed" | "completed") => statusFn({ data: { id: appt!.id, status: s } }),
    onSuccess: () => { toast.success("Būsena atnaujinta"); done(); },
    onError: (e) => toastError(e),
  });

  function done() {
    qc.invalidateQueries({ queryKey: ["salon-dashboard"] });
    setTab("view"); setDate(""); setTime(""); setReason("");
    onClose();
  }

  if (!appt) return null;
  const isPast = new Date(appt.appointment_date + "T" + appt.time_slot) < new Date();
  const isCancelled = appt.status === "cancelled";

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => { if (!v) done(); }}
      title={appt.service_name}
    >
      <div className="-mt-1 mb-4 flex flex-wrap items-center gap-2">
        <Badge variant={isCancelled ? "destructive" : appt.status === "completed" ? "secondary" : "default"}>
          {statusLabel(appt.status)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(appt.appointment_date).toLocaleDateString("lt-LT", { weekday: "short", day: "numeric", month: "long" })} · {appt.time_slot.slice(0,5)} · {appt.duration_mins} min
        </span>
      </div>


        {tab === "view" && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 bg-secondary/40 space-y-1">
              <div className="font-medium">{appt.client_name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{appt.client_phone}</div>
              {appt.client_email && <div className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{appt.client_email}</div>}
              {appt.notes && <div className="text-sm mt-2 pt-2 border-t border-border/60">{appt.notes}</div>}
              {appt.cancellation_reason && <div className="text-sm mt-2 pt-2 border-t border-border/60 text-destructive">Atšaukimo priežastis: {appt.cancellation_reason}</div>}
            </div>

            {!isCancelled && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setDate(appt.appointment_date); setTime(appt.time_slot.slice(0,5)); setTab("reschedule"); }}>
                  <CalendarClock className="h-4 w-4 mr-1.5" />Perkelti
                </Button>
                <Button variant="destructive" onClick={() => setTab("cancel")}>
                  <X className="h-4 w-4 mr-1.5" />Atšaukti
                </Button>
                {isPast && appt.status === "confirmed" && (
                  <>
                    <Button variant="secondary" onClick={() => statusMut.mutate("completed")} disabled={statusMut.isPending}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />Įvyko
                    </Button>
                    <Button variant="outline" onClick={() => cancMut.mutate()} disabled={cancMut.isPending}>
                      <UserX className="h-4 w-4 mr-1.5" />Neatvyko
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "reschedule" && (
          <div className="space-y-3">
            <Alert><AlertDescription>Klientas bus informuotas apie pakeitimą.</AlertDescription></Alert>
            <div className="grid grid-cols-[2fr_1fr] gap-2 items-end">
              <div>
                <Label>Nauja data</Label>
                <Input type="date" value={date} min={new Date().toISOString().slice(0,10)} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Laikas</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{appt.appointment_date} {appt.time_slot.slice(0,5)}</span>
              <ArrowRight className="h-3 w-3" />
              <span className="text-primary font-medium">{date || "—"} {time || "—"}</span>
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setTab("view")}>Atgal</Button>
              <Button disabled={!date || !time || reschedMut.isPending} onClick={() => reschedMut.mutate()} className="gradient-gold text-primary-foreground">
                {reschedMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Patvirtinti perkėlimą
              </Button>
            </div>
          </div>
        )}

        {tab === "cancel" && (
          <div className="space-y-3">
            <Alert variant="destructive"><AlertDescription>Klientui bus išsiųstas pranešimas. Pinigai (jei buvo) negrąžinami.</AlertDescription></Alert>
            <div>
              <Label>Priežastis (matys klientas)</Label>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Meistras sirgs, kviečiame perkelti kitą kartą..." />
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setTab("view")}>Atgal</Button>
              <Button variant="destructive" onClick={() => cancMut.mutate()} disabled={cancMut.isPending}>
                {cancMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Atšaukti vizitą
              </Button>
            </div>
          </div>
        )}
    </ResponsiveModal>
  );
}

function statusLabel(s: string) {
  return s === "confirmed" ? "Patvirtintas" : s === "pending" ? "Laukiama" : s === "cancelled" ? "Atšauktas" : s === "completed" ? "Įvykęs" : s;
}
