/**
 * Skelbimų (Nuoma / Pardavimai / Darbas) daugiapakopė struktūra.
 * Vienas šaltinis ir filtrams, ir skelbimo anketai.
 */

export const LISTING_KINDS = [
  { key: "nuoma", label: "Nuoma" },
  { key: "pardavimai", label: "Pardavimai" },
  { key: "darbas_siulo", label: "Siūlo darbą" },
  { key: "darbas_iesko", label: "Ieško darbo" },
] as const;

export type ListingKind = (typeof LISTING_KINDS)[number]["key"];

export const SUBTYPES = [
  { key: "patalpos", label: "Patalpos" },
  { key: "iranga", label: "Įranga" },
  { key: "verslas", label: "Verslas" },
] as const;

export type ListingSubtype = (typeof SUBTYPES)[number]["key"];

/** Kokie potipiai galimi kiekviename skelbimo tipe. */
export const SUBTYPES_BY_KIND: Record<ListingKind, ListingSubtype[]> = {
  nuoma: ["patalpos", "iranga"],
  pardavimai: ["patalpos", "iranga", "verslas"],
  darbas_siulo: [],
  darbas_iesko: [],
};

/** Patalpų tipas — nuomai (kėdė / kabinetas / salonas), pardavimui (kabinetas / salonas). */
export const PLACE_TYPES = [
  { key: "kede", label: "Kėdė" },
  { key: "kabinetas", label: "Kabinetas" },
  { key: "salonas", label: "Salonas" },
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number]["key"];

export function placeTypesFor(kind: ListingKind): PlaceType[] {
  return kind === "nuoma" ? ["kede", "kabinetas", "salonas"] : ["kabinetas", "salonas"];
}

/** Verslo pardavimo tipas. */
export const BUSINESS_TYPES = [
  { key: "salonas", label: "Salonas" },
  { key: "imone", label: "Įmonė" },
] as const;

/** Paslaugų sritys — naudojamos filtruose visose kategorijose. */
export { CLASSIFIED_SERVICE_CATEGORIES as SERVICE_CATEGORIES } from "@/lib/service-taxonomy";
import { CLASSIFIED_SERVICE_CATEGORIES, serviceCategoryLabel } from "@/lib/service-taxonomy";

export type ServiceCategory = (typeof CLASSIFIED_SERVICE_CATEGORIES)[number]["key"];

export function kindLabel(k?: string | null) {
  return LISTING_KINDS.find((x) => x.key === k)?.label ?? "Skelbimas";
}
export function subtypeLabel(s?: string | null) {
  return SUBTYPES.find((x) => x.key === s)?.label ?? null;
}
export function placeLabel(p?: string | null) {
  return PLACE_TYPES.find((x) => x.key === p)?.label ?? null;
}
export function serviceLabel(s?: string | null) {
  return serviceCategoryLabel(s);
}

/**
 * Filtrų eiliškumas pagal UX schemą:
 * Nuoma/Patalpos: Miestas → Patalpos tipas → Paslaugų sritis
 * Įranga: Paslaugų sritis → Miestas
 * Verslas: visa Lietuva
 * Darbas: Paslaugų sritis → Miestas
 */
export function filterOrder(kind: ListingKind, subtype: ListingSubtype | null): ("city" | "place" | "service")[] {
  if (kind === "darbas_siulo" || kind === "darbas_iesko") return ["service", "city"];
  if (subtype === "iranga") return ["service", "city"];
  if (subtype === "verslas") return [];
  if (subtype === "patalpos") return kind === "nuoma" ? ["city", "place", "service"] : ["city", "service"];
  return ["city"];
}
