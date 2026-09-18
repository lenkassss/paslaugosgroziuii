import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAppointments } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CalendarDays } from "lucide-react";
import { useState } from "react";
import { statusLabel } from "@/lib/role-labels";
import { fmtMoney } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/appointments")({
  component: AdminAppointments,
});

const FILTERS = [
  { key: "all", label: "Visos" },
  { key: "pending", label: "Laukiama" },
  { key: "confirmed", label: "Patvirtintos" },
  { key: "cancelled", label: "Atšauktos" },
  { key: "completed", label: "Įvykdytos" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function statusVariant(status: string) {
  if (status === "confirmed") return "default" as const;
  if (status === "cancelled") return "destructive" as const;
  return "secondary" as const;
}

function AdminAppointments() {
  const fn = useServerFn(adminListAppointments);
  const [status, setStatus] = useState<FilterKey>("all");
  const [q, setQ] = useState("");

  const query = useQuery({
    queryKey: ["admin-appointments", status],
    queryFn: () => fn({ data: { limit: 200, status } }),
  });

  const rows = (query.data?.appointments ?? []).filter((a: any) => {
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return [a.client_name, a.client_email, a.client_phone, a.salon_name, a.service_name]
      .some((v) => String(v ?? "").toLowerCase().includes(needle));
  });

  return (
    <DashboardShell>
      <div className="mb-5">
        <h1 className="font-display text-2xl sm:text-3xl">Visos rezervacijos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pilnas platformos rezervacijų vaizdas.</p>
      </div>

      <div className="mb-4 space-y-3">
        <Input placeholder="Paieška: klientas, salonas, paslauga..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {FILTERS.map((f) => (
            <Button key={f.key} size="sm" variant={status === f.key ? "default" : "outline"}
              className={`shrink-0 ${status === f.key ? "gradient-gold text-primary-foreground" : ""}`}
              onClick={() => setStatus(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {query.isLoading && (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Kraunama...
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b p-4 text-xs text-muted-foreground">Rodoma: {rows.length}</div>
        <div className="divide-y">
          {rows.map((a: any) => (
            <div key={a.id} className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.client_name || "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.client_phone || "—"}{a.client_email ? ` · ${a.client_email}` : ""}
                  </div>
                  <div className="mt-1 truncate text-xs">
                    <span className="text-muted-foreground">Salonas:</span> {a.salon_name}
                  </div>
                  <div className="truncate text-xs">
                    <span className="text-muted-foreground">Paslauga:</span> {a.service_name}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={statusVariant(a.status)}>{statusLabel(a.status)}</Badge>
                  {Number(a.deposit_amount) > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      Depozitas: {statusLabel(a.deposit_status)}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(`${a.appointment_date}T00:00:00`).toLocaleDateString("lt-LT")} · {String(a.time_slot).slice(0, 5)}
                </span>
                <span>{a.duration_mins} min.</span>
                {Number(a.service_price) > 0 && <span>{fmtMoney(Number(a.service_price))}</span>}
              </div>
            </div>
          ))}
          {!query.isLoading && rows.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">Rezervacijų nerasta.</div>
          )}
        </div>
      </Card>
    </DashboardShell>
  );
}
