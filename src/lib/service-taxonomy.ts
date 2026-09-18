/** Vienas paslaugų sričių šaltinis paieškai, profiliams ir skelbimams. */
export const SERVICE_CATEGORIES = [
  { key: "plaukai", label: "Plaukai" },
  { key: "antakiai_blakstienos", label: "Antakiai / Blakstienos" },
  { key: "makiazas", label: "Makiažas" },
  { key: "permanentinis_makiazas", label: "Permanentinis makiažas" },
  { key: "kosmetologija", label: "Kosmetologija" },
  { key: "masazas", label: "Masažas" },
  { key: "nagai", label: "Nagai" },
  { key: "depiliacija", label: "Depiliacija" },
  { key: "idegis", label: "Įdegis" },
  { key: "auskaru_verimas", label: "Auskarų vėrimas" },
  { key: "kuno_proceduros", label: "Kūno procedūros" },
] as const;

export const SERVICE_CATEGORY_LABELS = SERVICE_CATEGORIES.map((item) => item.label);
export type ServiceCategoryKey = (typeof SERVICE_CATEGORIES)[number]["key"];

/** Suderinamumas su senais skelbimų raktais. */
export const CLASSIFIED_SERVICE_CATEGORIES = [
  ...SERVICE_CATEGORIES,
  { key: "kita", label: "Kita" },
] as const;

export function serviceCategoryLabel(value?: string | null) {
  return CLASSIFIED_SERVICE_CATEGORIES.find((item) => item.key === value || item.label === value)?.label ?? null;
}

/* ------------------------------------------------------------------ */
/* Plaukų auditorijos – vienas šaltinis, kad niekur nesimaišytų       */
/* moteriškos, vyriškos ir vaikų paslaugos.                           */
/* ------------------------------------------------------------------ */

export type HairAudience = "women" | "men" | "kids";

export const HAIR_AUDIENCES: Array<{ key: HairAudience; label: string }> = [
  { key: "women", label: "Moterims" },
  { key: "men", label: "Vyrams" },
  { key: "kids", label: "Vaikams" },
];

const KIDS_RE = /vaik|mergaič|berniuk/i;
const MEN_RE = /vyr|barzd|ūsų|skutim|fade|jaunikio|mašinėle/i;
const WOMEN_RE =
  /moter|nuotak|sruog|balayage|šatiruot|ombre|air ?touch|priauginim|progin|vakarin|švent|garbanoj|kasyč|ilgų plaukų|laminav|kirpčiuk|šukuosen|sušukavim|tonavim|bangavim/i;

/** Aiški paslaugos auditorija; „all“ – tinka visiems (procedūros, priežiūra). */
export function hairAudienceOf(name: string): HairAudience | "all" {
  if (KIDS_RE.test(name)) return "kids";
  if (MEN_RE.test(name)) return "men";
  if (WOMEN_RE.test(name)) return "women";
  return "all";
}

/** Ar paslauga rodoma pasirinktai auditorijai. */
export function matchesHairAudience(name: string, audience: HairAudience) {
  const own = hairAudienceOf(name);
  return own === audience || own === "all";
}
