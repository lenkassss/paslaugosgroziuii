export const AMENITIES = [
  { key: "parking", label: "Nemokama automobilių stovėjimo vieta", icon: "car" },
  { key: "wifi", label: "Belaidis internetas (Wi-Fi)", icon: "wifi" },
  { key: "coffee", label: "Kava / gaivieji gėrimai", icon: "coffee" },
  { key: "accessible", label: "Patogu žmonėms su judėjimo negalia", icon: "accessibility" },
  { key: "pets", label: "Galima su gyvūnais", icon: "pawprint" },
  { key: "cards", label: "Atsiskaitymas kortele vietoje", icon: "credit-card" },
  { key: "kids", label: "Vaikams draugiška", icon: "baby" },
  { key: "ac", label: "Oro kondicionierius", icon: "wind" },
  { key: "music", label: "Muzika pagal pageidavimą", icon: "music" },
  { key: "shower", label: "Dušas / persirengimo zona", icon: "shower-head" },
] as const;

export type AmenityKey = (typeof AMENITIES)[number]["key"];

export function amenityLabel(key: string): string {
  return AMENITIES.find((a) => a.key === key)?.label ?? key;
}

export const CANCEL_WINDOWS = [
  { mins: 0, label: "Netaikoma (galima atšaukti bet kada)" },
  { mins: 120, label: "Likus mažiau nei 2 val." },
  { mins: 360, label: "Likus mažiau nei 6 val." },
  { mins: 720, label: "Likus mažiau nei 12 val." },
  { mins: 1440, label: "Likus mažiau nei 24 val." },
  { mins: 2880, label: "Likus mažiau nei 48 val." },
] as const;

export const CANCEL_FEES = [0, 10, 20, 30, 50, 100] as const;
