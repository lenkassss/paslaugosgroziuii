import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProGate } from "@/components/pro-gate";
import { useQuery } from "@tanstack/react-query";
import { getSalonDashboard } from "@/lib/platform.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/salon/appointments")({
  component: Appointments,
});

function Appointments() {
  const { data } = useQuery({ queryKey: ["salon-dashboard"], queryFn: () => getSalonDashboard({ data: undefined }) });
  const appts = data?.appointments ?? [];
  const isStaff = !!data?.staff;
  return (
    <DashboardShell>
      <ProGate feature="klientų rezervacijos">
      <h1 className="font-display text-3xl mb-2">{isStaff ? "Mano rezervacijos" : "Visos rezervacijos"}</h1>
      {isStaff && <p className="mb-6 text-sm text-muted-foreground">Rodomi tik tau priskirti vizitai.</p>}
      <Card className="divide-y">
        {appts.length === 0 && <div className="p-8 text-center text-muted-foreground">Kol kas rezervacijų nėra.</div>}
        {appts.map((a) => (
          <div key={a.id} className="p-4 flex flex-col sm:flex-row justify-between gap-2">
            <div>
              <div className="font-medium">{a.service_name}</div>
              <div className="text-sm text-muted-foreground">{a.client_name} · {a.client_phone}{a.client_email ? ` · ${a.client_email}` : ""}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium">{fmtDate(a.appointment_date)}</div>
                <div className="text-xs text-muted-foreground">{a.time_slot.slice(0, 5)} · {a.duration_mins} min</div>
              </div>
              <Badge variant={a.status === "confirmed" ? "default" : a.status === "cancelled" ? "destructive" : "secondary"}>{a.status}</Badge>
            </div>
          </div>
        ))}
      </Card>
      </ProGate>
    </DashboardShell>
  );
}
