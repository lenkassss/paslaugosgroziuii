import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyEventsWithCounts, listEventRegistrations, setRegistrationStatus } from "@/lib/events.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/salon/events")({
  component: MyEvents,
});

export function MyEvents() {
  const list = useServerFn(listMyEventsWithCounts);
  const q = useQuery({ queryKey: ["my-events"], queryFn: () => list() });
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Mano renginiai</h1>
        <p className="text-sm text-muted-foreground mt-1">Registracijų valdymas, dalyvių sąrašai, būsenų keitimas.</p>
      </div>

      {q.isLoading && <div className="flex items-center gap-2 text-muted-foreground p-6"><Loader2 className="h-4 w-4 animate-spin" /> Kraunama...</div>}

      {q.data && q.data.events.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          Kol kas neturi renginių.
          <div className="mt-4"><Button asChild className="gradient-gold text-primary-foreground"><Link to="/dashboard/salon/content">Sukurti pirmą</Link></Button></div>
        </Card>
      )}

      <div className="space-y-3">
        {q.data?.events.map((e) => {
          const c = q.data.counts[e.id] ?? { total: 0, seats: 0 };
          const starts = e.event_starts_at ? new Date(e.event_starts_at) : null;
          return (
            <Card key={e.id} className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                {e.cover_url && <img src={e.cover_url} alt="" className="h-16 w-24 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                    {starts && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{starts.toLocaleString("lt-LT")}</span>}
                    {e.event_location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.event_location}</span>}
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.seats}{e.event_seats ? `/${e.event_seats}` : ""} registracijų</span>
                  </div>
                </div>
                <Badge variant="outline">{c.total} įrašų</Badge>
                <Button size="sm" variant="outline" onClick={() => setOpenId(openId === e.id ? null : e.id)}>
                  {openId === e.id ? "Paslėpti" : "Dalyviai"}
                </Button>
              </div>
              {openId === e.id && <RegistrationsList articleId={e.id} />}
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}

function RegistrationsList({ articleId }: { articleId: string }) {
  const qc = useQueryClient();
  const list = useServerFn(listEventRegistrations);
  const setSt = useServerFn(setRegistrationStatus);
  const q = useQuery({ queryKey: ["event-regs", articleId], queryFn: () => list({ data: { article_id: articleId } }) });
  const m = useMutation({
    mutationFn: (p: { id: string; status: "pending" | "confirmed" | "cancelled" | "attended" }) => setSt({ data: p }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["event-regs", articleId] }); qc.invalidateQueries({ queryKey: ["my-events"] }); toast.success("Atnaujinta"); },
    onError: (e: Error) => toastError(e),
  });

  if (q.isLoading) return <div className="mt-4 text-sm text-muted-foreground">Kraunama...</div>;
  if (!q.data?.registrations.length) return <div className="mt-4 text-sm text-muted-foreground">Registracijų dar nėra.</div>;

  return (
    <div className="mt-4 pt-4 border-t space-y-2">
      {q.data.registrations.map((r) => (
        <div key={r.id} className="flex items-center gap-3 flex-wrap text-sm">
          <div className="min-w-0 flex-1">
            <div className="font-medium">{r.name} <span className="text-muted-foreground">· {r.email}</span></div>
            <div className="text-xs text-muted-foreground">{r.phone ?? "—"} · {r.seats} vietos · {new Date(r.created_at).toLocaleDateString("lt-LT")}</div>
          </div>
          <Badge variant={r.status === "confirmed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}>{r.status}</Badge>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => m.mutate({ id: r.id, status: "confirmed" })}>Patvirtinti</Button>
            <Button size="sm" variant="ghost" onClick={() => m.mutate({ id: r.id, status: "cancelled" })}>Atšaukti</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
