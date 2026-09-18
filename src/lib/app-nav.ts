import {
  LayoutDashboard, Calendar, ListChecks, Users, Settings, CreditCard, MessageCircle, ShieldCheck,
  Scissors, Gift, Newspaper, Megaphone, Bell, Flag, FolderTree, Ticket, Cog, ScrollText, Crown,
  BadgeCheck, Wallet, Store, Home, Inbox, Pin, DatabaseBackup, Lightbulb, Sparkles, GraduationCap,
  Palette, Tag,
} from "lucide-react";
import type { AppRole } from "@/lib/auth-context";

export type NavItem = {
  to: string;
  hash?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pro?: boolean;
  group?: string;
  /** Neprisijungusiam vartotojui vietoje nuorodos rodomas prisijungimo langas. */
  gated?: boolean;
};

/** Pagrindinės meniu skiltys. */
export const G_MANAGE = "Mano valdymas";
/** Vieši katalogai – salonai, meistrai, mokymai, pasiūlymai. */
export const G_BROWSE = "Naršyti";
export const G_MARKET = "Papildomos paslaugos";
/** Reklama ir populiarinimas nebeturi atskiros skilties – viskas sudėta į papildomas paslaugas. */
export const G_ADS = G_MARKET;
export const G_INFO = "Informacija ir pagalba";
/** Paskyros nustatymų skiltis meniu nebeturi – šie punktai sudėti kartu su valdymu. */
export const G_ACCOUNT = G_MANAGE;
/** Punktai be grupės sudedami į vieną akordeono kortelę. */
export const G_OTHER = "Kita";
export const GROUP_ORDER = [G_MANAGE, G_BROWSE, G_MARKET, G_INFO];

/** Paantrašių nebeturime – meniu paprastas ir aiškus. */
export const GROUP_BADGES: Record<string, string> = {};

/** Bendros skiltys, kurias mato visos rolės. */
export const COMMON: NavItem[] = [
  { to: "/contact", label: "Pagalba ir susisiekimas", icon: MessageCircle, group: G_INFO },
  { to: "/duk", label: "DUK", icon: Lightbulb, group: G_INFO },
  { to: "/about", label: "Apie mus", icon: Newspaper, group: G_INFO },
  { to: "/privatumas", label: "Privatumo politika", icon: ShieldCheck, group: G_INFO },
  { to: "/profile", label: "Profilis ir nustatymai", icon: Settings, group: G_INFO },
  { to: "/notifications", label: "Pranešimai", icon: Bell, group: G_INFO },
];

