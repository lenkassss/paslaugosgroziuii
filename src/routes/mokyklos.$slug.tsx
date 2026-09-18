import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSchool, registerToCourse } from "@/lib/schools.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, MapPin, Calendar, Users, Clock, GraduationCap, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { toastError } from "@/lib/error-messages";

export const Route = createFileRoute("/mokyklos/$slug")({
  head: () => ({
    meta: [
      { title: "Grožio mokymai — PaslaugosGrožiui" },
      { name: "description", content: "Grožio kursai, seminarai ir profesinės programos Lietuvoje." },
      { property: "og:title", content: "Grožio mokymai — PaslaugosGrožiui" },
      { property: "og:description", content: "Atraskite grožio mokyklas, kursus ir seminarus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const fn = useServerFn(getSchool);
  const regFn = useServerFn(registerToCourse);
  const q = useQuery({ queryKey: ["school", slug], queryFn: () => fn({ data: { slug } }) });
  const [pick, setPick] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", email: user?.email ?? "", phone: "", seats: 1, note: "" });

  const reg = useMutation({
    mutationFn: () => regFn({ data: { course_id: pick.id, ...form } }),
    onSuccess: () => { toast.success("Registracija priimta"); setPick(null); },
    onError: (e) => toastError(e),
  });

  if (q.isLoading) return <div className="p-20 text-center text-muted-foreground">Kraunama…</div>;
  if (q.isError || !q.data) return <div className="p-20 text-center">Mokykla nerasta. <Link to="/mokyklos" className="text-primary underline">Atgal</Link></div>;

  const s = q.data.school;
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-8">
      <Link to="/mokyklos" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"><ChevronLeft className="h-4 w-4" /> Grįžti</Link>

      {s.cover_url && (
        <div className="aspect-[3/1] rounded-2xl overflow-hidden bg-muted mb-6">
          <img src={s.cover_url} alt={s.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">{s.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            {s.city && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {s.city}</span>}
            {s.is_verified && <Badge className="gradient-gold text-primary-foreground border-0"><BadgeCheck className="h-3 w-3 mr-1" /> Patvirtinta</Badge>}
            {s.category && <Badge variant="outline">{s.category}</Badge>}
          </div>
          {s.description && <p className="mt-3 text-muted-foreground max-w-2xl whitespace-pre-wrap">{s.description}</p>}
        </div>
      </div>

      <h2 className="font-display text-2xl mb-4">Kursai ir mokymai</h2>
      {q.data.courses.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <GraduationCap className="h-8 w-8 mx-auto mb-2" /> Kol kas nėra paskelbtų kursų.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {q.data.courses.map((c: any) => (
            <Card key={c.id} className="p-5 hover:border-primary/40 transition">
              <h3 className="font-display text-xl">{c.title}</h3>
              {c.category && <Badge variant="outline" className="mt-1">{c.category}</Badge>}
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration_hours} val.</div>
                {c.starts_at && <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(c.starts_at).toLocaleDateString("lt-LT")}</div>}
                <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {typeof c.seats_left === "number" ? `Liko ${c.seats_left} v.` : `${c.seats} vietos`}</div>
              </div>
              {c.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{c.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <span className="font-display text-xl font-semibold">{Number(c.price).toFixed(2)} €</span>
                {c.seats_left === 0 ? (
                  <Badge variant="outline">Vietų nebėra</Badge>
                ) : (
                  <Button onClick={() => user ? setPick(c) : toast.error("Prisijunkite, kad galėtumėte registruotis")} className="gradient-gold text-primary-foreground">Registruotis</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!pick} onOpenChange={(o) => !o && setPick(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registracija: {pick?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Vardas, pavardė</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>El. paštas</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefonas</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Vietų skaičius</Label><Input type="number" min={1} max={10} value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) || 1 })} /></div>
            <div><Label>Pastaba</Label><Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Kursas ({form.seats} v.)</span><span>{(Number(pick?.price ?? 0) * form.seats).toFixed(2)} €</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Platformos mokestis</span><span>0,49 €</span></div>
              <div className="flex justify-between font-semibold pt-1 border-t border-border/60"><span>Viso</span><span>{(Number(pick?.price ?? 0) * form.seats + 0.49).toFixed(2)} €</span></div>
            </div>
            <Button disabled={reg.isPending || !form.name || !form.email} onClick={() => reg.mutate()} className="w-full gradient-gold text-primary-foreground">
              Registruotis ({(Number(pick?.price ?? 0) * form.seats + 0.49).toFixed(2)} €)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
