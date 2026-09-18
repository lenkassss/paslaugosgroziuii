import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listJobs, EMPLOYMENT_TYPES } from "@/lib/jobs.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Euro, Search } from "lucide-react";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { canSee } from "@/lib/access";

export const Route = createFileRoute("/darbas")({
  component: JobsPage,
  head: () => ({
    meta: [
      { title: "Darbas grožio industrijoje · PaslaugosGrožiui" },
      { name: "description", content: "Darbo skelbimai kirpėjams, kosmetologams, manikiūro meistrams visoje Lietuvoje." },
      { property: "og:title", content: "Darbas grožio industrijoje · PaslaugosGrožiui" },
      { property: "og:description", content: "Darbo skelbimai grožio profesionalams." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function JobsPage() {
  const { role } = useAuth();
  const fn = useServerFn(listJobs);
  const [q, setQ] = useState(""); const [applied, setApplied] = useState("");
  const [type, setType] = useState("__all"); const [city, setCity] = useState("");
  const query = useQuery({
    queryKey: ["jobs", applied, type, city],
    queryFn: () => fn({ data: { q: applied || undefined, type: type === "__all" ? undefined : type, city: city || undefined } }),
  });
  const block = useSection("darbas", "intro");

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-12 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="gradient-gold text-primary-foreground border-0"><Briefcase className="h-3 w-3 mr-1" /> Darbo skelbimai</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-5xl">{block?.title || (<>Darbas <span className="text-gradient-gold">grožio industrijoje</span></>)}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{block?.subtitle || "Salonai ir grožio verslai kviečia meistrus, administratorius ir kosmetologus."}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setApplied(q); }}
              placeholder="Ieškoti pareigų…" className="pl-9 h-11 bg-background" />
          </div>
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Miestas" className="h-11 w-40 bg-background" />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-44 h-11"><SelectValue placeholder="Tipas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">Visi tipai</SelectItem>
              {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setApplied(q)} className="gradient-gold text-primary-foreground h-11">Ieškoti</Button>
          {canSee(role, "classifieds") && <Button asChild variant="outline" className="h-11"><Link to="/skelbimai">+ Skelbti darbą</Link></Button>}
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (query.data?.jobs.length ?? 0) === 0 ? (
        <Card className="p-14 text-center">
          <Briefcase className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg">Šiuo metu skelbimų nėra</p>
          <p className="text-sm text-muted-foreground mt-1">Esate darbdavys? <Link to="/auth" search={{ mode: "signup" }} className="text-primary underline">Užsiregistruokite ir paskelbkite pasiūlymą</Link>.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {query.data!.jobs.map((j: any) => (
            <Link key={j.id} to="/darbas/$slug" params={{ slug: j.slug }}>
              <Card className="p-5 hover:border-primary/40 transition flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-xl">{j.title}</h3>
                    <Badge variant="outline">{EMPLOYMENT_TYPES.find((t) => t.v === j.employment_type)?.l ?? j.employment_type}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{j.profiles?.business_name ?? "Darbdavys"}</div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {j.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.city}</span>}
                    {(j.salary_from || j.salary_to) && (
                      <span className="inline-flex items-center gap-1"><Euro className="h-3 w-3" />
                        {j.salary_from ? `${Math.round(j.salary_from)}` : "—"} – {j.salary_to ? `${Math.round(j.salary_to)} €` : "—"}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">Peržiūrėti</Button>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <SiteBlocks page="darbas" />
    </div>
  );
}
