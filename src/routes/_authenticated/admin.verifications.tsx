import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPendingVerifications, decideVerification } from "@/lib/payments.functions";
import { adminSetSalonApproved } from "@/lib/staff.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BadgeCheck, XCircle, Clock, ShieldAlert, ExternalLink, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/admin/verifications")({ component: Page });

const STATUS_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; cls: string; label: string }> = {
  verified: { icon: BadgeCheck, cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/40", label: "Patvirtinta" },
  pending: { icon: Clock, cls: "bg-amber-500/15 text-amber-600 border-amber-500/40", label: "Laukia" },
  rejected: { icon: XCircle, cls: "bg-destructive/15 text-destructive border-destructive/40", label: "Atmesta" },
  unverified: { icon: ShieldAlert, cls: "bg-muted text-muted-foreground", label: "Nepatikrinta" },
};

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPendingVerifications);
  const decideFn = useServerFn(decideVerification);
  const approveFn = useServerFn(adminSetSalonApproved);
  const q = useQuery({ queryKey: ["admin-verifications"], queryFn: () => listFn() });
  const [filter, setFilter] = useState<"pending" | "verified" | "rejected" | "all">("pending");
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});

  const mut = useMutation({
    mutationFn: (v: { userId: string; approve: boolean; reason?: string }) => decideFn({ data: v }),
    onSuccess: () => { toast.success("Atnaujinta"); qc.invalidateQueries({ queryKey: ["admin-verifications"] }); },
    onError: (e) => toastError(e),
  });
  const approveMut = useMutation({
    mutationFn: (v: { salonId: string; approved: boolean }) => approveFn({ data: v }),
    onSuccess: () => { toast.success("Rezervacijos būsena atnaujinta"); qc.invalidateQueries({ queryKey: ["admin-verifications"] }); },
    onError: (e) => toastError(e),
  });

  const rows = (q.data?.profiles ?? []).filter((p) => filter === "all" ? true : p.verification_status === filter);

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-4">Salonų patikrinimai</h1>
      <div className="flex gap-2 mb-4">
        {(["pending", "verified", "rejected", "all"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "pending" ? "Laukia" : f === "verified" ? "Patvirtinti" : f === "rejected" ? "Atmesti" : "Visi"}
          </Button>
        ))}
      </div>

      <Card className="divide-y">
        {rows.map((p) => {
          const docs = (p.verification_docs ?? {}) as Record<string, string>;
          const s = STATUS_STYLE[p.verification_status] ?? STATUS_STYLE.unverified;
          return (
            <div key={p.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium">{p.business_name || "(be pavadinimo)"} {p.at_home_service && <Badge variant="outline" className="ml-2 text-[10px]">namuose</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{p.owner_name} · {p.city} · {p.phone}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className={s.cls}><s.icon className="h-3 w-3 mr-1" />{s.label}</Badge>
                  {p.is_approved ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/40 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" />Rezervacijos aktyvios</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">Rezervacijos sustabdytos</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {docs.id_document_url && <DocLink url={docs.id_document_url} label="ID" />}
                {docs.selfie_url && <DocLink url={docs.selfie_url} label="Selfie" />}
                {docs.business_document_url && <DocLink url={docs.business_document_url} label="Verslas" />}
                {docs.address_proof_url && <DocLink url={docs.address_proof_url} label="Adresas" />}
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {p.verification_status === "pending" && (
                  <>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => mut.mutate({ userId: p.id, approve: true })}>Patvirtinti dokumentus</Button>
                    <Input placeholder="Atmetimo priežastis" className="w-64" value={rejectReasonById[p.id] ?? ""} onChange={(e) => setRejectReasonById({ ...rejectReasonById, [p.id]: e.target.value })} />
                    <Button size="sm" variant="destructive" onClick={() => mut.mutate({ userId: p.id, approve: false, reason: rejectReasonById[p.id] || "Trūksta dokumentų" })}>Atmesti</Button>
                  </>
                )}
                <Button size="sm" variant={p.is_approved ? "outline" : "default"} className={p.is_approved ? "" : "gradient-gold text-primary-foreground"}
                  onClick={() => approveMut.mutate({ salonId: p.id, approved: !p.is_approved })}>
                  {p.is_approved ? "Sustabdyti rezervacijas" : "Leisti priimti rezervacijas"}
                </Button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nėra įrašų.</div>}
      </Card>
    </DashboardShell>
  );
}

function DocLink({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded border hover:bg-secondary">
      <ExternalLink className="h-3 w-3" /> {label}
    </a>
  );
}
