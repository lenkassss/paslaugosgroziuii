import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listReports, moderateComment, resolveReport } from "@/lib/comments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeOff, Trash2, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/comments")({
  component: AdminComments,
});

function AdminComments() {
  const qc = useQueryClient();
  const listFn = useServerFn(listReports);
  const modFn = useServerFn(moderateComment);
  const resolveFn = useServerFn(resolveReport);

  const openQ = useQuery({ queryKey: ["reports", "open"], queryFn: () => listFn({ data: { status: "open" } }) });
  const doneQ = useQuery({ queryKey: ["reports", "resolved"], queryFn: () => listFn({ data: { status: "resolved" } }) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reports"] });
  };

  const modMut = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "hide" | "restore" | "delete" }) =>
      modFn({ data: { id, action } }),
    onSuccess: () => { invalidate(); toast.success("Atlikta"); },
    onError: (e: unknown) => toastError(e),
  });

  const resolveMut = useMutation({
    mutationFn: async (id: string) => resolveFn({ data: { id } }),
    onSuccess: () => { invalidate(); toast.success("Uždaryta"); },
  });

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-6">Komentarų moderavimas</h1>
      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Atviri skundai ({openQ.data?.reports.length ?? 0})</TabsTrigger>
          <TabsTrigger value="resolved">Užbaigti</TabsTrigger>
        </TabsList>

        {(["open", "resolved"] as const).map((tab) => {
          const q = tab === "open" ? openQ : doneQ;
          return (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {(q.data?.reports ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-12">Nėra įrašų</div>
              )}
              {q.data?.reports.map((r) => {
                const c = q.data.comments.find((cc) => cc.id === r.comment_id);
                return (
                  <Card key={r.id} className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</div>
                      <div className="text-xs">
                        Būsena komentaro: <span className="font-semibold">{c?.status ?? "?"}</span>
                      </div>
                    </div>
                    <div className="rounded bg-secondary/60 p-3 text-sm whitespace-pre-wrap mb-2">{c?.body ?? "(komentaras nerastas)"}</div>
                    <div className="text-xs text-muted-foreground mb-3">
                      <strong>Priežastis:</strong> {r.reason}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tab === "open" && c && c.status !== "hidden" && (
                        <Button size="sm" variant="outline" onClick={() => modMut.mutate({ id: c.id, action: "hide" })}>
                          <EyeOff className="h-3.5 w-3.5 mr-1" /> Slėpti
                        </Button>
                      )}
                      {tab === "open" && c && c.status !== "visible" && (
                        <Button size="sm" variant="outline" onClick={() => modMut.mutate({ id: c.id, action: "restore" })}>
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Atstatyti
                        </Button>
                      )}
                      {tab === "open" && c && (
                        <Button size="sm" variant="destructive" onClick={() => modMut.mutate({ id: c.id, action: "delete" })}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Šalinti
                        </Button>
                      )}
                      {tab === "open" && (
                        <Button size="sm" variant="ghost" onClick={() => resolveMut.mutate(r.id)}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Uždaryti skundą
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </TabsContent>
          );
        })}
      </Tabs>
    </DashboardShell>
  );
}
