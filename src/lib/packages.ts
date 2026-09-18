/** Skelbimų paketai — kuo daugiau skelbimų, tuo mažesnė vieno kaina. */
export const CLASSIFIED_PACKS = [
  { credits: 1, label: "1 skelbimas", eur: 0.99, cents: 99 },
  { credits: 3, label: "3 skelbimai", eur: 1.99, cents: 199 },
  { credits: 5, label: "5 skelbimai", eur: 2.99, cents: 299 },
  { credits: 10, label: "10 skelbimų", eur: 4.99, cents: 499 },
] as const;

/** Mokymų / seminarų paskelbimo paketai (mokykloms, tiekėjams, salonams). */
export const COURSE_PACKS = [
  { credits: 1, label: "1 mokymas ar seminaras", eur: 9.99, cents: 999 },
  { credits: 3, label: "3 mokymų paketas", eur: 24.99, cents: 2499 },
  { credits: 5, label: "5 mokymų paketas", eur: 36.99, cents: 3699 },
] as const;

/** Modelių paieškos paskelbimo paketai (meistrams, salonams, mokykloms). */
export const MODEL_PACKS = [
  { credits: 1, label: "1 modelių paieška", eur: 3.99, cents: 399 },
  { credits: 3, label: "3 modelių paieškų paketas", eur: 9.99, cents: 999 },
  { credits: 5, label: "5 modelių paieškų paketas", eur: 14.99, cents: 1499 },
] as const;

export const CLASSIFIED_KEYS = CLASSIFIED_PACKS.map((p) => `classified_pack_${p.credits}`);
export const COURSE_KEYS = [...COURSE_PACKS.map((p) => `course_pack_${p.credits}`), "course"];
export const MODEL_KEYS = [...MODEL_PACKS.map((p) => `model_pack_${p.credits}`), "model_call"];

export function perListingEur(pack: { eur: number; credits: number }) {
  return Math.round((pack.eur / pack.credits) * 100) / 100;
}

/** Kiek sutaupoma, palyginti su vieno vienetu kaina. */
export function packSavingEur(pack: { eur: number; credits: number }, singleEur: number) {
  return Math.max(0, Math.round((singleEur * pack.credits - pack.eur) * 100) / 100);
}
