import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAppointmentByToken, clientCancelAppointmentByToken } from "@/lib/platform.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Phone, Sparkles, X, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/appointment/$token")({
  component: AppointmentPage,
  head: () => ({ meta: [{ title: "Mano vizitas · PaslaugosGrožiui" }, { name: "robots", content: "noindex" }] }),
});

function AppointmentPage() {
  const { token } = Route.useParams();
  const qc = useQueryClient();
  const getFn = useServerFn(getAppointmentByToken);
  const cancelFn = useServerFn(clientCancelAppointmentByToken);

  const q = useQuery({
    queryKey: ["appt-token", token],
    queryFn: () => getFn({ data: { token } }),
    retry: false,
  });

  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);

  const cancelMut = useMutation({
    mutationFn: () => cancelFn({ data: { token, reason: reason || undefined } }),
    onSuccess: () => {
      toast.success("Vizitas atšauktas.");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["appt-token", token] });
    },
    onError: (e) => toastError(e),
  });

  if (q.isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <h1 className="font-display text-2xl">Vizitas nerastas</h1>
          <p className="text-sm text-muted-foreground mt-2">Nuoroda gali būti pasenusi arba negaliojanti.</p>
        </Card>
      </div>
    );
  }

  const a = q.data.appointment as {
    id: string; salon_id: string; service_name: string; client_name: string; client_phone: string; client_email: string | null;
    appointment_date: string; time_slot: string; duration_mins: number; status: string;
    confirmation_channel: string; cancellation_reason: string | null; cancelled_at: string | null;
    business_name: string | null; address: string | null; city: string | null; phone: string | null;
  };
  const cancelled = a.status === "cancelled";
  const dateFmt = new Date(a.appointment_date + "T" + a.time_slot).toLocaleDateString("lt-LT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
      <Card className="overflow-hidden shadow-elegant">
        <div className="gradient-gold text-primary-foreground p-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Rezervacijos patvirtinimas
          </div>
          <h1 className="font-display text-3xl mt-2">{a.service_name}</h1>
          <div className="mt-1 text-sm opacity-95">{a.business_name}</div>
        </div>
        <div className="p-6 space-y-5">
          {cancelled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Vizitas atšauktas</AlertTitle>
              <AlertDescription>{a.cancellation_reason ?? "Šis vizitas nebegalioja."}</AlertDescription>
            </Alert>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <InfoRow icon={Calendar} label="Data" value={dateFmt} />
            <InfoRow icon={Clock} label="Laikas" value={`${a.time_slot.slice(0,5)} · ${a.duration_mins} min`} />
            <InfoRow icon={MapPin} label="Vieta" value={[a.address, a.city].filter(Boolean).join(", ") || "—"} />
            <InfoRow icon={Phone} label="Salono tel." value={a.phone ?? "—"} />
          </div>

          <div className="rounded-lg border border-border/60 p-4 bg-secondary/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Klientas</div>
            <div className="font-medium">{a.client_name}</div>
            <div className="text-xs text-muted-foreground">{a.client_phone}{a.client_email ? ` · ${a.client_email}` : ""}</div>
            <div className="mt-2 flex gap-1.5">
              <Badge variant="outline">Patvirtinimas: {channelLabel(a.confirmation_channel)}</Badge>
              <Badge variant={cancelled ? "destructive" : "default"}>{statusLabel(a.status)}</Badge>
            </div>
          </div>

          {!cancelled && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Svarbu — grąžinimai netaikomi</AlertTitle>
                <AlertDescription>
                  Atšaukus vizitą sumokėti pinigai (jei tokie buvo) negrąžinami. Jei norite perkelti į kitą dieną — susisiekite tiesiogiai su salonu telefonu.
                </AlertDescription>
              </Alert>

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full"><X className="h-4 w-4 mr-2" />Atšaukti vizitą</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Ar tikrai atšaukti?</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Alert variant="destructive">
                      <AlertDescription>Pinigai negrąžinami. Salonas gaus pranešimą apie atšaukimą.</AlertDescription>
                    </Alert>
                    <div>
                      <Label>Priežastis (nebūtina)</Label>
                      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Susirgau, neatvyksiu..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Nevisai</Button>
                    <Button variant="destructive" onClick={() => cancelMut.mutate()} disabled={cancelMut.isPending}>
                      {cancelMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Taip, atšaukti
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {cancelled && (
            <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-success" /> Atšaukimas užregistruotas.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Icon className="h-3 w-3" />{label}</div>
      <div className="mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function statusLabel(s: string) {
  return s === "confirmed" ? "Patvirtintas" : s === "pending" ? "Laukiama" : s === "cancelled" ? "Atšauktas" : s === "completed" ? "Įvykęs" : s;
}
function channelLabel(c: string) {
  return c === "email" ? "El. paštu" : c === "sms" ? "SMS" : c === "both" ? "El. paštu + SMS" : "Be pranešimų";
}
