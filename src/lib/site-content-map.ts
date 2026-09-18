/**
 * Redaguojamų puslapių ir sekcijų registras.
 *
 * Kiekviena sekcija turi numatytus tekstus – jie rodomi svetainėje tol,
 * kol super administratorius neįrašo savo teksto. Redaktoriuje numatyti
 * tekstai matomi kaip užuominos (placeholder), todėl niekada neprarandama,
 * kaip puslapis atrodė iš pradžių.
 */

export type EditableField = "title" | "subtitle" | "body_text" | "button_text" | "button_link" | "image_url";

export type SectionDef = {
  id: string;
  label: string;
  hint?: string;
  fields: EditableField[];
  defaults?: Partial<Record<EditableField, string>>;
};

export type PageDef = {
  slug: string;
  label: string;
  path: string;
  sections: SectionDef[];
};

export const CONTENT_PAGES: PageDef[] = [
  {
    slug: "home",
    label: "Pradinis puslapis",
    path: "/",
    sections: [
      {
        id: "hero",
        label: "Pagrindinis blokas",
        hint: "Didžioji antraštė virš paieškos",
        fields: ["title", "subtitle"],
        defaults: { title: "Rezervuok paslaugą — greitai ir patogiai." },
      },
      {
        id: "business_cta",
        label: "Verslo kvietimas",
        hint: "Nuoroda „Verslui“ virš burbuliukų",
        fields: ["title", "body_text", "button_text", "button_link"],
        defaults: { title: "Verslui", button_text: "Sužinoti daugiau", button_link: "/for-business" },
      },
    ],
  },
  {
    slug: "about",
    label: "Apie mus",
    path: "/about",
    sections: [
      {
        id: "intro",
        label: "Įvadas",
        fields: ["title", "subtitle", "body_text"],
        defaults: { title: "Visa grožio industrija vienoje platformoje" },
      },
    ],
  },
  {
    slug: "pricing",
    label: "Narystės ir kainos",
    path: "/pricing",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle", "body_text"], defaults: { title: "Kainos" } }],
  },
  {
    slug: "duk",
    label: "DUK",
    path: "/duk",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "body_text"], defaults: { title: "DUK / FAQ" } }],
  },
  {
    slug: "tiekejai",
    label: "Tiekėjai",
    path: "/tiekejai",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "body_text"], defaults: { title: "Tiekėjų katalogas" } }],
  },
  {
    slug: "for-business",
    label: "Verslui (rolių pasirinkimas)",
    path: "/for-business",
    sections: [
      {
        id: "intro",
        label: "Įvadas",
        fields: ["title", "subtitle", "body_text"],
        defaults: {
          title: "PaslaugosGrožiui – Jūsų partneris grožio verslo augimui",
          subtitle: "Visa grožio industrija vienoje platformoje.",
          body_text:
            "Atraskite patikimus tiekėjus, profesinius mokymus, kabinetų ir įrangos pasiūlymus bei naujas bendradarbiavimo galimybes. Platforma vienija grožio specialistus, salonus, mokyklas ir klientus visoje Lietuvoje.",
        },
      },

    ],
  },
  {
    slug: "mokymai",
    label: "Mokymai",
    path: "/mokyklos",
    sections: [
      {
        id: "intro",
        label: "Įvadas",
        fields: ["title", "subtitle"],
        defaults: {
          title: "Mokymai ir grožio profesija",
          subtitle: "Atraskite trumpus mokymus sau arba pradėkite profesionalų kelią patikimose grožio mokyklose.",
        },
      },
    ],
  },
  {
    slug: "skelbimai",
    label: "Skelbimai",
    path: "/skelbimai",
    sections: [
      {
        id: "intro",
        label: "Įvadas",
        fields: ["title", "subtitle"],
        defaults: {
          title: "Skelbimai — nuoma, pardavimai, darbas",
          subtitle:
            "Patalpų ir įrangos nuoma, pardavimai, verslo perleidimas ir darbo skelbimai — tik grožio industrijos profesionalams.",
        },
      },
    ],
  },
  {
    slug: "contact",
    label: "Kontaktai",
    path: "/contact",
    sections: [
      {
        id: "intro",
        label: "Įvadas",
        fields: ["title", "subtitle"],
        defaults: { title: "Kontaktai", subtitle: "Rašyk, skambink arba užsuk pas mus." },
      },
    ],
  },
  {
    slug: "salonai",
    label: "Salonai",
    path: "/salonai",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle"], defaults: { title: "Grožio salonai" } }],
  },
  {
    slug: "meistrai",
    label: "Individualūs meistrai",
    path: "/meistrai",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle"], defaults: { title: "Individualūs meistrai" } }],
  },
  {
    slug: "ieskomi-modeliai",
    label: "Ieškomi modeliai",
    path: "/ieskomi-modeliai",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle"], defaults: { title: "Ieškomi modeliai" } }],
  },
  {
    slug: "prekiniai-zenklai",
    label: "Prekiniai ženklai",
    path: "/prekiniai-zenklai",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle"], defaults: { title: "Prekiniai ženklai" } }],
  },
  {
    slug: "akcijos",
    label: "Specialūs pasiūlymai",
    path: "/feed/akcijos",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle"], defaults: { title: "Šiuo metu galiojantys pasiūlymai" } }],
  },
  {
    slug: "forumas",
    label: "Forumas",
    path: "/forumas",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle"], defaults: { title: "Bendruomenės diskusijos" } }],
  },
  {
    slug: "darbas",
    label: "Darbo skelbimai",
    path: "/darbas",
    sections: [{ id: "intro", label: "Įvadas", fields: ["title", "subtitle"], defaults: { title: "Darbas grožio industrijoje" } }],
  },
  {
    slug: "footer",
    label: "Poraštė",
    path: "/",
    sections: [{ id: "main", label: "Poraštės tekstas", fields: ["body_text"], defaults: { body_text: "Grožio industrijos ekosistema" } }],
  },
];

