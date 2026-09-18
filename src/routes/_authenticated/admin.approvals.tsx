import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listApprovalQueue,
  decideClassified,
  decideSupplierRequest,
  decideCourse,
  featureClassified,
  deleteClassifiedAsAdmin,
} from "@/lib/approvals.functions";
import { listAdvertiserApplications, decideAdvertiser, type AdvertiserProfile } from "@/lib/advertiser.functions";

import { statusLabel } from "@/lib/role-labels";
import { toastError } from "@/lib/error-messages";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Sparkles, Trash2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  component: Approvals,
});

function StatusBadge({ status }: { status: string }) {
  const variant = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status === "pending_approval" || status === "new" ? "Tvirtinama" : statusLabel(status)}</Badge>;
}

function Approvals() {
  const qc = useQueryClient();
  const queueFn = useServerFn(listApprovalQueue);
  const clsFn = useServerFn(decideClassified);
  const supFn = useServerFn(decideSupplierRequest);
  const crsFn = useServerFn(decideCourse);
  const featFn = useServerFn(featureClassified);
  const delFn = useServerFn(deleteClassifiedAsAdmin);
  const advListFn = useServerFn(listAdvertiserApplications);
  const advDecideFn = useServerFn(decideAdvertiser);


  const queue = useQuery({ queryKey: ["approval-queue"], queryFn: () => queueFn() });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["approval-queue"] });
    qc.invalidateQueries({ queryKey: ["approval-counts"] });
  };

  const decide = useMutation({
    mutationFn: (v: { kind: "classified" | "supplier" | "course"; id: string; approve: boolean; note?: string }) => {
      const payload = { data: { id: v.id, approve: v.approve, ...(v.note ? { note: v.note } : {}) } };
      if (v.kind === "classified") return clsFn(payload);
      if (v.kind === "supplier") return supFn(payload);
      return crsFn(payload);
    },
    onSuccess: (_d, v) => { refresh(); toast.success(v.approve ? "Patvirtinta" : "Atmesta"); },
    onError: (e) => toastError(e),
  });

  const feature = useMutation({
    mutationFn: (id: string) => featFn({ data: { id, weeks: 1 } }),
    onSuccess: () => { refresh(); toast.success("Skelbimas paryškintas 1 savaitei"); },
    onError: (e) => toastError(e),
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { refresh(); toast.success("Ištrinta"); },
    onError: (e) => toastError(e),
  });

  const reject = (kind: "classified" | "supplier" | "course", id: string) => {
    const note = window.prompt("Atmetimo komentaras (bus matomas pareiškėjui):");
    if (note === null) return;
    if (note.trim().length < 3) { toast.error("Nurodykite bent 3 simbolių komentarą."); return; }
    decide.mutate({ kind, id, approve: false, note: note.trim() });
  };

  const advQ = useQuery({ queryKey: ["advertiser-apps"], queryFn: () => advListFn() });
  const advDecide = useMutation({
    mutationFn: (v: { id: string; approve: boolean; note?: string }) =>
      advDecideFn({ data: { id: v.id, approve: v.approve, ...(v.note ? { note: v.note } : {}) } }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["advertiser-apps"] });
      refresh();
      toast.success(v.approve ? "Skelbikas patvirtintas" : "Anketa atmesta");
    },
    onError: (e) => toastError(e),
  });

  const classifieds = queue.data?.classifieds ?? [];
  const suppliers = queue.data?.suppliers ?? [];
  const courses = queue.data?.courses ?? [];
  const advertisers = advQ.data?.items ?? [];
  const pend = (rows: any[], key = "pending_approval") => rows.filter((r) => r.status === key).length;


  return (
    <DashboardShell>
      <div className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-display text-3xl">Patvirtinimai</h1>
          <p className="text-sm text-muted-foreground">Skelbimai, tiekėjų paraiškos ir mokymų kursai — vienoje eilėje.</p>
        </div>
      </div>

      <Tabs defaultValue="classifieds">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="classifieds">Skelbimai {pend(classifieds) > 0 && <Badge className="ml-2">{pend(classifieds)}</Badge>}</TabsTrigger>
          <TabsTrigger value="advertisers">Skelbikai {pend(advertisers, "pending") > 0 && <Badge className="ml-2">{pend(advertisers, "pending")}</Badge>}</TabsTrigger>
          <TabsTrigger value="suppliers">Tiekėjai {pend(suppliers, "new") > 0 && <Badge className="ml-2">{pend(suppliers, "new")}</Badge>}</TabsTrigger>
          <TabsTrigger value="courses">Mokymai {pend(courses) > 0 && <Badge className="ml-2">{pend(courses)}</Badge>}</TabsTrigger>
        </TabsList>


        <TabsContent value="classifieds" className="space-y-3">
          {classifieds.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">Nėra skelbimų.</Card>}
          {classifieds.map((c: any) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.category} · {c.city ?? "—"} · {c.applicant_name ?? "—"} ({c.person_type === "legal" ? "Juridinis" : "Fizinis"})
                  </div>
                  <div className="text-xs text-muted-foreground">{c.contact_phone} · {c.contact_email}{c.social_links ? ` · ${c.social_links}` : ""}</div>
                  {c.description && <p className="mt-2 line-clamp-3 max-w-2xl text-sm">{c.description}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={c.status} />
                  <Badge variant="outline">{c.payment_status === "paid" ? "Apmokėta" : "Neapmokėta"}</Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={decide.isPending || c.payment_status !== "paid"}
                  onClick={() => decide.mutate({ kind: "classified", id: c.id, approve: true })}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Patvirtinti
                </Button>
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => reject("classified", c.id)}>
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Atmesti su komentaru
                </Button>
                <Button size="sm" variant="outline" disabled={feature.isPending} onClick={() => feature.mutate(c.id)}>
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> Paryškinti
                </Button>
                <Button size="sm" variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Ištrinti
                </Button>
              </div>
              {c.payment_status !== "paid" && (
                <p className="mt-2 text-xs text-muted-foreground">Patvirtinti galima tik apmokėtą skelbimą (4,99 €).</p>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-3">
          {suppliers.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">Nėra tiekėjų paraiškų.</Card>}
          {suppliers.map((s: any) => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{s.company_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Įmonės kodas: {s.company_code ?? "—"} · {s.contact_name} · {s.email} · {s.phone ?? "—"}
                  </div>
                  {s.website && <div className="text-xs text-muted-foreground">{s.website}</div>}
                  <p className="mt-2 line-clamp-3 max-w-2xl text-sm">{s.products_description}</p>
                  {s.admin_notes && <p className="mt-1 text-xs text-destructive">{s.admin_notes}</p>}
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ kind: "supplier", id: s.id, approve: true })}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Patvirtinti tiekėją
                </Button>
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => reject("supplier", s.id)}>
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Atmesti su komentaru
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="courses" className="space-y-3">
          {courses.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">Nėra mokymų kursų.</Card>}
          {courses.map((c: any) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.schools?.name ?? "—"} · {c.schools?.city ?? "—"} · {c.duration_hours} val. · {Number(c.price).toFixed(2)} €
                    {c.starts_at ? ` · ${new Date(c.starts_at).toLocaleDateString("lt-LT")}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={c.status} />
                  <Badge variant="outline">{c.payment_status === "paid" ? "Apmokėta" : "Neapmokėta"}</Badge>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate({ kind: "course", id: c.id, approve: true })}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Patvirtinti
                </Button>
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => reject("course", c.id)}>
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Atmesti su komentaru
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="advertisers" className="space-y-3">
          {advertisers.length === 0 && <Card className="p-10 text-center text-sm text-muted-foreground">Nėra skelbikų anketų.</Card>}
          {advertisers.map((a: AdvertiserProfile) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium">{a.business_name || a.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.person_type === "legal" ? "Juridinis" : "Fizinis"} · {a.full_name} · {a.email} · {a.phone}
                    {a.address ? ` · ${a.address}` : ""}
                  </div>
                  {a.social_links && <div className="text-xs text-muted-foreground">{a.social_links}</div>}
                  {a.intent && <p className="mt-2 line-clamp-4 max-w-2xl text-sm">{a.intent}</p>}
                  {a.rejection_note && <p className="mt-1 text-xs text-destructive">{a.rejection_note}</p>}
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" disabled={advDecide.isPending} onClick={() => advDecide.mutate({ id: a.id, approve: true })}>
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Patvirtinti skelbiką
                </Button>
                <Button size="sm" variant="outline" disabled={advDecide.isPending} onClick={() => {
                  const note = window.prompt("Atmetimo komentaras (bus matomas pareiškėjui):");
                  if (note === null) return;
                  if (note.trim().length < 3) { toast.error("Nurodykite bent 3 simbolių komentarą."); return; }
                  advDecide.mutate({ id: a.id, approve: false, note: note.trim() });
                }}>
                  <XCircle className="mr-1 h-3.5 w-3.5" /> Atmesti su komentaru
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

    </DashboardShell>
  );
}
