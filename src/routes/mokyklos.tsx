import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSchools, listUpcomingCourses } from "@/lib/schools.functions";
import { CourseCalendar } from "@/components/course-calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, MapPin, BadgeCheck, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSection } from "@/lib/use-site-content";

export const Route = createFileRoute("/mokyklos")({
  component: SchoolsPage,
  head: () => ({
    meta: [
      { title: "Grožio mokyklos ir kursai · PaslaugosGrožiui" },
      { name: "description", content: "Sertifikuoti grožio mokymai visoje Lietuvoje — kirpėjų, kosmetologų, manikiūro kursai." },
      { property: "og:title", content: "Grožio mokyklos ir kursai · PaslaugosGrožiui" },
      { property: "og:description", content: "Sertifikuoti mokymai grožio profesionalams." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type TrackKey = "sau" | "profesija";

const TRACKS: Array<{ key: TrackKey; tag: string; title: string; lead: string; points: string[] }> = [
  {
    key: "sau",
    tag: "Sau",
    title: "Profesionalūs mokymai",
    lead: "Trumpi meistriškumo kursai — naujos technikos, sertifikatai, kvalifikacijos kėlimas.",
    points: [
      "1–3 dienų seminarai su modeliais ir praktika",
      "Naujausios technikos: balayage, airtouch, 2D–3D blakstienos",
      "Sertifikatas, kurį gali rodyti savo profilyje",
      "Mokymus kelia patikrintos mokyklos ir tiekėjai",
      "Kalendorius 3 / 6 / 12 mėn. — planuok iš anksto",
      "Registracija vienu paspaudimu, vietų skaičius realiu laiku",
    ],
  },
  {
    key: "profesija",
    tag: "Karjera",
    title: "Noriu tapti grožio srities specialistu",
    lead: "Ilgesnės programos su diplomu, praktika salone ir pirmais klientais.",
    points: [
      "Programos nuo nulio: kirpėjas, kosmetologas, manikiūro meistras",
      "Teorija + praktika realiame salone",
      "Baigimo diplomas / kvalifikacijos pažymėjimas",
      "Pagalba susikuriant meistro profilį platformoje",
      "Galimybė iškart pradėti priimti klientų registracijas",
      "Mokymo įstaigos patvirtintos administracijos",
    ],
  },
];

function SchoolsPage() {
  const { role } = useAuth();
  const block = useSection("mokymai", "intro");
  const fn = useServerFn(listSchools);
  const calendarFn = useServerFn(listUpcomingCourses);
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [city, setCity] = useState("");
  const [track, setTrack] = useState<TrackKey>("sau");
  const [months, setMonths] = useState<3 | 6 | 12>(6);
  const query = useQuery({
    queryKey: ["schools", applied],
    queryFn: () => fn({ data: { q: applied || undefined } }),
    retry: false,
  });
  const calendar = useQuery({
    queryKey: ["courses-calendar", city, months],
    queryFn: () => calendarFn({ data: { months, city: city || undefined } }),
    retry: false,
  });

  const allCourses = calendar.data?.courses ?? [];
  // „Sau“ – trumpi seminarai, „Karjera“ – ilgesnės profesijos programos.
  const visibleCourses = allCourses.filter((c: any) =>
    track === "profesija" ? Number(c.duration_hours ?? 0) >= 100 : Number(c.duration_hours ?? 0) < 100,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
      <div className="mb-10 border-b border-border pb-8 md:pb-10">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="gradient-gold text-primary-foreground border-0"><GraduationCap className="h-3 w-3 mr-1" /> Mokymai</Badge>
        </div>
        <h1 className="font-display text-3xl md:text-5xl leading-tight">
          {block?.title || "Mokymai ir grožio profesija"}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {block?.subtitle || "Atraskite trumpus mokymus sau arba pradėkite profesionalų kelią patikimose grožio mokyklose."}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") setApplied(q); }}
              placeholder="Ieškoti mokyklos, miesto…" className="pl-9 h-11 bg-background" />
          </div>
          <Button onClick={() => setApplied(q)} className="gradient-gold text-primary-foreground h-11 px-6">Ieškoti</Button>
          {role === "school" && (
            <Button asChild variant="outline" className="h-11"><Link to="/dashboard/school/courses">Valdyti kursus</Link></Button>
          )}
        </div>
      </div>

      <div id="mokymai" className="scroll-mt-24 mb-10">
        <p className="mb-2 text-sm font-semibold">1. Pasirink, ko ieškai — paspausk vieną variantą:</p>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Mokymų tipas">
          {TRACKS.map((tr) => {
            const on = track === tr.key;
            return (
              <button
                key={tr.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => { setTrack(tr.key); setMonths(tr.key === "profesija" ? 12 : 6); }}
                className={`rounded-xl border p-5 text-left transition ${
                  on
                    ? "border-cyclamen bg-gradient-to-br from-primary/[0.08] to-background shadow-elegant"
                    : "border-border bg-background hover:-translate-y-0.5 hover:border-cyclamen/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                      on ? "border-cyclamen" : "border-muted-foreground/40"
                    }`}
                  >
                    {on && <span className="h-2.5 w-2.5 rounded-full bg-cyclamen" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{tr.tag}</span>
                    <span className="mt-1 block font-display text-xl">{tr.title}</span>
                    <span className="mt-1.5 block text-sm text-muted-foreground">{tr.lead}</span>
                    <span className="mt-2 inline-block rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold">
                      {on ? "Pasirinkta" : "Pasirinkti"}
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-background p-5">
          <ul className="grid gap-2 sm:grid-cols-2">
            {TRACKS.find((t) => t.key === track)!.points.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyclamen" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Kalendorius reikalingas tik trumpiems mokymams „sau“. Karjeros kelyje – tik mokyklų sąrašas. */}
      {track === "sau" && (
        <section className="mb-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold">Artimiausi {months} mėn.</div>
              <h2 className="mt-1 font-display text-2xl md:text-3xl">Mokymų kalendorius</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-border p-0.5">
                {([3, 6, 12] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMonths(m)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      months === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m} mėn.
                  </button>
                ))}
              </div>
            </div>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Miestas (pvz., Vilnius)"
              className="h-11 w-full sm:w-56 bg-background"
            />
          </div>
          <CourseCalendar courses={visibleCourses} isLoading={calendar.isLoading} />
        </section>
      )}

      <h2 className="mb-4 font-display text-2xl md:text-3xl">Grožio mokyklos</h2>



      {query.isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : (query.data?.schools.length ?? 0) === 0 ? (
        <Card className="p-14 text-center">
          <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg">Kol kas nėra registruotų mokyklų</p>
          <p className="text-sm text-muted-foreground mt-1">Esate mokyklos atstovas? <Link to="/auth" search={{ mode: "signup" }} className="text-primary underline">Registruokite savo mokyklą</Link>.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {query.data!.schools.map((s: any) => (
            <Link key={s.id} to="/mokyklos/$slug" params={{ slug: s.slug }} className="group">
              <Card className="overflow-hidden border-border/60 hover:border-primary/50 hover:shadow-elegant transition-all h-full">
                <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                  {s.cover_url ? (
                    <img src={s.cover_url} alt={s.name} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" loading="lazy" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground"><Sparkles className="h-10 w-10" /></div>
                  )}
                  {s.is_verified && <Badge className="absolute top-2 right-2 gradient-gold text-primary-foreground border-0"><BadgeCheck className="h-3 w-3 mr-1" /> Patvirtinta</Badge>}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-xl leading-snug group-hover:text-primary">{s.name}</h3>
                  {s.city && <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {s.city}</div>}
                  {s.category && <Badge variant="outline" className="mt-2">{s.category}</Badge>}
                  {s.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{s.description}</p>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
