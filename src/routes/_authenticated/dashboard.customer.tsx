import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/utils";
import { LipsIcon } from "@/components/lips-icon";
import { CalendarClock, CheckCircle2, XCircle, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { CancelAppointmentDialog } from "@/components/cancel-appointment-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/customer")({
  component: ClientDashboard,
  head: () => ({
    meta: [
      { title: "Mano rezervacijos – PaslaugosGrožiui" },
      { name: "description", content: "Visos tavo grožio paslaugų rezervacijos vienoje vietoje: laukiančios patvirtinimo, patvirtintos ir atšauktos." },
      { property: "og:title", content: "Mano rezervacijos" },
      { property: "og:description", content: "Sek savo vizitų būsenas realiu laiku." },
    ],
  }),
});

type Tab = "upcoming" | "pending" | "past" | "cancelled";

const STATUS: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  pending: { label: "Laukiama patvirtinimo", icon: Clock, cls: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  confirmed: { label: "Patvirtinta", icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  completed: { label: "Įvykusi", icon: CheckCircle2, cls: "bg-primary/15 text-primary border-primary/30" },
  cancelled: { label: "Atšaukta", icon: XCircle, cls: "bg-destructive/15 text-destructive border-destructive/30" },
};

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "upcoming", label: "Būsimos" },
  { key: "pending", label: "Laukia" },
  { key: "past", label: "Įvykusios" },
  { key: "cancelled", label: "Atšauktos" },
];

function ClientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["client-appts", user?.id, user?.email],
    enabled: !!user,
    queryFn: async () => {
      if (!user?.id) return [];
      const filters = [`client_user_id.eq.${user.id}`];
      if (user?.email) filters.push(`client_email.eq.${user.email}`);
      if (user?.phone) filters.push(`client_phone.eq.${user.phone}`);
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .or(filters.join(","))
        .order("appointment_date", { ascending: false });
      return data ?? [];
    },
  });

  const all = data ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const filtered = all.filter((a) => {
    if (tab === "cancelled") return a.status === "cancelled";
    if (tab === "pending") return a.status === "pending";
    if (tab === "upcoming") return a.status === "confirmed" && a.appointment_date >= today;
    return a.status === "completed" || (a.status !== "cancelled" && a.appointment_date < today);
  });

  const counts = {
    upcoming: all.filter((a) => a.status === "confirmed" && a.appointment_date >= today).length,
    pending: all.filter((a) => a.status === "pending").length,
    cancelled: all.filter((a) => a.status === "cancelled").length,
  };

  return (
    <DashboardShell>
      <div className="mb-5">
        <h1 className="font-display text-3xl">Mano rezervacijos</h1>
        <p className="text-sm text-muted-foreground">
          {counts.upcoming} būsimos · {counts.pending} laukia patvirtinimo
        </p>
      </div>

      <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-full px-4 text-sm transition active:scale-95 ${
              tab === t.key ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
            }`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <LipsIcon className="mx-auto mb-2 h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Šioje skiltyje rezervacijų nėra.</p>
          <Link to="/search" className="mt-3 inline-block">
            <Button size="sm">Ieškoti laisvo laiko</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const st = STATUS[a.status] ?? STATUS.pending;
            const Icon = st.icon;
            return (
              <Card key={a.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{a.service_name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {fmtDate(a.appointment_date)} · {a.time_slot.slice(0, 5)}
                      </span>
                      <span>{a.duration_mins} min</span>
                    </div>
                    {a.status === "cancelled" && a.cancellation_reason && (
                      <div className="mt-1 text-xs italic text-destructive">{a.cancellation_reason}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={st.cls}>
                      <Icon className="mr-1 h-3 w-3" />
                      {st.label}
                    </Badge>
                    <Link to="/appointment/$token" params={{ token: a.cancel_token }} className="text-xs text-primary hover:underline">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Detalės</span>
                    </Link>
                    {(a.status === "pending" || a.status === "confirmed") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => { setCancelId(a.id); setCancelOpen(true); }}
                      >
                        Atšaukti
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <CancelAppointmentDialog appointmentId={cancelId} open={cancelOpen} onOpenChange={setCancelOpen} />
    </DashboardShell>
  );
}