export const NAV: Record<AppRole, NavItem[]> = {
  salon: [
    { to: "/dashboard/salon/overview", label: "Apžvalga", icon: LayoutDashboard, group: G_MANAGE },
    { to: "/dashboard/salon/calendar", label: "Kalendorius ir vizitai", icon: Calendar, pro: true, group: G_MANAGE },
    { to: "/dashboard/salon/appointments", label: "Rezervacijos", icon: Users, pro: true, group: G_MANAGE },
    { to: "/dashboard/salon/clients", label: "Klientų bazė (CRM)", icon: Users, pro: true, group: G_MANAGE },
    { to: "/dashboard/salon/profile", label: "Salono informacija ir meniu", icon: Settings, group: G_MANAGE },
    { to: "/dashboard/salon/services", label: "Paslaugų meniu", icon: ListChecks, pro: true, group: G_MANAGE },
    { to: "/dashboard/salon/staff", label: "Komanda ir darbuotojai", icon: Scissors, pro: true, group: G_MANAGE },
    { to: "/skelbimai", label: "Skelbimai", icon: Megaphone, group: G_BROWSE },
    { to: "/ieskomi-modeliai", label: "Ieškomi modeliai", icon: Sparkles, group: G_BROWSE },
    { to: "/mokyklos", label: "Mokymai ir seminarai", icon: GraduationCap, group: G_BROWSE },
    { to: "/feed/akcijos", label: "Tiekėjų pasiūlymai", icon: Tag, group: G_BROWSE },
    { to: "/dashboard/b2b", label: "Profesionalų bendruomenė", icon: MessageCircle, group: G_BROWSE },
    { to: "/dashboard/salon/models", label: "Modelių paieška", icon: Sparkles, group: G_MARKET },
    { to: "/dashboard/salon/content", label: "Mokymų skelbimas ir straipsniai", icon: Newspaper, group: G_MARKET },
    { to: "/dashboard/salon/promote", label: "Reklama ir straipsniai", icon: Pin, group: G_ADS },
    { to: "/dashboard/salon/rentals", label: "Patalpų nuoma", icon: Home, group: G_MARKET },
    { to: "/dashboard/salon/inquiries", label: "Nuomos užklausos", icon: Inbox, group: G_MARKET },
    { to: "/dashboard/salon/events", label: "Renginiai", icon: Ticket, group: G_MARKET },
    { to: "/dashboard/salon/membership", label: "Narystė", icon: CreditCard, group: G_ACCOUNT },
    { to: "/dashboard/salon/wallet", label: "Piniginė", icon: Wallet, pro: true, group: G_ACCOUNT },
    { to: "/dashboard/salon/verification", label: "Patikrinimas", icon: BadgeCheck, group: G_ACCOUNT },
  ],
  staff: [
    { to: "/dashboard/salon/overview", label: "Apžvalga", icon: LayoutDashboard, group: G_MANAGE },
    { to: "/dashboard/salon/calendar", label: "Mano kalendorius ir vizitai", icon: Calendar, pro: true, group: G_MANAGE },
    { to: "/dashboard/salon/appointments", label: "Mano rezervacijos", icon: Users, pro: true, group: G_MANAGE },
    { to: "/dashboard/salon/clients", label: "Klientų bazė (CRM)", icon: Users, pro: true, group: G_MANAGE },
    { to: "/dashboard/salon/profile", label: "Profilis ir paslaugų meniu", icon: Settings, group: G_MANAGE },
    { to: "/skelbimai", label: "Skelbimai", icon: Megaphone, group: G_BROWSE },
    { to: "/ieskomi-modeliai", label: "Ieškomi modeliai", icon: Sparkles, group: G_BROWSE },
    { to: "/mokyklos", label: "Mokymai ir seminarai", icon: GraduationCap, group: G_BROWSE },
    { to: "/feed/akcijos", label: "Tiekėjų pasiūlymai", icon: Tag, group: G_BROWSE },
    { to: "/dashboard/b2b", label: "Profesionalų bendruomenė", icon: MessageCircle, group: G_BROWSE },
    { to: "/dashboard/salon/models", label: "Modelių paieška", icon: Sparkles, group: G_MARKET },
    { to: "/dashboard/salon/promote", label: "Reklama ir straipsniai", icon: Pin, group: G_ADS },
    { to: "/dashboard/salon/rentals", label: "Patalpų nuoma", icon: Home, group: G_MARKET },
    { to: "/dashboard/salon/inquiries", label: "Nuomos užklausos", icon: Inbox, group: G_MARKET },
    { to: "/dashboard/salon/membership", label: "Narystė", icon: CreditCard, group: G_ACCOUNT },
  ],
  supplier: [
    { to: "/dashboard/supplier/products", label: "Produktai", icon: Store, group: G_MANAGE },
    { to: "/dashboard/supplier/feed", label: "Mano pasiūlymai", icon: Megaphone, group: G_MANAGE },
    { to: "/dashboard/supplier/events", label: "Seminarai", icon: Ticket, group: G_MANAGE },
    { to: "/dashboard/supplier/profile", label: "Įmonės informacija", icon: Settings, group: G_MANAGE },
    { to: "/skelbimai", label: "Skelbimai", icon: Megaphone, group: G_BROWSE },
    { to: "/mokyklos", label: "Mokymai ir seminarai", icon: GraduationCap, group: G_BROWSE },
    { to: "/feed/akcijos", label: "Tiekėjų pasiūlymai verslui", icon: Tag, group: G_BROWSE },
    { to: "/dashboard/supplier/membership", label: "Narystė", icon: CreditCard, group: G_ACCOUNT },
  ],
  admin: [
    { to: "/admin", label: "Apžvalga", icon: LayoutDashboard },
    { to: "/admin/approvals", label: "Patvirtinimai", icon: BadgeCheck },
    { to: "/admin/users", label: "Vartotojai", icon: Users },
    { to: "/admin/verifications", label: "Patikrinimai", icon: BadgeCheck },
    { to: "/admin/supplier-requests", label: "Tiekėjų užklausos", icon: Store },
    { to: "/admin/content", label: "Turinys", icon: MessageCircle },
    { to: "/admin/comments", label: "Komentarai", icon: Flag },
    { to: "/admin/ads", label: "Reklamos", icon: Megaphone },
    { to: "/admin/promotions", label: "Prikabintas turinys", icon: Pin },
    { to: "/admin/memberships", label: "Narystės", icon: CreditCard },
    { to: "/admin/appointments", label: "Rezervacijos", icon: Calendar },
    { to: "/admin/catalog", label: "Katalogas", icon: FolderTree },
    { to: "/admin/suggestions", label: "Paslaugų pasiūlymai", icon: Lightbulb },
    { to: "/admin/system", label: "Sistema", icon: Cog },
    { to: "/admin/audit", label: "Veiksmų žurnalas", icon: ScrollText },
    { to: "/notifications", label: "Pranešimai", icon: Bell },
  ],
  super_admin: [
    { to: "/super-admin", label: "Super Admin", icon: Crown },
    { to: "/admin", label: "Apžvalga", icon: LayoutDashboard },
    { to: "/admin/approvals", label: "Patvirtinimai", icon: BadgeCheck },
    { to: "/admin/users", label: "Vartotojai", icon: Users },
    { to: "/admin/verifications", label: "Patikrinimai", icon: BadgeCheck },
    { to: "/admin/supplier-requests", label: "Tiekėjų užklausos", icon: Store },
    { to: "/admin/content", label: "Turinys", icon: Newspaper },
    { to: "/admin/comments", label: "Komentarai", icon: Flag },
    { to: "/admin/ads", label: "Reklamos", icon: Megaphone },
    { to: "/admin/promotions", label: "Prikabintas turinys", icon: Pin },
    { to: "/admin/memberships", label: "Narystės", icon: CreditCard },
    { to: "/admin/appointments", label: "Rezervacijos", icon: Calendar },
    { to: "/admin/catalog", label: "Katalogas", icon: FolderTree },
    { to: "/admin/suggestions", label: "Paslaugų pasiūlymai", icon: Lightbulb },
    { to: "/admin/system", label: "Sistema", icon: Cog },
    { to: "/admin/audit", label: "Veiksmų žurnalas", icon: ScrollText },
    { to: "/notifications", label: "Pranešimai", icon: Bell },
  ],
  client: [
    { to: "/dashboard/customer", label: "Mano rezervacijos", icon: Calendar, group: G_MANAGE },
    { to: "/megstami", label: "Įsiminti salonai", icon: Sparkles, group: G_MANAGE },
    { to: "/feed/akcijos", label: "Specialūs pasiūlymai", icon: Tag, group: G_BROWSE },
    { to: "/ieskomi-modeliai", label: "Ieškomi modeliai", icon: Sparkles, group: G_BROWSE },
    { to: "/", hash: "aktualijos", label: "Aktualijos / Straipsniai", icon: Newspaper, group: G_BROWSE },
    { to: "/meistrai", label: "Individualūs meistrai", icon: Scissors, group: G_BROWSE },
    { to: "/salonai", label: "Salonai", icon: Store, group: G_BROWSE },
    { to: "/prekiniai-zenklai", label: "Prekiniai ženklai", icon: Tag, group: G_BROWSE },
    { to: "/mokyklos", label: "Tapk grožio srities specialistu", icon: GraduationCap, group: G_BROWSE },
  ],
  school: [
    { to: "/dashboard/school/courses", label: "Mokykla ir kursai", icon: GraduationCap, group: G_MANAGE },
    { to: "/dashboard/school/registrations", label: "Mokymų registracijos", icon: Users, group: G_MANAGE },
    { to: "/skelbimai", label: "Skelbimai", icon: Megaphone, group: G_BROWSE },
    { to: "/feed/akcijos", label: "Tiekėjų pasiūlymai", icon: Tag, group: G_BROWSE },
  ],
  /** Skelbikas – tik skelbimai ir jų reklama, be modelių paieškos ar mokymų. */
  advertiser: [
    { to: "/skelbimai", label: "Mano skelbimai", icon: Megaphone, group: G_MANAGE },
  ],
};

