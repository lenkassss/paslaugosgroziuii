import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getJob, applyToJob, EMPLOYMENT_TYPES } from "@/lib/jobs.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, MapPin, Euro, ChevronLeft, Send } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/darbas/$slug")({ component: JobDetail });

function JobDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const fn = useServerFn(getJob);
  const applyFn = useServerFn(applyToJob);
  const q = useQuery({ queryKey: ["job", slug], queryFn: () => fn({ data: { slug } }) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: user?.email ?? "", phone: "", message: "", cv_url: "" });
  const apply = useMutation({
    mutationFn: () => applyFn({ data: { job_id: q.data!.job.id, ...form } }),
    onSuccess: () => { toast.success("Aplikacija išsiųsta"); setOpen(false); },
    onError: (e) => toastError(e),
  });

  if (q.isLoading) return <div className="p-20 text-center text-muted-foreground">Kraunama…</div>;
  if (q.isError || !q.data) return <div className="p-20 text-center">Skelbimas nerastas. <Link to="/darbas" className="text-primary underline">Atgal</Link></div>;

  const j = q.data.job;
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
      <Link to="/darbas" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"><ChevronLeft className="h-4 w-4" /> Visi skelbimai</Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">{j.title}</h1>
          <div className="mt-2 text-sm text-muted-foreground">{(j as any).profiles?.business_name ?? "Darbdavys"}</div>
          <div className="mt-3 flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
            <Badge variant="outline"><Briefcase className="h-3 w-3 mr-1" /> {EMPLOYMENT_TYPES.find((t) => t.v === j.employment_type)?.l}</Badge>
            {j.city && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {j.city}</span>}
            {(j.salary_from || j.salary_to) && (
              <span className="inline-flex items-center gap-1"><Euro className="h-4 w-4" /> {j.salary_from ?? "—"} – {j.salary_to ?? "—"}</span>
            )}
          </div>
        </div>
        <Button onClick={() => user ? setOpen(true) : toast.error("Prisijunkite, kad galėtumėte aplikuoti")} className="gradient-gold text-primary-foreground">
          <Send className="h-4 w-4 mr-2" /> Aplikuoti
        </Button>
      </div>

      <Card className="p-5 mb-4"><h3 className="font-display text-lg mb-2">Aprašymas</h3><p className="text-sm whitespace-pre-wrap">{j.description}</p></Card>
      {j.requirements && <Card className="p-5 mb-4"><h3 className="font-display text-lg mb-2">Reikalavimai</h3><p className="text-sm whitespace-pre-wrap">{j.requirements}</p></Card>}
      {j.benefits && <Card className="p-5 mb-4"><h3 className="font-display text-lg mb-2">Ką siūlome</h3><p className="text-sm whitespace-pre-wrap">{j.benefits}</p></Card>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aplikacija: {j.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Vardas, pavardė</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>El. paštas</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefonas</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Motyvacinis laiškas</Label><Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Papasakok apie savo patirtį…" /></div>
            <div><Label>CV nuoroda (nebūtina)</Label><Input value={form.cv_url} onChange={(e) => setForm({ ...form, cv_url: e.target.value })} placeholder="https://…" /></div>
            <Button disabled={apply.isPending || form.message.length < 10} onClick={() => apply.mutate()} className="w-full gradient-gold text-primary-foreground">Siųsti aplikaciją</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
