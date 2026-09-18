import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMySchool, upsertSchool, upsertCourse, deleteCourse, payForCourse } from "@/lib/schools.functions";
import { TIER_PRICING, eur } from "@/lib/access";
import { SingleImageUploader } from "@/components/image-uploader";
import { DashboardShell } from "@/components/dashboard-shell";
import { VerificationGate } from "@/components/verification-gate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GraduationCap, Plus, Pencil, Trash2, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/dashboard/school/courses")({ component: Page });

type CourseForm = {
  id?: string;
  title: string; category: string; duration_hours: number; price: number;
  starts_at: string; seats: number; description: string; cover_url: string; is_active: boolean;
};

const EMPTY: CourseForm = {
  title: "", category: "", duration_hours: 8, price: 0, starts_at: "",
  seats: 12, description: "", cover_url: "", is_active: true,
};

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMySchool);
  const saveSchoolFn = useServerFn(upsertSchool);
  const saveCourseFn = useServerFn(upsertCourse);
  const delCourseFn = useServerFn(deleteCourse);
  const payCourseFn = useServerFn(payForCourse);

  const { data, isLoading } = useQuery({ queryKey: ["my-school"], queryFn: () => listFn() });
  const school = data?.school ?? null;

  const [profile, setProfile] = useState<null | Record<string, string>>(null);
  const [form, setForm] = useState<CourseForm | null>(null);

  const openProfile = () => setProfile({
    name: school?.name ?? "", city: school?.city ?? "", address: school?.address ?? "",
    category: school?.category ?? "", description: school?.description ?? "",
    phone: school?.phone ?? "", email: school?.email ?? "", website: school?.website ?? "",
    cover_url: school?.cover_url ?? "", logo_url: school?.logo_url ?? "",
  });

  const schoolMut = useMutation({
    mutationFn: () => saveSchoolFn({ data: { ...(school ? { id: school.id } : {}), ...(profile as any) } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-school"] }); setProfile(null); toast.success("Mokyklos profilis išsaugotas"); },
    onError: (e) => toastError(e),
  });

  const payMut = useMutation({
    mutationFn: (id: string) => payCourseFn({ data: { id, card_last4: "4242" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-school"] }); toast.success("Mokymai apmokėti — pateikta tvirtinti."); },
    onError: (e) => toastError(e),
  });

  const courseMut = useMutation({
    mutationFn: () => saveCourseFn({ data: {
      ...(form!.id ? { id: form!.id } : {}),
      school_id: school!.id,
      title: form!.title, category: form!.category,
      duration_hours: Number(form!.duration_hours) || 1,
      price: Number(form!.price) || 0,
      starts_at: form!.starts_at ? new Date(form!.starts_at).toISOString() : null,
      seats: Number(form!.seats) || 1,
      description: form!.description, cover_url: form!.cover_url, is_active: form!.is_active,
    } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-school"] }); setForm(null); toast.success("Kursas išsaugotas"); },
    onError: (e) => toastError(e),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delCourseFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-school"] }); toast.success("Kursas ištrintas"); },
    onError: (e) => toastError(e),
  });

  return (
    <DashboardShell>
      <VerificationGate kind="school" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl truncate">Mokyklos valdymas</h1>
          <p className="text-sm text-muted-foreground">Tvarkyk mokyklos profilį ir kursus, kuriuos matys visi lankytojai.</p>
        </div>
        <Button variant="outline" onClick={openProfile} className="shrink-0">
          <Pencil className="h-4 w-4 mr-1" /> Profilis
        </Button>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      ) : !school ? (
        <Card className="p-8 text-center">
          <GraduationCap className="h-10 w-10 mx-auto text-primary mb-3" />
          <h2 className="font-display text-xl">Sukurk savo mokyklos profilį</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Pridėk pavadinimą ir miestą — po to galėsi skelbti kursus.</p>
          <Button onClick={openProfile} className="gradient-gold text-primary-foreground">Pradėti</Button>
        </Card>
      ) : (
        <>
          <Card className="p-5 mb-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg truncate">{school.name}</div>
                <div className="text-xs text-muted-foreground">{school.city || "—"} · /{school.slug}</div>
              </div>
              {school.is_verified && <Badge className="bg-success/20 text-success border-0 shrink-0">Patvirtinta</Badge>}
            </div>
          </Card>

          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl">Kursai ({data?.courses.length ?? 0})</h2>
            <Button onClick={() => setForm({ ...EMPTY })} className="gradient-gold text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Naujas kursas
            </Button>
          </div>

          <div className="space-y-3">
            {(data?.courses ?? []).map((c: any) => (
              <Card key={c.id} className="p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.category || "—"} · {c.duration_hours} val. · {Number(c.price).toFixed(2)} € · {c.seats} vietų
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {!c.is_active && <Badge variant="outline">Nepublikuotas</Badge>}
                      <Badge variant={c.payment_status === "paid" ? "secondary" : "outline"}>
                        {c.payment_status === "paid" ? "Apmokėta" : `Neapmokėta · ${eur(TIER_PRICING.course.cents)}`}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.payment_status !== "paid" && (
                      <Button size="sm" disabled={payMut.isPending} onClick={() => payMut.mutate(c.id)}>
                        Apmokėti
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => setForm({
                      id: c.id, title: c.title, category: c.category ?? "", duration_hours: c.duration_hours,
                      price: Number(c.price), starts_at: c.starts_at ? String(c.starts_at).slice(0, 16) : "",
                      seats: c.seats, description: c.description ?? "", cover_url: c.cover_url ?? "", is_active: c.is_active,
                    })}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => delMut.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>

                </div>
              </Card>
            ))}
            {(data?.courses.length ?? 0) === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">Kursų dar nėra — pridėk pirmąjį.</Card>
            )}
          </div>
        </>
      )}

      <Dialog open={!!profile} onOpenChange={(o) => !o && setProfile(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Mokyklos profilis</DialogTitle></DialogHeader>
          {profile && (
            <div className="space-y-3">
              {([["name", "Pavadinimas"], ["city", "Miestas"], ["address", "Adresas"], ["category", "Kryptis (pvz. Nagai)"], ["phone", "Telefonas"], ["email", "El. paštas"], ["website", "Svetainė"]] as const).map(([k, l]) => (
                <div key={k}>
                  <Label className="text-xs">{l}</Label>
                  <Input value={profile[k] ?? ""} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} className="mt-1" />
                </div>
              ))}
              <div>
                <Label className="text-xs">Aprašymas</Label>
                <Textarea rows={4} value={profile.description ?? ""} onChange={(e) => setProfile({ ...profile, description: e.target.value })} className="mt-1" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <SingleImageUploader
                  bucket="avatars" label="Logotipas (800×800)" aspect="square"
                  value={profile.logo_url ?? ""} onChange={(url) => setProfile({ ...profile, logo_url: url })}
                />
                <SingleImageUploader
                  bucket="covers" label="Viršelio nuotrauka" aspect="wide"
                  value={profile.cover_url ?? ""} onChange={(url) => setProfile({ ...profile, cover_url: url })}
                />
              </div>
              <Button className="w-full gradient-gold text-primary-foreground" disabled={(profile.name ?? "").trim().length < 2 || schoolMut.isPending}
                onClick={() => schoolMut.mutate()}>
                {schoolMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Išsaugoti
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form?.id ? "Redaguoti kursą" : "Naujas kursas"}</DialogTitle></DialogHeader>
          {form && (
            <div className="space-y-3">
              <div><Label className="text-xs">Pavadinimas</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Kategorija</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Trukmė (val.)</Label><Input type="number" min={1} value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: Number(e.target.value) })} className="mt-1" /></div>
                <div><Label className="text-xs">Kaina (€)</Label><Input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="mt-1" /></div>
                <div><Label className="text-xs">Pradžia</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Vietų skaičius</Label><Input type="number" min={1} value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} className="mt-1" /></div>
              </div>
              <SingleImageUploader
                bucket="covers" label="Mokymų viršelis" aspect="wide"
                value={form.cover_url} onChange={(url) => setForm({ ...form, cover_url: url })}
              />
              <div><Label className="text-xs">Aprašymas</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" /></div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-sm">Publikuoti kursą</span>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              </div>
              <Button className="w-full gradient-gold text-primary-foreground" disabled={form.title.trim().length < 2 || courseMut.isPending}
                onClick={() => courseMut.mutate()}>
                {courseMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Išsaugoti kursą
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