const CLIENT_FALLBACK: NavItem[] = [
  { to: "/feed/akcijos", label: "Specialūs pasiūlymai", icon: Tag, group: G_BROWSE, gated: true },
  { to: "/ieskomi-modeliai", label: "Ieškomi modeliai", icon: Sparkles, group: G_BROWSE },
  { to: "/", hash: "aktualijos", label: "Aktualijos / Straipsniai", icon: Newspaper, group: G_BROWSE },
  { to: "/meistrai", label: "Individualūs meistrai", icon: Scissors, group: G_BROWSE },
  { to: "/salonai", label: "Salonai", icon: Store, group: G_BROWSE },
  { to: "/prekiniai-zenklai", label: "Prekiniai ženklai", icon: Tag, group: G_BROWSE },
  { to: "/mokyklos", label: "Tapk grožio srities specialistu", icon: GraduationCap, group: G_BROWSE },
];

/** Viršutiniai burbuliukai – tas pats sąrašas kaip meniu „Naršyti“/valdymo punktai. */
export type BubbleTile = { label: string; hint: string; to: string; hash?: string };

export const ROLE_TILES: Record<string, BubbleTile[]> = {
  guest: [
    { label: "Specialūs pasiūlymai", hint: "Akcijos ir nuolaidos", to: "/feed/akcijos" },
    { label: "Ieškomi modeliai", hint: "Procedūros modeliams", to: "/ieskomi-modeliai" },
    { label: "Aktualijos / Straipsniai", hint: "Naujienos ir tendencijos", to: "/", hash: "aktualijos" },
    { label: "Individualūs meistrai", hint: "Visi meistrų profiliai", to: "/meistrai" },
    { label: "Salonai", hint: "Visi salonų profiliai", to: "/salonai" },
    { label: "Prekiniai ženklai", hint: "Profesionali kosmetika", to: "/prekiniai-zenklai" },
    { label: "Tapk grožio srities specialistu", hint: "Mokyklų ir kursų sąrašas", to: "/mokyklos" },
  ],
  client: [
    { label: "Specialūs pasiūlymai", hint: "Akcijos ir nuolaidos", to: "/feed/akcijos" },
    { label: "Ieškomi modeliai", hint: "Procedūros modeliams", to: "/ieskomi-modeliai" },
    { label: "Aktualijos / Straipsniai", hint: "Naujienos ir tendencijos", to: "/", hash: "aktualijos" },
    { label: "Individualūs meistrai", hint: "Visi meistrų profiliai", to: "/meistrai" },
    { label: "Salonai", hint: "Visi salonų profiliai", to: "/salonai" },
    { label: "Prekiniai ženklai", hint: "Profesionali kosmetika", to: "/prekiniai-zenklai" },
    { label: "Tapk grožio srities specialistu", hint: "Mokyklų ir kursų sąrašas", to: "/mokyklos" },
  ],
  advertiser: [
    { label: "Specialūs pasiūlymai", hint: "Akcijos ir nuolaidos", to: "/feed/akcijos" },
    { label: "Ieškomi modeliai", hint: "Procedūros modeliams", to: "/ieskomi-modeliai" },
    { label: "Aktualijos / Straipsniai", hint: "Naujienos ir tendencijos", to: "/", hash: "aktualijos" },
    { label: "Individualūs meistrai", hint: "Visi meistrų profiliai", to: "/meistrai" },
    { label: "Salonai", hint: "Visi salonų profiliai", to: "/salonai" },
    { label: "Prekiniai ženklai", hint: "Profesionali kosmetika", to: "/prekiniai-zenklai" },
    { label: "Tapk grožio srities specialistu", hint: "Mokyklų ir kursų sąrašas", to: "/mokyklos" },
  ],
  salon: [
    { label: "Specialūs mėnesio pasiūlymai profesionalams", hint: "Pasiūlymai grožio profesionalams", to: "/feed/akcijos" },
    { label: "Tiekėjai / vadyba", hint: "Tiekėjai ir verslo valdymas", to: "/dashboard/b2b" },
    { label: "Mokymai / seminarai", hint: "Profesinis tobulėjimas", to: "/mokyklos" },
    { label: "Skelbimai", hint: "Grožio industrijos skelbimai", to: "/skelbimai" },
  ],
  supplier: [
    { label: "Specialūs mėnesio pasiūlymai profesionalams", hint: "Pasiūlymai grožio profesionalams", to: "/feed/akcijos" },
    { label: "Tiekėjai / vadyba", hint: "Tiekėjai ir verslo valdymas", to: "/dashboard/b2b" },
    { label: "Mokymai / seminarai", hint: "Profesinis tobulėjimas", to: "/mokyklos" },
    { label: "Skelbimai", hint: "Grožio industrijos skelbimai", to: "/skelbimai" },
  ],
  school: [
    { label: "Specialūs mėnesio pasiūlymai profesionalams", hint: "Pasiūlymai grožio profesionalams", to: "/feed/akcijos" },
    { label: "Tiekėjai / vadyba", hint: "Tiekėjai ir verslo valdymas", to: "/dashboard/b2b" },
    { label: "Mokymai / seminarai", hint: "Profesinis tobulėjimas", to: "/mokyklos" },
    { label: "Skelbimai", hint: "Grožio industrijos skelbimai", to: "/skelbimai" },
  ],
};

