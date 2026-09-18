// Server-only e-shop scraping helpers (Shopify / WooCommerce / generic HTML).

export type ScrapedProduct = {
  externalId?: string;
  title: string;
  description: string;
  html?: string;
  price?: number;
  images: string[];
  brand?: string;
  category?: string;
  stock?: number;
  volume?: string;
  inci?: string;
  url?: string;
};

export type ScrapeResult = {
  platform: "shopify" | "woocommerce" | "html";
  domain: string;
  count: number;
  items: ScrapedProduct[];
};

const UA = "PaslaugosGrožiui-ShopBot/1.0 (+https://paslaugosgroziui.lt)";

async function get(url: string, accept = "text/html,application/json;q=0.9") {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept } });
  return res;
}

function origin(url: string) {
  const u = new URL(url);
  return `${u.protocol}//${u.host}`;
}

function stripHtml(s?: string | null) {
  if (!s) return "";
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = Number(String(v).replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : undefined;
}

const VOLUME_RE = /(\d+[.,]?\d*)\s?(ml|l\b|g\b|gr\b|kg|oz)/i;
function findVolume(...texts: (string | undefined)[]) {
  for (const t of texts) {
    const m = t?.match(VOLUME_RE);
    if (m) return `${m[1].replace(",", ".")}${m[2].toLowerCase()}`;
  }
  return undefined;
}

const INCI_RE = /(?:INCI|Ingredients|Sudėtis|Ingredientai|Состав)\s*[:\-–]?\s*([A-Za-zĄ-Žą-ž0-9 ,.\-()/*+%]{40,1200})/i;
function findInci(...texts: (string | undefined)[]) {
  for (const t of texts) {
    const m = t?.match(INCI_RE);
    if (m) return m[1].trim().slice(0, 1500);
  }
  return undefined;
}

/* ---------------- Shopify ---------------- */
async function tryShopify(url: string, limit: number): Promise<ScrapeResult | null> {
  const base = origin(url);
  const items: ScrapedProduct[] = [];
  for (let page = 1; page <= 10 && items.length < limit; page++) {
    const res = await get(`${base}/products.json?limit=250&page=${page}`, "application/json");
    if (!res.ok) return page === 1 ? null : { platform: "shopify", domain: new URL(base).host, count: items.length, items };
    let json: any;
    try { json = await res.json(); } catch { return null; }
    const list = json?.products;
    if (!Array.isArray(list)) return null;
    if (list.length === 0) break;
    for (const p of list) {
      const v = p.variants?.[0] ?? {};
      const body = String(p.body_html ?? "");
      const plain = stripHtml(body);
      items.push({
        externalId: `shopify:${p.id}`,
        title: String(p.title ?? "").slice(0, 200),
        description: plain.slice(0, 4000),
        html: body.slice(0, 8000),
        price: num(v.price),
        images: (p.images ?? []).map((i: any) => i.src).filter(Boolean).slice(0, 8),
        brand: p.vendor || undefined,
        category: p.product_type || undefined,
        stock: v.inventory_quantity && v.inventory_quantity > 0 ? v.inventory_quantity : (v.available === false ? 0 : 10),
        volume: findVolume(String(v.title ?? ""), p.title, plain),
        inci: findInci(plain),
        url: `${base}/products/${p.handle}`,
      });
      if (items.length >= limit) break;
    }
    if (list.length < 250) break;
  }
  if (!items.length) return null;
  return { platform: "shopify", domain: new URL(base).host, count: items.length, items };
}

/* ---------------- WooCommerce Store API ---------------- */
async function tryWoo(url: string, limit: number): Promise<ScrapeResult | null> {
  const base = origin(url);
  const items: ScrapedProduct[] = [];
  for (let page = 1; page <= 20 && items.length < limit; page++) {
    const res = await get(`${base}/wp-json/wc/store/v1/products?per_page=100&page=${page}`, "application/json");
    if (!res.ok) return page === 1 ? null : { platform: "woocommerce", domain: new URL(base).host, count: items.length, items };
    let list: any;
    try { list = await res.json(); } catch { return null; }
    if (!Array.isArray(list)) return null;
    if (!list.length) break;
    for (const p of list) {
      const html = String(p.description ?? p.short_description ?? "");
      const plain = stripHtml(html);
      const price = num(p.prices?.price != null ? Number(p.prices.price) / Math.pow(10, Number(p.prices?.currency_minor_unit ?? 2)) : undefined);
      items.push({
        externalId: `woo:${p.id}`,
        title: stripHtml(p.name).slice(0, 200),
        description: plain.slice(0, 4000),
        html: html.slice(0, 8000),
        price,
        images: (p.images ?? []).map((i: any) => i.src).filter(Boolean).slice(0, 8),
        brand: p.brands?.[0]?.name || undefined,
        category: p.categories?.[0]?.name || undefined,
        stock: p.is_in_stock === false ? 0 : (p.stock_quantity ?? 10),
        volume: findVolume(p.name, plain),
        inci: findInci(plain),
        url: p.permalink,
      });
      if (items.length >= limit) break;
    }
    if (list.length < 100) break;
  }
  if (!items.length) return null;
  return { platform: "woocommerce", domain: new URL(base).host, count: items.length, items };
}

/* ---------------- Generic HTML: JSON-LD + OpenGraph ---------------- */
function jsonLdBlocks(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try { out.push(JSON.parse(m[1].trim())); } catch { /* ignore malformed */ }
  }
  return out;
}

function flattenLd(node: any, acc: any[] = []): any[] {
  if (!node) return acc;
  if (Array.isArray(node)) { node.forEach((n) => flattenLd(n, acc)); return acc; }
  if (typeof node === "object") {
    acc.push(node);
    if (node["@graph"]) flattenLd(node["@graph"], acc);
    if (node.itemListElement) flattenLd(node.itemListElement, acc);
    if (node.item) flattenLd(node.item, acc);
  }
  return acc;
}

function meta(html: string, prop: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i");
  const m = html.match(re) ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, "i"));
  return m ? stripHtml(m[1]) : undefined;
}

