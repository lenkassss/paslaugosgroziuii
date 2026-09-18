import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSupplierRequests, updateSupplierRequest } from "@/lib/payments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { fmtDate } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/supplier-requests")({ component: Page });

const STATUSES = ["new", "contacted", "approved", "rejected"] as const;

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSupplierRequests);
  const updFn = useServerFn(updateSupplierRequest);
  const q = useQuery({ queryKey: ["supplier-requests"], queryFn: () => listFn() });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: (v: { id: string; status: typeof STATUSES[number]; admin_notes?: string }) => updFn({ data: v }),
    onSuccess: () => { toast.success("Atnaujinta"); qc.invalidateQueries({ queryKey: ["supplier-requests"] }); },
    onError: (e) => toastError(e),
  });

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-2">Tiekėjų užklausos</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Tiekėjo narystė nėra pirktina viešai. Susisiek su užklausos autoriumi, patvirtink identitetą ir tik tada per Vartotojai skiltį suteik "supplier" vaidmenį.
      </p>
      <Card className="divide-y">
        {q.data?.requests.map((r) => (
          <div key={r.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="font-medium">{r.company_name}</div>
                <div className="text-xs text-muted-foreground">{r.contact_name} · {r.email} · {r.phone ?? "—"}</div>
                {r.website && <a href={r.website} target="_blank" rel="noreferrer" className="text-xs text-primary underline">{r.website}</a>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{r.status}</Badge>
                <span className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{r.products_description}</p>
            <Textarea
              rows={2}
              placeholder="Admin pastabos"
              value={notes[r.id] ?? r.admin_notes ?? ""}
              onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
            />
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map((s) => (
                <Button key={s} size="sm" variant={r.status === s ? "default" : "outline"} onClick={() => mut.mutate({ id: r.id, status: s, admin_notes: notes[r.id] })}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ))}
        {q.data && q.data.requests.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nėra užklausų.</div>}
      </Card>
    </DashboardShell>
  );
}
