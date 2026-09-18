import { createFileRoute, Link } from "@tanstack/react-router";
import { useSection } from "@/lib/use-site-content";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Store, Truck, Scissors, GraduationCap, Megaphone } from "lucide-react";
import { MEMBERSHIP_PLANS, TIER_PRICING, BANNER_PACKS, SCHOOL_TRIAL_MONTHS, eur } from "@/lib/access";
import { AdvertiserApply } from "@/components/advertiser-apply";
import { SiteBlocks } from "@/components/site-blocks";

export const Route = createFileRoute("/pricing")({
  component: Pricing,
  head: () => ({
    meta: [
      { title: "Kainos – PaslaugosGrožiui" },
      { name: "description", content: "Bazinė narystė 4,99 €/mėn., PRO su registracijomis 14,99 €/mėn., mokykloms 8,99 €/mėn. Metinis planas – 2 mėn. nemokamai. Klientams visada nemokama." },
      { property: "og:title", content: "Kainos – PaslaugosGrožiui" },
      { property: "og:description", content: "Skaidrūs planai meistrėms, salonams, mokykloms ir tiekėjams. Metinis planas – 2 mėn. nemokamai." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function Pricing() {
  const block = useSection("pricing", "intro");
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      key: "free",
      name: "Klientas",
      icon: Sparkles,
      price: { monthly: 0, yearly: 0 },
      unit: "visada",
      features: [
        "Rezervuok laikus tiesiogiai",
        "Sek mėgstamiausius meistrus",
        "Rašyk atsiliepimus ir komentarus",
        "Gauk pranešimus apie akcijas",
      ],
      cta: "Registruotis",
      highlight: false,
    },
    {
      key: "master",
      name: "Meistrė / Salonas – bazinė",
      icon: Scissors,
      price: MEMBERSHIP_PLANS.basic,
      features: [
        "Skirta meistrėms ir salonams",
        "Viešas profilis ir kontaktai",
        "Iki 5 darbų nuotraukų",
        "Tiekėjų katalogas ir pasiūlymai",
        "Skelbimai ir renginiai",
        "BE internetinių registracijų (skambina klientai)",
      ],
      cta: "Aktyvuoti",
      highlight: false,
    },
    {
      key: "pro",
      name: "Meistrė / Salonas – PRO",
      icon: Store,
      price: MEMBERSHIP_PLANS.pro,
      features: [
        "Pilnai veikianti narystė",
        "Viskas iš bazinės narystės",
        "Internetinės registracijos ir kalendorius",
        "Komandos meistrių valdymas",
        "Prioritetas paieškoje ir žemėlapyje",
        "Akcijų ir renginių publikavimas",
      ],
      cta: "Aktyvuoti",
      highlight: true,
    },
    {
      key: "school",
      name: "Mokykla",
      icon: GraduationCap,
      price: { monthly: TIER_PRICING.school.eur, yearly: +(TIER_PRICING.school.eur * 10).toFixed(2) },
      features: [
        `Pirmi ${SCHOOL_TRIAL_MONTHS} mėn. nemokamai`,
        "Mokymų kalendorius ir registracijos",
        "Diplomo programos anketa",
        `Kurso įkėlimas ${TIER_PRICING.course.eur.toFixed(2).replace(".", ",")} €`,
      ],
      cta: "Aktyvuoti",
      highlight: false,
    },
    {
      key: "advertiser",
      name: "Skelbikas",
      icon: Megaphone,
      price: { monthly: TIER_PRICING.advertiser.eur, yearly: +(TIER_PRICING.advertiser.eur * 10).toFixed(2) },
      features: [
        "Tik skelbimų skiltis – be salono profilio",
        "1 aktyvus skelbimas įskaičiuotas",
        `Papildomas skelbimas ${eur(TIER_PRICING.advertiserExtra.cents)}`,
        `Paryškinimas ${eur(TIER_PRICING.highlight.cents)} / savaitei`,
        "Suteikiama tik po anketos patvirtinimo",
      ],
      cta: "Užpildyti anketą",
      ctaTo: "#skelbiko-anketa",
      highlight: false,
    },
    {
      key: "supplier",
      name: "Tiekėjas / Vadyba",
      icon: Truck,
      price: { monthly: TIER_PRICING.supplier.eur, yearly: +(TIER_PRICING.supplier.eur * 10).toFixed(2) },
      features: [
        "Bazinė narystė — tik įmonės profilis",
        `Specialių pasiūlymų teikimas +${eur(TIER_PRICING.supplierOffers.cents)} / mėn.`,
        `Seminaras mokymų kalendoriuje ${eur(TIER_PRICING.supplierSeminar.cents)}`,
        `Naujienlaiškis meistrėms ${eur(TIER_PRICING.newsletter.cents)}`,
        `Banerio reklama nuo ${eur(BANNER_PACKS[0].cents)} (3 d.)`,
        "Aktyvuojama po rankinio patvirtinimo",
      ],
      cta: "Pateikti užklausą",
      ctaTo: "/for-suppliers",
      highlight: false,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-16">
      <div className="text-center">
        <h1 className="font-display text-4xl md:text-5xl">{block?.title || "Kainos"}</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Klientams — visada nemokama. Verslui — pasirink planą pagal savo veiklą. Metinis planas — <strong className="text-primary">2 mėn. nemokamai</strong>.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 p-1">
          <button
            onClick={() => setYearly(false)}
            className={`px-5 py-2 text-sm rounded-full transition ${!yearly ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
          >
            Mėnesinis
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-5 py-2 text-sm rounded-full transition inline-flex items-center gap-2 ${yearly ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
          >
            Metinis
            <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-semibold">2 mėn. dovanų</span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((p) => {
          const isFree = p.key === "free";
          const hidePrice = (p as { hidePrice?: boolean }).hidePrice;
          const ctaTo = (p as { ctaTo?: string }).ctaTo;
          const price = yearly ? p.price.yearly : p.price.monthly;
          const monthlyEquiv = yearly && !isFree && !hidePrice ? p.price.yearly / 12 : null;
          const Icon = p.icon;
          return (
            <Card
              key={p.key}
              className={`p-6 relative flex flex-col ${p.highlight ? "border-primary shadow-elegant" : ""}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-6 rounded-full gradient-gold px-3 py-1 text-[10px] font-semibold text-primary-foreground uppercase tracking-wide">
                  Populiariausias
                </div>
              )}
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                {isFree ? (
                  <span className="text-3xl font-display">0 €</span>
                ) : hidePrice ? (
                  <span className="text-lg text-muted-foreground">Pagal užklausą</span>
                ) : (
                  <>
                    <span className="text-3xl font-display">{fmt(price)}</span>
                    <span className="text-xs text-muted-foreground">/ {yearly ? "metams" : "mėn"}</span>
                  </>
                )}
              </div>
              {monthlyEquiv && (
                <div className="text-[11px] text-muted-foreground">≈ {fmt(monthlyEquiv)} / mėn</div>
              )}
              {yearly && !isFree && !hidePrice && (
                <Badge variant="outline" className="mt-2 border-primary/40 text-primary text-[10px] w-fit">
                  Sutaupai {fmt(p.price.monthly * 12 - p.price.yearly)}
                </Badge>
              )}

              <ul className="mt-5 space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={p.highlight ? "default" : "outline"}
                className={`mt-6 w-full ${p.highlight ? "gradient-gold text-primary-foreground btn-press hover:opacity-90" : ""}`}
              >
                {ctaTo?.startsWith("#") ? (
                  <a href={ctaTo}>{p.cta}</a>
                ) : (
                  <Link to={ctaTo ?? "/auth"} search={ctaTo ? undefined : { mode: "signup" }}>{p.cta}</Link>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      <div id="skelbiko-anketa" className="scroll-mt-24">
        <AdvertiserApply />
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Demo režime bandymui — kortelė 4242 4242 4242 4242. Realūs mokėjimai bus prijungti platformos paleidimo metu.
      </p>
      <SiteBlocks page="pricing" />
    </div>
  );
}
