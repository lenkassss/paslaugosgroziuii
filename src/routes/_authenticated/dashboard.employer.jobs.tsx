import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyJobs, upsertJob, deleteJob, listJobApplications, EMPLOYMENT_TYPES } from "@/lib/jobs.functions";
import { DashboardShell } from "@/components/dashboard-shell";
import { VerificationGate } from "@/components/verification-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, Plus, Pencil, Trash2, Loader2, Save, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/employer/jobs")({ component: Page });

type JobForm = {
  id?: string;
  title: string; city: string; employment_type: string;
  salary_from: string; salary_to: string;
  description: string; requirements: string; benefits: string;
  contact_email: string; contact_phone: string; is_active: boolean;
};

const EMPTY: JobForm = {
  title: "", city: "", employment_type: "full_time", salary_from: "", salary_to: "",
  description: "", requirements: "", benefits: "", contact_email: "", contact_phone: "", is_active: true,
};

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyJobs);
  const saveFn = useServerFn(upsertJob);
  const delFn = useServerFn(deleteJob);
  const appsFn = useServerFn(listJobApplications);

  const { data, isLoading } = useQuery({ queryKey: ["my-jobs"], queryFn: () => listFn() });
  const [form, setForm] = useState<JobForm | null>(null);
  const [appsJob, setAppsJob] = useState<{ id: string; title: string } | null>(null);

  const apps = useQuery({
    queryKey: ["job-apps", appsJob?.id],
    enabled: !!appsJob?.id,
    queryFn: () => appsFn({ data: { job_id: appsJob!.id } }),
  });

  const saveMut = useMutation({
    mutationFn: () => saveFn({ data: {
      ...(form!.id ? { id: form!.id } : {}),
      title: form!.title, city: form!.city, employment_type: form!.employment_type,
      salary_from: form!.salary_from ? Number(form!.salary_from) : null,
      salary_to: form!.salary_to ? Number(form!.salary_to) : null,
      description: form!.description, requirements: form!.requirements, benefits: form!.benefits,
      contact_email: form!.contact_email, contact_phone: form!.contact_phone, is_active: form!.is_active,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-jobs"] }); qc.invalidateQueries({ queryKey: ["jobs"] }); setForm(null); toast.success("Skelbimas išsaugotas"); },
    onError: (e) => toastError(e),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-jobs"] }); qc.invalidateQueries({ queryKey: ["jobs"] }); toast.success("Skelbimas ištrintas"); },
    onError: (e) => toastError(e),
  });

  return (
    <DashboardShell>
      <VerificationGate kind="employer" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl truncate">Darbo skelbimai</h1>
          <p className="text-sm text-muted-foreground">Skelbk laisvas vietas ir peržiūrėk kandidatų anketas.</p>
        </div>
        <Button onClick={() => setForm({ ...EMPTY })} className="gradient-gold text-primary-foreground shrink-0">
          <Plus className="h-4 w-4 mr-1" /> Naujas
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (data?.jobs.length ?? 0) === 0 ? (
        <Card className="p-8 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-primary mb-3" />
          <h2 className="font-display text-xl">Skelbimų dar nėra</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Sukurk pirmą skelbimą — jis iškart matomas /darbas puslapyje.</p>
          <Button onClick={() => setForm({ ...EMPTY })} className="gradient-gold text-primary-foreground">Skelbti darbą</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {(data?.jobs ?? []).map((j: any) => (
            <Card key={j.id} className="p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{j.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {j.city || "—"} · {EMPLOYMENT_TYPES.find((t) => t.v === j.employment_type)?.l ?? j.employment_type}
                    {j.salary_from ? ` · nuo ${j.salary_from} €` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!j.is_active && <Badge variant="outline">Neaktyvus</Badge>}
                    <Badge variant="secondary">{j.applications_count ?? 0} kandidatų</Badge>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => setAppsJob({ id: j.id, title: j.title })}><Users className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setForm({
                    id: j.id, title: j.title, city: j.city ?? "", employment_type: j.employment_type,
                    salary_from: j.salary_from ? String(j.salary_from) : "", salary_to: j.salary_to ? String(j.salary_to) : "",
                    description: j.description ?? "", requirements: j.requirements ?? "", benefits: j.benefits ?? "",
                    contact_email: j.contact_email ?? "", contact_phone: j.contact_phone ?? "", is_active: j.is_active,
                  })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => delMut.mutate(j.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Redaguoti skelbimą" : "Naujas skelbimas"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div><Label className="text-xs">Pareigos</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Miestas</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
                <div>
                  <Label className="text-xs">Darbo tipas</Label>
                  <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Atlygis nuo (€)</Label><Input type="number" value={form.salary_from} onChange={(e) => setForm({ ...form, salary_from: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Atlygis iki (€)</Label><Input type="number" value={form.salary_to} onChange={(e) => setForm({ ...form, salary_to: e.target.value })} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Aprašymas (min. 20 simbolių)</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Reikalavimai</Label><Textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Ką siūlome</Label><Textarea rows={3} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Kontaktinis el. paštas</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Telefonas</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="mt-1" /></div>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-sm">Skelbimas aktyvus</span>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
              <Button className="w-full gradient-gold text-primary-foreground"
                disabled={form.title.trim().length < 3 || form.description.trim().length < 20 || saveMut.isPending}
                onClick={() => saveMut.mutate()}>
                {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Išsaugoti
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!appsJob} onOpenChange={(o) => !o && setAppsJob(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Kandidatai · {appsJob?.title}</DialogTitle></DialogHeader>
          {apps.isLoading ? (
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
          ) : (apps.data?.applications.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Kandidatų dar nėra.</p>
          ) : (
            <div className="space-y-3">
              {(apps.data?.applications ?? []).map((a: any) => (
                <Card key={a.id} className="p-3">
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.email}{a.phone ? ` · ${a.phone}` : ""}</div>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{a.message}</p>
                  {a.cv_url && <a href={a.cv_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 inline-block">CV</a>}
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
