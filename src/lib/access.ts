/**
 * Dual-World Architecture: B2C klientų portalas vs. B2B verslo ekosistema.
 * Vienas tiesos šaltinis rolėms, narystės lygiams ir kainoms.
 */

export const BUSINESS_ROLES = ["salon", "staff", "supplier", "school", "advertiser", "admin", "super_admin"] as const;
/** Meistrės ir salonai (forumas skirtas tik jiems – be tiekėjų ir klientų). */
export const PROVIDER_ROLES = ["salon", "staff", "admin", "super_admin"] as const;
export const ADMIN_ROLES = ["admin", "super_admin"] as const;


export function isBusinessRole(role?: string | null) {
  return !!role && (BUSINESS_ROLES as readonly string[]).includes(role);
}
export function isProviderRole(role?: string | null) {
  return !!role && (PROVIDER_ROLES as readonly string[]).includes(role);
}
export function isAdminRole(role?: string | null) {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * VIENAS TIESOS ŠALTINIS: kuri rolė kurią skiltį mato.
 * Naudok `canSee(role, "suppliers")` visur vietoj bendro `isBusinessRole`.
 */
export const SECTIONS = ["classifieds", "suppliers", "schools", "forum", "marketplace", "calendar", "jobs"] as const;
export type Section = (typeof SECTIONS)[number];

const ALL: Section[] = [...SECTIONS];

export const ROLE_SECTIONS: Record<string, Section[]> = {
  /** Meistrė / Salonas – vienas verslo pasaulis (kalendorius atsiveria su PRO priedu). */
  salon: ["classifieds", "suppliers", "schools", "forum", "marketplace", "calendar", "jobs"],
  staff: ["classifieds", "suppliers", "schools", "forum", "marketplace", "calendar", "jobs"],
  /** Tiekėjas – be forumo. */
  supplier: ["classifieds", "suppliers", "schools", "marketplace"],
  school: ["classifieds", "schools"],
  /** „Tik skelbikas“ – jokio tiekėjų katalogo, mokymų ar forumo. */
  advertiser: ["classifieds"],
  admin: ALL,
  super_admin: ALL,
};

/** Ar rolė mato skiltį. Klientai (ir neprisijungę) verslo skilčių nemato. */
export function canSee(role: string | null | undefined, section: Section) {
  return !!role && (ROLE_SECTIONS[role] ?? []).includes(section);
}

/** Trumpas lietuviškas paaiškinimas, kam skirta skiltis. */
export const SECTION_AUDIENCE: Record<Section, string> = {
  classifieds: "verslo paskyroms – meistrėms, salonams, tiekėjams, mokykloms, darbdaviams ir skelbikams",
  suppliers: "meistrėms, salonams ir tiekėjams",
  schools: "meistrėms, salonams, tiekėjams ir mokykloms",
  forum: "tik meistrėms ir salonams",
  marketplace: "meistrėms, salonams ir tiekėjams",
  calendar: "meistrėms ir salonams su PRO priedu",
  jobs: "darbdaviams, meistrėms ir salonams",
};

/** Kainos eurais (rodoma sąsajoje) ir centais (mokėjimams). */
export const TIER_PRICING = {
  /** Informacinė meistrės narystė – be internetinių registracijų. */
  basic: { eur: 4.99, cents: 499, label: "Informacinė narystė" },
  /** PRO priedas – atveria registracijų sistemą ir kalendorių. */
  proUpgrade: { eur: 10, cents: 1000, label: "PRO priedas" },
  /** Grožio mokyklos / akademijos narystė. */
  school: { eur: 8.99, cents: 899, label: "Akademijos narystė" },
  /** Vienas skelbimas skelbimų lentoje. */
  classified: { eur: 0.99, cents: 99, label: "Vieno skelbimo paskelbimas" },
  /** Vienas mokymų kursas akademijos kalendoriuje. */
  course: { eur: 9.99, cents: 999, label: "Vieno mokymo ar seminaro paskelbimas" },
  /** Viena modelio paieška klientų sraute. */
  modelCall: { eur: 3.99, cents: 399, label: "Vienos modelio paieškos paskelbimas" },
  /** „Tik skelbikas“ bazinė narystė – 1 aktyvus skelbimas įskaičiuotas. */
  advertiser: { eur: 4, cents: 400, label: "Skelbiko narystė" },
  /** Papildomas skelbimas skelbiko paskyrai. */
  advertiserExtra: { eur: 2, cents: 200, label: "Papildomas skelbimas" },
  /** Skelbimo paryškinimas (savaitei). */
  highlight: { eur: 2.99, cents: 299, label: "Skelbimo paryškinimas" },
  /** Tiekėjo bazinė narystė – tik profilis (Tiekėjas / Vadyba). */
  supplier: { eur: 9.99, cents: 999, label: "Tiekėjo bazinė narystė" },
  /** Priedas: specialių pasiūlymų teikimas meistrėms ir salonams. */
  supplierOffers: { eur: 4.99, cents: 499, label: "Specialių pasiūlymų priedas" },
  /** Vienas seminaras tiekėjo mokymų kalendoriuje. */
  supplierSeminar: { eur: 4.99, cents: 499, label: "Seminaras mokymų kalendoriuje" },
  /** Naujienlaiškio išsiuntimas meistrėms. */
  newsletter: { eur: 4.99, cents: 499, label: "Naujienlaiškis meistrėms" },
} as const;

/** Banerio reklamos paketai (rodoma tiekėjams ir verslo paskyroms). */
export const BANNER_PACKS = [
  { days: 3, eur: 14.99, cents: 1499, label: "3 dienos" },
  { days: 7, eur: 24.99, cents: 2499, label: "7 dienos" },
  { days: 14, eur: 39.99, cents: 3999, label: "14 dienų" },
  { days: 30, eur: 69.99, cents: 6999, label: "30 dienų" },
] as const;

/**
 * Mokėjimų maršrutizavimas: mažos vienkartinės sumos – Paysera,
 * narystės ir didesni mokėjimai – Stripe.
 */
export const PAYSERA_MAX_EUR = 10;
export function paymentProviderFor(amountEur: number, recurring = false): "stripe" | "paysera" {
  if (recurring) return "stripe";
  return amountEur <= PAYSERA_MAX_EUR ? "paysera" : "stripe";
}


export const BASIC_PORTFOLIO_PHOTO_LIMIT = 5;

/**
 * Vienintelis narystės kainų šaltinis (eurais).
 * Metinis planas = 10 mėn. kaina (2 mėn. nemokamai).
 */
export const YEARLY_MONTHS = 10;

export const MEMBERSHIP_PLANS = {
  /** Informacinė narystė – be internetinių registracijų. */
  basic: {
    label: "Bazinė narystė",
    monthly: TIER_PRICING.basic.eur,
    yearly: +(TIER_PRICING.basic.eur * YEARLY_MONTHS).toFixed(2),
  },
  /** Bazinė + PRO priedas – registracijos, kalendorius, mokėjimai. */
  pro: {
    label: "PRO narystė",
    monthly: +(TIER_PRICING.basic.eur + TIER_PRICING.proUpgrade.eur).toFixed(2),
    yearly: +((TIER_PRICING.basic.eur + TIER_PRICING.proUpgrade.eur) * YEARLY_MONTHS).toFixed(2),
  },
} as const;

/** Kaina eurais su lietuvišku kablelio formatu. */
export function eurFromNumber(amount: number) {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}


/** Mokyklos narystė: pirmi 6 mėn. nemokamai (mokymų kalendorius veikia pilnai). */
export const SCHOOL_TRIAL_MONTHS = 6;

/**
 * Kuriame „pasaulyje“ vartotojas: klientams B2C, verslui B2B.
 * Skelbikas naršo kaip galutinis vartotojas (B2C) – jam rodomas tik
 * papildomas skelbimų valdymas, o ne visas verslo pasaulis.
 */
export function worldFor(role?: string | null): "b2c" | "b2b" {
  if (role === "advertiser") return "b2c";
  return isBusinessRole(role) ? "b2b" : "b2c";
}


export function eur(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}
