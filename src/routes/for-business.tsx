import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scissors, Store, Package, GraduationCap, Megaphone, CheckCircle2, Gift, Users,
  ArrowRight, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSection } from "@/lib/use-site-content";
import { SiteBlocks } from "@/components/site-blocks";

export const Route = createFileRoute("/for-business")({
  component: ForBusiness,
  head: () => ({
    meta: [
      { title: "Grožio industrija – PaslaugosGrožiui verslui" },
      {
        name: "description",
        content: "Salonams, meistrams, tiekėjams, mokykloms ir skelbėjams: profilis, klientai, mokymai, skelbimai ir modelių paieškos vienoje platformoje.",
      },
      { property: "og:title", content: "Grožio industrija – PaslaugosGrožiui verslui" },
      { property: "og:description", content: "Visa grožio industrija vienoje platformoje. Pasirink savo veiklą ir tapk nariu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type BizRole = {
  key: string;
  /** Kokia rolė sukuriama registruojantis. */
  signupRole: "salon" | "supplier" | "school" | "advertiser";
  icon: React.ComponentType<{ className?: string }>;
  tab: string;
  greeting: string;
  lead: string;
  benefits: string[];
};

const ROLES: BizRole[] = [
  {
    key: "salon",
    signupRole: "salon",
    icon: Store,
    tab: "Salonas",
    greeting: "Sveiki, Salone!",
    lead: "Visa salono komanda, kalendorius ir klientai vienoje vietoje.",
    benefits: [
      "Salono profilis su darbų galerija, paslaugomis ir kontaktais",
      "Internetinės klientų registracijos ir gyvas kalendorius",
      "Komandos (meistrų) kalendoriai ir darbo laikas",
      "Priminimai klientams mūsų vardu – mažiau neatėjimų",
      "Modelių paieškos naujoms technikoms",
      "Verslo erdvė: tiekėjai, skelbimai, forumas, mokymai",
    ],
  },
  {
    key: "master",
    signupRole: "salon",
    icon: Scissors,
    tab: "Individualus meistras",
    greeting: "Labas, Meistre!",
    lead: "Tavo asmeninis profilis ir klientų srautas be jokių tarpininkų.",
    benefits: [
      "Asmeninis profilis: darbų foto, paslaugos, kainos, kontaktai",
      "Klientai randa tave pagal miestą, paslaugą ir prekinį ženklą",
      "Registracijos ir kalendorius – arba tik informacinė narystė",
      "Specialūs mėnesio pasiūlymai iš tiekėjų",
      "Modelių paieškos skelbimai",
      "Mokymai ir seminarai kalendoriuje 12 mėn. į priekį",
    ],
  },
  {
    key: "supplier",
    signupRole: "supplier",
    icon: Package,
    tab: "Tiekėjas",
    greeting: "Sveiki, Tiekėjai!",
    lead: "Tavo produkcija – tiesiai pas meistrus ir salonus.",
    benefits: [
      "Prekių katalogas su prekiniais ženklais ir kainomis",
      "Specialūs pasiūlymai, matomi tik verslo paskyroms",
      "Seminarų ir mokymų kėlimas į bendrą kalendorių",
      "Savo įrašai tiekėjų pasiūlymų sraute",
      "Modelių paieškos demonstracijoms ir mokymams",
      "Statistika: peržiūros ir susidomėjimas",
    ],
  },
  {
    key: "school",
    signupRole: "school",
    icon: GraduationCap,
    tab: "Grožio mokykla",
    greeting: "Sveiki, Mokykla!",
    lead: "Mokymai, kurie užsipildo be skambučių ir Excel'ių.",
    benefits: [
      "Mokyklos profilis, logotipas ir viršelis",
      "Kursų kalendorius 12 mėn. į priekį",
      "Registracijos su laisvų vietų skaičiavimu",
      "Dalyvių sąrašai ir apmokėjimų žymėjimas",
      "Modelių paieškos praktikos užsiėmimams",
      "Patvirtinimo laiškai dalyviams mūsų vardu",
    ],
  },
  {
    key: "advertiser",
    signupRole: "advertiser",
    icon: Megaphone,
    tab: "Skelbimai",
    greeting: "Labas, Skelbėjau!",
    lead: "Tik tai, ko reikia – skelbimų lenta grožio industrijai.",
    benefits: [
      "Skelbimai: nuoma, pardavimai, darbo pasiūlymai",
      "Iki 5 foto viename skelbime",
      "Paryškinimas, kad skelbimas būtų viršuje",
      "Anketą patvirtina administratorius – tikri skelbėjai",
      "Jokių nereikalingų skilčių – aiškus, paprastas valdymas",
    ],
  },
];

function ForBusiness() {
  const [open, setOpen] = useState<string | null>("salon");
  const block = useSection("for-business", "intro");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
      <div className="text-center">
        <Badge variant="outline" className="rounded-full border-cyclamen/50 text-cyclamen">
          <Gift className="mr-1.5 h-3 w-3" /> Pirmi 2 mėnesiai nemokamai
        </Badge>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyclamen">
          Grožio industrija
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
          {block?.title ?? (<>PaslaugosGrožiui – <span className="text-gradient-gold">Jūsų partneris grožio verslo augimui</span></>)}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-display text-lg text-foreground/90 sm:text-xl">
          {block?.subtitle || "Visa grožio industrija vienoje platformoje."}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {block?.body_text ||
            "Atraskite patikimus tiekėjus, profesinius mokymus, kabinetų ir įrangos pasiūlymus bei naujas bendradarbiavimo galimybes. Platforma vienija grožio specialistus, salonus, mokyklas ir klientus visoje Lietuvoje."}
        </p>
      </div>

      <div className="mt-8 grid gap-3">
        {ROLES.map((r) => {
          const on = open === r.key;
          return (
            <Card
              key={r.key}
              className={cn(
                "overflow-hidden transition-colors",
                on ? "border-cyclamen/50" : "border-border/70",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(on ? null : r.key)}
                aria-expanded={on}
                className="flex w-full items-center gap-4 p-4 text-left transition active:scale-[0.995] md:p-5"
              >
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors",
                    on ? "bg-cyclamen text-primary-foreground" : "bg-muted text-foreground",
                  )}
                >
                  <r.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg font-semibold">{r.tab}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.lead}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", on && "rotate-180 text-cyclamen")} />
              </button>

              {on && (
                <div className="animate-fade-in border-t border-border/60 p-4 md:p-5">
                  <h2 className="font-display text-xl font-semibold">{r.greeting}</h2>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {r.benefits.map((b) => (
                      <div key={b} className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyclamen" />
                        <span className="text-sm">{b}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    asChild
                    size="lg"
                    className="btn-press mt-5 h-13 w-full rounded-xl gradient-gold text-primary-foreground shadow-elegant"
                  >
                    <Link to="/auth" search={{ mode: "signup", role: r.signupRole } as never}>
                      Tapk nariu <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-cyclamen/40 bg-cyclamen/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Gift className="h-4 w-4 text-cyclamen" /> 2 mėnesiai nemokamai visoms narystėms
        </div>
        <p className="mt-1.5 flex items-start gap-2 text-xs text-muted-foreground">
          <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Pakviesk 10 žmonių, kurie užsiregistruos pagal tavo nuorodą – gauk dar 3-ią mėnesį nemokamai.
        </p>
      </div>
      <SiteBlocks page="for-business" />
    </div>
  );
}
