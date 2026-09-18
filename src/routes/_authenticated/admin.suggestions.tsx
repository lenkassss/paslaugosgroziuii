import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listServiceSuggestions, resolveServiceSuggestion } from "@/lib/service-suggestions.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/suggestions")({
  component: AdminSuggestions,
});

const STATUS_LABEL: Record<string, string> = {
  new: "Nauja",
  reviewed: "Peržiūrėta",
  added: "Įtraukta",
  declined: "Neįtraukta",
};

function AdminSuggestions() {
  const qc = useQueryClient();
  const listFn = useServerFn(listServiceSuggestions);
  const resolveFn = useServerFn(resolveServiceSuggestion);

  const { data } = useQuery({ queryKey: ["service-suggestions"], queryFn: () => listFn() });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: "reviewed" | "added" | "declined" }) => resolveFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["service-suggestions"] });
      toast.success("Atlikta");
    },
    onError: (e) => toastError(e),
  });

  const items = data?.items ?? [];

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-2">Paslaugų pasiūlymai</h1>
      <p className="mb-6 text-sm text-muted-foreground">Verslo paskyrų pasiūlytos paslaugos, kurių nėra sąraše, ir jų patarimai.</p>

      {items.length === 0 && <Card className="p-8 text-center text-muted-foreground">Nėra pasiūlymų</Card>}

      <div className="space-y-3">
        {items.map((s) => (
          <Card key={s.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{s.suggestion}</div>
                {s.note && <p className="mt-1 text-sm text-muted-foreground">{s.note}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{fmtDate(s.created_at)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{STATUS_LABEL[s.status] ?? s.status}</Badge>
                <Button size="sm" variant="outline" onClick={() => mut.mutate({ id: s.id, status: "reviewed" })}>
                  <Eye className="mr-1 h-3 w-3" /> Peržiūrėta
                </Button>
                <Button size="sm" onClick={() => mut.mutate({ id: s.id, status: "added" })}>
                  <Check className="mr-1 h-3 w-3" /> Įtraukta
                </Button>
                <Button size="sm" variant="destructive" onClick={() => mut.mutate({ id: s.id, status: "declined" })}>
                  <X className="mr-1 h-3 w-3" /> Neįtraukta
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
