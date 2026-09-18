import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { BACKUP_TABLES, exportBackup, type BackupTable } from "@/lib/backup.functions";
import { toastError } from "@/lib/error-messages";
import { toast } from "sonner";
import { DatabaseBackup, Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/super-admin/backups")({
  component: Backups,
});

const LABELS: Record<string, string> = {
  profiles: "Profiliai",
  user_roles: "Rolės",
  services: "Paslaugos",
  appointments: "Registracijos",
  classified_listings: "Skelbimai",
  courses: "Mokymai",
  course_registrations: "Mokymų registracijos",
  orders: "Užsakymai",
  order_items: "Užsakymų prekės",
  products: "Prekės",
  articles: "Straipsniai",
  event_registrations: "Renginių registracijos",
};

function Backups() {
  const [selected, setSelected] = useState<BackupTable[]>([...BACKUP_TABLES]);
  const [lastCounts, setLastCounts] = useState<Record<string, number> | null>(null);
  const exportFn = useServerFn(exportBackup);

  const run = useMutation({
    mutationFn: () => exportFn({ data: { tables: selected } }),
    onSuccess: (res) => {
      setLastCounts(res.counts);
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atsargine-kopija-${res.generated_at.slice(0, 19).replace(/[:T]/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Atsarginė kopija paruošta ir atsiųsta.");
    },
    onError: (e) => toastError(e),
  });

  const toggle = (t: BackupTable) =>
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <DatabaseBackup className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl">Atsarginės kopijos</h1>
          <p className="text-sm text-muted-foreground">
            Eksportuok platformos duomenis į failą. Prieinama tik super administratoriui, kiekvienas eksportas įrašomas į veiksmų žurnalą.
          </p>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Ką įtraukti</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BACKUP_TABLES.map((t) => (
            <label key={t} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
              <Checkbox checked={selected.includes(t)} onCheckedChange={() => toggle(t)} />
              <span className="min-w-0 truncate">{LABELS[t] ?? t}</span>
              {lastCounts?.[t] !== undefined && (
                <Badge variant="outline" className="ml-auto text-[10px]">{lastCounts[t]}</Badge>
              )}
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button disabled={run.isPending || selected.length === 0} onClick={() => run.mutate()} className="btn-press">
            {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Atsisiųsti kopiją
          </Button>
          <Button variant="outline" onClick={() => setSelected([...BACKUP_TABLES])}>Pasirinkti viską</Button>
          <Button variant="ghost" onClick={() => setSelected([])}>Nuimti visus</Button>
        </div>
      </Card>
    </DashboardShell>
  );
}