/** Burbuliukai pagal rolę – meistrai naudoja salono sąrašą. */
export function tilesForRole(role?: string | null): BubbleTile[] {
  if (!role) return ROLE_TILES.guest;
  if (role === "staff") return ROLE_TILES.salon;
  if (role === "admin" || role === "super_admin") return ROLE_TILES.salon;
  return ROLE_TILES[role] ?? ROLE_TILES.guest;
}

export const SUPER_EXTRA: NavItem[] = [
  { to: "/super-admin/backups", label: "Atsarginės kopijos", icon: DatabaseBackup },
  { to: "/super-admin/broadcast", label: "Transliacijos", icon: Megaphone },
  { to: "/admin/site-editor", label: "Svetainės redaktorius", icon: Palette },
];

export const OWNER_EXTRA: NavItem[] = [
  { to: "/super-admin/grants", label: "Dovanojimai", icon: Gift },
  { to: "/super-admin/finance", label: "Finansai", icon: CreditCard },
];

/** Sudeda rolės skiltis + bendras skiltis, be dublikatų. */
export function buildNavItems(opts: {
  role: AppRole | null;
  isSuper?: boolean;
  isPrimaryOwner?: boolean;
  signedIn?: boolean;
}): NavItem[] {
  const { role, isSuper, isPrimaryOwner, signedIn = true } = opts;
  const base: NavItem[] = role && NAV[role] ? [...NAV[role]] : CLIENT_FALLBACK;
  const items: NavItem[] = [...base];
  if (isSuper) {
    if (role !== "super_admin") items.unshift({ to: "/super-admin", label: "Super Admin", icon: Crown });
    items.unshift(...SUPER_EXTRA);
  }
  if (isPrimaryOwner) items.unshift(...OWNER_EXTRA);
  let common = signedIn ? COMMON : COMMON.filter((c) => c.group === G_INFO);
  // Skelbikui rodome tik būtiniausias bendras skiltis.
  if (role === "advertiser") {
    const allow = ["/duk", "/privatumas", "/profile"];
    common = common.filter((c) => allow.includes(c.to));
  }
  for (const c of common) if (!items.some((i) => i.to === c.to)) items.push(c);
  return items;
}

export function navSections(items: Array<NavItem & { locked?: boolean }>) {
  const groups = GROUP_ORDER.map((g) => ({ title: g, list: items.filter((n) => n.group === g) }))
    .filter((g) => g.list.length > 0);
  const ungrouped = items.filter((n) => !n.group);
  return ungrouped.length > 0 ? [{ title: "", list: ungrouped }, ...groups] : groups;
}

export function isActivePath(pathname: string, to: string) {
  return pathname === to || (to !== "/admin" && to !== "/" && pathname.startsWith(to));
}