/** Laisvų blokų tipai – kaip Elementor elementai. */
export const BLOCK_KINDS: { key: string; label: string; hint: string; fields: EditableField[] }[] = [
  { key: "heading", label: "Antraštė", hint: "Didelis pavadinimas su paantrašte", fields: ["title", "subtitle"] },
  { key: "text", label: "Teksto blokas", hint: "Antraštė + laisvas tekstas", fields: ["title", "body_text"] },
  { key: "image", label: "Nuotrauka", hint: "Paveikslėlis su pavadinimu", fields: ["title", "image_url", "body_text"] },
  { key: "button", label: "Mygtukas", hint: "Kvietimas veikti su nuoroda", fields: ["title", "body_text", "button_text", "button_link"] },
  { key: "divider", label: "Atskyrimo linija", hint: "Tuščias tarpas su linija", fields: [] },
];

export const BLOCK_STYLES: { key: string; label: string }[] = [
  { key: "plain", label: "Be fono" },
  { key: "card", label: "Kortelė" },
  { key: "highlight", label: "Paryškinta" },
  { key: "muted", label: "Pilkas fonas" },
];

export const BLOCK_ALIGNS: { key: string; label: string }[] = [
  { key: "left", label: "Kairėje" },
  { key: "center", label: "Centre" },
  { key: "right", label: "Dešinėje" },
];

export const FIELD_LABELS: Record<EditableField, string> = {
  title: "Antraštė",
  subtitle: "Paantraštė",
  body_text: "Tekstas",
  button_text: "Mygtuko tekstas",
  button_link: "Mygtuko nuoroda",
  image_url: "Nuotrauka",
};

/** Pradinio puslapio (ir poraštės) sekcijų rodymo perjungimai. */
export const SECTION_TOGGLES: { id: string; label: string; hint: string }[] = [
  { id: "bubbles", label: "Naršymo burbuliukai", hint: "Viršutinė burbuliukų juosta" },
  { id: "hero_search", label: "Paieškos blokas", hint: "Miestas → kategorija → paslauga + kalendorius" },
  { id: "business_cta", label: "„Verslui“ kvietimas", hint: "Nuoroda viršuje virš burbuliukų" },
  { id: "hero_article", label: "Pagrindinis straipsnis", hint: "Didelė straipsnio kortelė" },
  { id: "promoted", label: "Reklamuojami straipsniai", hint: "Apmokėti straipsnių paryškinimai" },
  { id: "feed", label: "Naujienų srautas", hint: "Aktualijos, tendencijos, pasiūlymai" },
  { id: "footer_nav", label: "Poraštės nuorodos", hint: "Apie mus, DUK, kontaktai ir kt." },
];