function ldToProduct(o: any, pageUrl: string): ScrapedProduct | null {
  const type = ([] as string[]).concat(o["@type"] ?? []).map(String);
  if (!type.some((t) => /product/i.test(t))) return null;
  const offers = Array.isArray(o.offers) ? o.offers[0] : o.offers;
  const plain = stripHtml(o.description);
  const images = ([] as any[]).concat(o.image ?? []).map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean).slice(0, 8);
  const title = stripHtml(o.name);
  if (!title) return null;
  return {
    externalId: o.sku ? `ld:${o.sku}` : undefined,
    title: title.slice(0, 200),
    description: plain.slice(0, 4000),
    html: typeof o.description === "string" ? o.description.slice(0, 8000) : undefined,
    price: num(offers?.price ?? offers?.lowPrice ?? o.price),
    images,
    brand: typeof o.brand === "string" ? o.brand : o.brand?.name,
    category: typeof o.category === "string" ? o.category : undefined,
    stock: offers?.availability && /OutOfStock/i.test(String(offers.availability)) ? 0 : 10,
    volume: findVolume(title, plain, o.size),
    inci: findInci(plain),
    url: o.url ?? offers?.url ?? pageUrl,
  };
}

function productLinks(html: string, base: string): string[] {
  const out = new Set<string>();
  const re = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    if (!/(\/product\/|\/produktas\/|\/produktai\/|\/prekes\/|\/products\/|\/shop\/|p=\d+)/i.test(href)) continue;
    if (/\.(jpg|png|webp|css|js|svg)(\?|$)/i.test(href)) continue;
    try {
      const abs = new URL(href, base).toString();
      if (new URL(abs).host !== new URL(base).host) continue;
      out.add(abs.split("#")[0]);
    } catch { /* ignore */ }
  }
  return [...out].slice(0, 60);
}

async function tryHtml(url: string, limit: number): Promise<ScrapeResult> {
  const res = await get(url);
  if (!res.ok) throw new Error(`Nepavyko atidaryti svetainės (HTTP ${res.status})`);
  const html = await res.text();
  const host = new URL(url).host;
  const items: ScrapedProduct[] = [];
  const seen = new Set<string>();

  const collect = (p: ScrapedProduct | null) => {
    if (!p || !p.title) return;
    const key = p.title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push(p);
  };

  for (const block of jsonLdBlocks(html)) {
    for (const node of flattenLd(block)) collect(ldToProduct(node, url));
  }

  // Follow product links from the listing page when the listing itself had no product data.
  if (items.length < limit) {
    const links = productLinks(html, url).slice(0, Math.max(0, limit - items.length));
    const pages = await Promise.all(
      links.map(async (l) => {
        try {
          const r = await get(l);
          if (!r.ok) return null;
          return { l, body: await r.text() };
        } catch { return null; }
      }),
    );
    for (const page of pages) {
      if (!page) continue;
      let found = false;
      for (const block of jsonLdBlocks(page.body)) {
        for (const node of flattenLd(block)) {
          const p = ldToProduct(node, page.l);
          if (p) { collect(p); found = true; }
        }
      }
      if (found) continue;
      const title = meta(page.body, "og:title") ?? stripHtml(page.body.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
      if (!title) continue;
      const desc = meta(page.body, "og:description") ?? meta(page.body, "description") ?? "";
      const plain = stripHtml(page.body).slice(0, 6000);
      const price = num(meta(page.body, "product:price:amount") ?? plain.match(/(\d+[.,]\d{2})\s?(?:€|EUR)/)?.[1]);
      collect({
        title: title.slice(0, 200),
        description: desc.slice(0, 4000),
        price,
        images: [meta(page.body, "og:image")].filter(Boolean) as string[],
        brand: meta(page.body, "og:site_name"),
        stock: 10,
        volume: findVolume(title, desc, plain),
        inci: findInci(plain),
        url: page.l,
      });
    }
  }

  return { platform: "html", domain: host, count: items.length, items: items.slice(0, limit) };
}

export async function scrapeShop(url: string, limit: number): Promise<ScrapeResult> {
  const shopify = await tryShopify(url, limit).catch(() => null);
  if (shopify) return shopify;
  const woo = await tryWoo(url, limit).catch(() => null);
  if (woo) return woo;
  return tryHtml(url, limit);
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "preke"
  );
}
