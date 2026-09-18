/**
 * Universalus elementų adresavimas svetainės redaktoriui.
 *
 * Kiekvienas ekrane esantis DOM elementas gauna stabilų raktą pagal savo vietą
 * dokumente ir maršrutą. Taip super administratorius gali redaguoti bet kurį
 * tekstą ar bloką nereikalaujant, kad komponentas būtų iš anksto paruoštas.
 */

/** Redaktoriaus paties sąsaja – jos niekada neredaguojame. */
export const CMS_UI_ATTR = "data-cms-ui";

function isEditorUi(el: Element | null): boolean {
  return !!el?.closest(`[${CMS_UI_ATTR}]`);
}

/** Maršruto dalis rakte – kad tas pats blokas skirtinguose puslapiuose skirtųsi. */
export function routeKey(): string {
  if (typeof window === "undefined") return "/";
  const h = window.location.hash;
  const path = h.startsWith("#/") ? h.slice(1) : window.location.pathname;
  return path.replace(/\/+$/, "") || "/";
}

function nthOfType(el: Element): number {
  let n = 1;
  let sib = el.previousElementSibling;
  while (sib) {
    if (sib.tagName === el.tagName) n += 1;
    sib = sib.previousElementSibling;
  }
  return n;
}

/** DOM kelias nuo <body> – pvz. `div1>main1>section2>h1`. */
export function domPath(el: Element): string | null {
  if (typeof document === "undefined") return null;
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur !== document.body) {
    parts.unshift(`${cur.tagName.toLowerCase()}${nthOfType(cur)}`);
    cur = cur.parentElement;
    if (parts.length > 24) return null;
  }
  if (!cur) return null;
  return parts.join(">");
}

/** Pilnas elemento raktas, saugomas duomenų bazėje. */
export function elementKeyFor(el: Element): string | null {
  const p = domPath(el);
  if (!p) return null;
  return `dom:${routeKey()}:${p}`;
}

/** Randa elementą pagal išsaugotą kelią. */
export function elementFromKey(key: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const parts = key.split(":");
  if (parts[0] !== "dom" || parts.length < 3) return null;
  const path = parts.slice(2).join(":");
  let cur: Element | null = document.body;
  for (const seg of path.split(">")) {
    const m = /^([a-z0-9-]+)(\d+)$/.exec(seg);
    if (!m || !cur) return null;
    const tag = m[1];
    const idx = Number(m[2]);
    const kids: Element[] = Array.from(cur.children);
    const matches: Element[] = kids.filter((c) => c.tagName.toLowerCase() === tag);
    cur = matches[idx - 1] ?? null;
  }
  return (cur as HTMLElement | null) ?? null;
}

/** Ar šio maršruto raktas. */
export function keyBelongsToRoute(key: string, route = routeKey()): boolean {
  return key.startsWith(`dom:${route}:`);
}

/** Tinkamas redagavimui elementas iš paspaudimo. */
export function pickTarget(target: EventTarget | null): HTMLElement | null {
  const el = target as HTMLElement | null;
  if (!el || !(el instanceof HTMLElement)) return null;
  if (isEditorUi(el)) return null;
  if (el.tagName === "HTML" || el.tagName === "BODY") return null;
  return el;
}

/** Ar elemente yra tik tekstas (galima redaguoti turinį). */
export function isPlainTextElement(el: HTMLElement): boolean {
  const nodes = Array.from(el.childNodes);
  return nodes.length > 0 && nodes.every((n) => n.nodeType === Node.TEXT_NODE);
}

/** Trumpas lietuviškas elemento pavadinimas inspektoriui. */
export function describeElement(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const map: Record<string, string> = {
    h1: "Antraštė (H1)", h2: "Antraštė (H2)", h3: "Antraštė (H3)", h4: "Antraštė (H4)",
    p: "Tekstas", span: "Tekstas", a: "Nuoroda", button: "Mygtukas",
    img: "Nuotrauka", section: "Sekcija", div: "Blokas", ul: "Sąrašas", li: "Sąrašo elementas",
  };
  const base = map[tag] ?? tag;
  const txt = (el.textContent ?? "").trim().slice(0, 28);
  return txt ? `${base} — „${txt}“` : base;
}
