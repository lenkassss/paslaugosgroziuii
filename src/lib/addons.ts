import { BANNER_PACKS, TIER_PRICING } from "@/lib/access";
import { CLASSIFIED_PACKS, COURSE_PACKS, MODEL_PACKS, packSavingEur } from "@/lib/packages";

/** Papildomų paslaugų (priedų) katalogas — vienas tiesos šaltinis. */
export type AddonKey =
  | "supplier_offers"
  | "newsletter"
  | "classified_extra"
  | `special_offer_${"b2c" | "b2b"}_${7 | 14 | 21 | 30}`
  | `classified_pack_${number}`
  | `course_pack_${number}`
  | `model_pack_${number}`
  | `banner_${number}`;

export type AddonItem = {
  key: string;
  label: string;
  description: string;
  eur: number;
  cents: number;
  /** Kiek dienų priedas aktyvus (0 = vienkartinis, be galiojimo). */
  days: number;
  /** Kiek skelbimų kreditų priskiriama nusipirkus. */
  credits?: number;
  /** Kurios rolės gali pirkti. */
  roles: string[];
  /** Kur vartotojas iš karto kuria arba tvarko įsigytą paslaugą. */
  actionTo?: string;
  actionLabel?: string;
  audience?: "Klientams" | "Verslui";
};

export const ADDONS: AddonItem[] = [
  {
    key: "supplier_offers",
    label: TIER_PRICING.supplierOffers.label,
    description: "Galimybė skelbti specialius pasiūlymus meistrėms ir salonams (30 d.).",
    eur: TIER_PRICING.supplierOffers.eur,
    cents: TIER_PRICING.supplierOffers.cents,
    days: 30,
    roles: ["supplier", "admin", "super_admin"],
    actionTo: "/dashboard/supplier/feed",
    actionLabel: "Kurti pasiūlymą",
  },
  {
    key: "newsletter",
    label: TIER_PRICING.newsletter.label,
    description: "Naujienlaiškio išsiuntimas meistrėms ir salonams.",
    eur: TIER_PRICING.newsletter.eur,
    cents: TIER_PRICING.newsletter.cents,
    days: 0,
    roles: ["supplier", "school", "admin", "super_admin"],
  },
  ...COURSE_PACKS.map((p) => {
    const saving = packSavingEur(p, COURSE_PACKS[0].eur);
    return {
      key: `course_pack_${p.credits}`,
      label: `Mokymai / seminarai — ${p.label}`,
      description: saving > 0
        ? `Paskelbk ${p.credits} mokymus bendrame kalendoriuje — sutaupai ~${saving.toFixed(2)} €.`
        : "Paskelbk vienus mokymus ar seminarą bendrame mokymų kalendoriuje.",
      eur: p.eur,
      cents: p.cents,
      days: 0,
      credits: p.credits,
      roles: ["salon", "staff", "school", "supplier", "admin", "super_admin"],
      actionTo: "/dashboard/salon/content",
      actionLabel: "Skelbti mokymus",
    } satisfies AddonItem;
  }),
  ...MODEL_PACKS.map((p) => {
    const saving = packSavingEur(p, MODEL_PACKS[0].eur);
    return {
      key: `model_pack_${p.credits}`,
      label: `Ieškomi modeliai — ${p.label}`,
      description: saving > 0
        ? `${p.credits} modelių paieškos skelbimai — sutaupai ~${saving.toFixed(2)} €.`
        : "Paskelbk vieną modelio paiešką pagal procedūrą, miestą ir datą.",
      eur: p.eur,
      cents: p.cents,
      days: 0,
      credits: p.credits,
      roles: ["salon", "staff", "school", "admin", "super_admin"],
      actionTo: "/dashboard/salon/models",
      actionLabel: "Ieškoti modelio",
    } satisfies AddonItem;
  }),
  ...([7, 14, 21, 30] as const).flatMap((days) =>
    (["b2c", "b2b"] as const).map((audience) => {
      const eur = days === 7 ? 4.99 : days === 14 ? 7.99 : days === 21 ? 10.99 : 13.99;
      return {
        key: `special_offer_${audience}_${days}`,
        label: `Specialus pasiūlymas — ${days === 30 ? "1 mėnuo" : `${days} d.`}`,
        description: audience === "b2c"
          ? "Pasiūlymas bus matomas klientų specialių pasiūlymų skiltyje."
          : "Pasiūlymas bus matomas grožio industrijos profesionalams.",
        eur,
        cents: Math.round(eur * 100),
        days,
        roles: ["salon", "staff", "supplier", "school", "admin", "super_admin"],
        actionTo: "/dashboard/salon/content",
        actionLabel: "Kurti pasiūlymą",
        audience: audience === "b2c" ? "Klientams" : "Verslui",
      } satisfies AddonItem;
    }),
  ),
  ...CLASSIFIED_PACKS.map((p) => ({
    key: `classified_pack_${p.credits}`,
    label: `Skelbimai — ${p.label}`,
    description:
      p.credits === 1
        ? "Vienas skelbimas be narystės."
        : `${p.label} paketas — pigiau už vieną skelbimą.`,
    eur: p.eur,
    cents: p.cents,
    days: 0,
    credits: p.credits,
    roles: ["advertiser", "salon", "staff", "supplier", "school", "admin", "super_admin"],
    actionTo: "/skelbimai",
    actionLabel: "Kurti skelbimą",
  })),
  ...BANNER_PACKS.map((p) => ({
    key: `banner_${p.days}`,
    label: `Banerio reklama — ${p.label}`,
    description: `Banerio reklama platformoje ${p.days} d.`,
    eur: p.eur,
    cents: p.cents,
    days: p.days,
    roles: ["supplier", "salon", "staff", "school", "advertiser", "admin", "super_admin"],
    actionTo: "/dashboard/salon/promote",
    actionLabel: "Reklamuoti turinį",
  })),
];

export function addonByKey(key: string) {
  return ADDONS.find((a) => a.key === key) ?? null;
}

export function addonsForRole(role?: string | null) {
  return ADDONS.filter((a) => !!role && a.roles.includes(role));
}

/** Skelbimo paryškinimas — savaitės kaina. */
export const HIGHLIGHT = TIER_PRICING.highlight;
