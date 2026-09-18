/** Visi sistemos pavadinimai lietuviškai — jokių angliškų techninių raktų sąsajoje. */

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Vyriausiasis administratorius",
  admin: "Administratorius",
  salon: "Salonas",
  staff: "Meistrė",
  supplier: "Tiekėjas",
  school: "Mokykla",
  employer: "Darbdavys",
  advertiser: "Skelbikas",
  client: "Klientas",
};

export const ROLE_SHORT_LABELS: Record<string, string> = {
  super_admin: "Vyr. adminas",
  admin: "Adminas",
  salon: "Salonas",
  staff: "Meistrė",
  supplier: "Tiekėjas",
  school: "Mokykla",
  employer: "Darbdavys",
  advertiser: "Skelbikas",
  client: "Klientas",
};

export function roleLabel(role?: string | null, short = false): string {
  if (!role) return "Vartotojas";
  return (short ? ROLE_SHORT_LABELS : ROLE_LABELS)[role] ?? role;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Laukiama",
  pending_approval: "Tvirtinama",
  paid: "Apmokėta",
  failed: "Nepavyko",
  refunded: "Grąžinta",
  succeeded: "Sėkminga",
  active: "Aktyvu",
  inactive: "Neaktyvu",
  expired: "Pasibaigė",
  cancelled: "Atšaukta",
  canceled: "Atšaukta",
  confirmed: "Patvirtinta",
  completed: "Įvykdyta",
  no_show: "Neatvyko",
  approved: "Patvirtinta",
  rejected: "Atmesta",
  draft: "Juodraštis",
  published: "Paskelbta",
  trial: "Bandomasis",
  custom: "Individualus",
};

export function statusLabel(status?: string | null): string {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status;
}

export const PLAN_LABELS: Record<string, string> = {
  "1_day": "1 diena",
  "3_days": "3 dienos",
  "1_week": "7 dienos",
  "2_weeks": "14 dienų",
  "1_month": "30 dienų",
  "3_months": "3 mėnesiai",
  trial: "Bandomasis (nemokamai)",
  custom: "Individualus",
};

export function planLabel(plan?: string | null): string {
  if (!plan) return "Individualus";
  return PLAN_LABELS[plan] ?? plan;
}
