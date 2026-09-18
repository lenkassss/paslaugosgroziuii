import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSection } from "@/lib/use-site-content";
import { CalendarCheck, Users, ShoppingBag, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { SiteBlocks } from "@/components/site-blocks";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "Apie mus – PaslaugosGrožiui platforma" },
      { name: "description", content: "PaslaugosGrožiui – grožio industrijos ekosistema: rezervacijos realiu laiku, profesionalų bendruomenė, B2B parduotuvė ir mokymai vienoje vietoje." },
      { property: "og:title", content: "Apie PaslaugosGrožiui" },
      { property: "og:description", content: "Rezervacijos, profesionalų tinklas, B2B parduotuvė ir mokymai – viena grožio industrijos platforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const PILLARS = [
  { Icon: CalendarCheck, title: "Rezervacijos realiu laiku", text: "Viso mėnesio laisvi laikai matomi iškart – be skambučių ir be laukimo. Užimtos dienos pažymėtos, laisvi laikai rezervuojami dviem paspaudimais." },
  { Icon: Users, title: "Profesionalų bendruomenė", text: "Meistrės, salonai, mokyklos ir tiekėjai vienoje uždaroje erdvėje: forumas, patalpų nuoma, darbo pasiūlymai." },
  { Icon: ShoppingBag, title: "B2B parduotuvė", text: "Profesionali kosmetika didmeninėmis kainomis, tiekėjų katalogai ir greitas pakartotinis užsakymas." },
  { Icon: GraduationCap, title: "Mokymai ir seminarai", text: "Kvalifikacijos kėlimas, diplomo programos ir registracija į renginius vienu paspaudimu." },
];

const STATS = [
  { value: "3 sek.", label: "iki laisvo laiko" },
  { value: "0,49 €", label: "skaidrus platformos mokestis" },
  { value: "24/7", label: "rezervacijos internetu" },
];

function About() {
  const block = useSection("about", "intro");
  return (
    <div className="min-h-[100dvh]">
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-secondary/50 via-background to-background">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-20 h-64 w-64 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-20">
          <Badge className="gradient-gold border-0 text-primary-foreground">Apie platformą</Badge>
          <h1 className="mt-4 font-display text-3xl leading-[1.1] tracking-tight sm:text-4xl md:text-5xl">
            {block?.title ?? (<>Visa grožio industrija <span className="text-gradient-gold">vienoje platformoje</span></>)}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            PaslaugosGrožiui apjungia klientus, meistres, salonus, mokyklas ir kosmetikos tiekėjus.
            Klientas randa laisvą laiką per kelias sekundes, profesionalas – klientų, žinių ir prekių vienoje vietoje.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-xl gradient-gold px-6 text-primary-foreground active:scale-95">
              <Link to="/search"><Sparkles className="mr-2 h-4 w-4" />Rasti laisvą laiką</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-xl px-6 active:scale-95">
              <Link to="/for-business">Profesionalams</Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border/60 bg-card/70 p-4 text-center backdrop-blur">
                <div className="font-display text-xl font-semibold sm:text-2xl">{s.value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Ką sukūrėme</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {PILLARS.map(({ Icon, title, text }) => (
            <Card key={title} className="p-5 transition hover:-translate-y-0.5 hover:shadow-glow">
              <span className="grid h-11 w-11 place-items-center rounded-2xl gradient-gold text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-6">
          <div className="flex min-w-0 items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold">Saugumas ir patikimumas</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Salonai ir specialistai patvirtinami rankiniu būdu, patikrinti profiliai gauna „Patikrinta“ ženklą.
                Mokėjimai apsaugoti, atšaukimo taisyklės skaidrios, o duomenys tvarkomi pagal
                {" "}<Link to="/privatumas" className="text-primary underline-offset-2 hover:underline">privatumo politiką</Link>.
              </p>
            </div>
          </div>
        </Card>

        <Card className="mt-4 p-6">
          <h3 className="font-display text-lg font-semibold">Mūsų misija</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Padaryti grožio paslaugų rezervavimą tokį pat malonų, kaip pačią patirtį salone – mobiliai, greitai ir be trinties.
            Turite klausimų? Žiūrėkite <Link to="/duk" className="text-primary underline-offset-2 hover:underline">DUK</Link> arba
            {" "}<Link to="/contact" className="text-primary underline-offset-2 hover:underline">susisiekite</Link>.
          </p>
        </Card>
      </div>
      <SiteBlocks page="about" />
    </div>
  );
}
