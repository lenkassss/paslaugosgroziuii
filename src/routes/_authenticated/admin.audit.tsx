import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminReadAudit } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditAdmin,
});

function AuditAdmin() {
  const fn = useServerFn(adminReadAudit);
  const q = useQuery({ queryKey: ["admin-audit"], queryFn: () => fn() });

  return (
    <DashboardShell>
      <div className="mb-6">
        <h1 className="font-display text-3xl">Veiksmų žurnalas</h1>
        <p className="text-sm text-muted-foreground mt-1">Paskutiniai 200 admin veiksmų.</p>
      </div>
      {q.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      <Card className="divide-y">
        {q.data?.entries.map((e: any) => (
          <div key={e.id} className="p-3 flex items-center gap-3 flex-wrap text-sm">
            <Badge variant="outline" className="font-mono text-[10px]">{e.action}</Badge>
            <div className="flex-1 min-w-0">
              {e.entity && <span className="text-muted-foreground">{e.entity}{e.entity_id ? `#${e.entity_id}` : ""}</span>}
              {e.meta && Object.keys(e.meta).length > 0 && (
                <pre className="mt-1 text-[10px] text-muted-foreground overflow-hidden line-clamp-2">{JSON.stringify(e.meta)}</pre>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("lt-LT")}</span>
          </div>
        ))}
      </Card>
    </DashboardShell>
  );
}
