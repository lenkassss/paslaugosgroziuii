import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/taisykles")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Naudojimo taisyklės · PaslaugosGrožiui" },
      { name: "description", content: "PaslaugosGrožiui naudojimo taisyklės: rezervacijos, atšaukimai, mokėjimai, platformos mokestis ir naudotojų atsakomybė." },
      { property: "og:title", content: "Naudojimo taisyklės · PaslaugosGrožiui" },
      { property: "og:description", content: "Rezervacijų, atšaukimų ir mokėjimų sąlygos PaslaugosGrožiui platformoje." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "1. Paslaugos esmė",
    p: [
      "PaslaugosGrožiui yra rezervacijų platforma, sujungianti klientus su grožio meistrais, salonais, mokyklomis ir tiekėjais.",
      "Pačias paslaugas atlieka nepriklausomi paslaugų teikėjai — platforma tarpininkauja rezervuojant laiką ir apmokant.",
    ],
  },
  {
    h: "2. Paskyra",
    p: [
      "Registruodamasis pateiki teisingus duomenis ir atsakai už savo prisijungimo saugumą.",
      "Vieną paskyrą naudoja vienas asmuo arba vienas verslas. Verslo paskyros gali būti patikrintos prieš aktyvavimą.",
      "Paskyrą gali bet kada ištrinti profilio nustatymuose — duomenys pašalinami negrįžtamai.",
    ],
  },
  {
    h: "3. Rezervacijos ir atšaukimai",
    p: [
      "Rezervacija galioja tik gavus patvirtinimą. Priminimą gauni 24 val. prieš vizitą.",
      "Rezervaciją galima perkelti ar atšaukti platformoje; vėlyvo atšaukimo atveju gali būti taikomas iki 30 % paslaugos kainos mokestis.",
      "Neatvykus be atšaukimo paslaugos teikėjas turi teisę pasilikti avansą.",
    ],
  },
  {
    h: "4. Mokėjimai ir platformos mokestis",
    p: [
      "Mokėti galima vietoje arba kortele. Kortele apmokant taikomas platformos aptarnavimo mokestis, matomas prieš patvirtinimą.",
      "Kainos nurodomos eurais su PVM, jei taikoma.",
    ],
  },
  {
    h: "5. Turinys ir elgesys",
    p: [
      "Atsiliepimai turi būti tikri ir pagrįsti realiu vizitu. Įžeidžiantis, klaidinantis ar reklaminis turinys šalinamas.",
      "Piktnaudžiaujančios paskyros gali būti laikinai arba visam laikui blokuojamos.",
    ],
  },
  {
    h: "6. Atsakomybės ribos",
    p: [
      "Platforma neatsako už paslaugų teikėjų atliktų procedūrų kokybę, tačiau padeda sprendžiant nesutarimus.",
      "Taisyklės gali būti atnaujinamos — apie esminius pakeitimus informuojame platformoje.",
    ],
  },
];

function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 md:pb-16 md:pt-10">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl gradient-gold text-primary-foreground">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl sm:text-3xl">Naudojimo taisyklės</h1>
          <p className="text-xs text-muted-foreground">Atnaujinta 2026 m.</p>
        </div>
      </header>

      <Card className="mt-6 space-y-6 rounded-3xl border-border/60 p-5 md:p-7">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-lg">{s.h}</h2>
            <div className="mt-2 space-y-2">
              {s.p.map((t) => (
                <p key={t} className="text-sm leading-relaxed text-muted-foreground">{t}</p>
              ))}
            </div>
          </section>
        ))}
      </Card>
    </div>
  );
}
