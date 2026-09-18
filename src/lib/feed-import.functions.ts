import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Basic entity decoder for XML/HTML entities.
function decodeEntities(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function slugify(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "prekes";
}

// Pull a tag's inner text (any namespace prefix), first occurrence.
function pickTag(block: string, ...names: string[]): string | undefined {
  for (const name of names) {
    const re = new RegExp(`<(?:[a-zA-Z0-9]+:)?${name}[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9]+:)?${name}>`, "i");
    const m = block.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return undefined;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let cell = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') inQ = false;
      else cell += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === "," || c === ";") { cur.push(cell); cell = ""; }
      else if (c === "\n") { cur.push(cell); rows.push(cur); cur = []; cell = ""; }
      else if (c === "\r") { /* skip */ }
      else cell += c;
    }
  }
  if (cell.length || cur.length) { cur.push(cell); rows.push(cur); }
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((v) => v?.trim())).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => { o[h] = (r[i] ?? "").trim(); });
    return o;
  });
}

type ParsedItem = {
  title: string;
  description?: string;
  price?: number;
  brand?: string;
  category?: string;
  image?: string;
  stock?: number;
};

function parseXml(text: string): ParsedItem[] {
  // Match <item>…</item> or <product>…</product> or <entry>…</entry>
  const items: ParsedItem[] = [];
  const re = /<(?:[a-zA-Z0-9]+:)?(item|product|entry|offer)[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const block = m[2];
    const title = pickTag(block, "title", "name", "n");
    if (!title) continue;
    const priceRaw = pickTag(block, "price", "g:price", "sale_price", "regularPrice", "regular_price");
    const price = priceRaw ? Number(priceRaw.replace(/[^\d.,]/g, "").replace(",", ".")) : undefined;
    items.push({
      title: title.slice(0, 200),
      description: pickTag(block, "description", "summary", "content"),
      price: Number.isFinite(price!) ? price : undefined,
      brand: pickTag(block, "brand", "g:brand", "manufacturer"),
      category: pickTag(block, "category", "product_type", "g:product_type"),
      image: pickTag(block, "image_link", "g:image_link", "image", "picture"),
      stock: (() => {
        const s = pickTag(block, "availability", "g:availability", "stock", "quantity", "qty");
        if (!s) return undefined;
        const n = Number(s.replace(/[^\d]/g, ""));
        if (Number.isFinite(n) && n > 0) return n;
        if (/in.?stock|available/i.test(s)) return 10;
        return undefined;
      })(),
    });
  }
  return items;
}

export const previewSupplierFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ url: z.string().url() }).parse(d))
  .handler(async ({ data }) => {
    const res = await fetch(data.url, { headers: { "User-Agent": "PaslaugosGrožiui-FeedBot/1.0" } });
    if (!res.ok) throw new Error(`Neįmanoma parsisiųsti feed'o (HTTP ${res.status})`);
    const text = await res.text();
    const isCsv = /^[^<]*,/.test(text.trim().split("\n")[0] ?? "");
    const items = isCsv ? parseCsv(text).map((r) => ({
      title: r.title || r.name || r["produkto pavadinimas"] || "",
      description: r.description || r.summary,
      price: Number((r.price || r.kaina || "0").replace(",", ".")) || undefined,
      brand: r.brand || r["prekės ženklas"],
      category: r.category || r.kategorija,
      image: r.image || r.image_link || r["nuoroda i nuotrauka"],
      stock: Number(r.stock || r.quantity || r.qty || 0) || undefined,
    })).filter((i) => i.title) : parseXml(text);

    return { format: isCsv ? "csv" : "xml", count: items.length, sample: items.slice(0, 5) };
  });

export const importSupplierFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    url: z.string().url(),
    b2cMarkupPct: z.number().min(0).max(300).default(30),
    limit: z.number().int().min(1).max(10000).default(10000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSupplier } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "supplier" });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isSupplier && !isAdmin) throw new Error("Reikia tiekėjo paskyros");

    const res = await fetch(data.url, { headers: { "User-Agent": "PaslaugosGrožiui-FeedBot/1.0" } });
    if (!res.ok) throw new Error(`Neįmanoma parsisiųsti feed'o (HTTP ${res.status})`);
    const text = await res.text();
    const isCsv = /^[^<]*,/.test(text.trim().split("\n")[0] ?? "");
    const rawItems: ParsedItem[] = isCsv ? parseCsv(text).map((r) => ({
      title: r.title || r.name || r["produkto pavadinimas"] || "",
      description: r.description || r.summary,
      price: Number((r.price || r.kaina || "0").replace(",", ".")) || undefined,
      brand: r.brand || r["prekės ženklas"],
      category: r.category || r.kategorija,
      image: r.image || r.image_link || r["nuoroda i nuotrauka"],
      stock: Number(r.stock || r.quantity || r.qty || 0) || undefined,
    })).filter((i) => i.title) : parseXml(text);

    const items = rawItems.slice(0, data.limit);

    // Existing count for the 10k cap.
    const { count: existing } = await context.supabase.from("products")
      .select("id", { count: "exact", head: true }).eq("supplier_id", context.userId);
    const remaining = Math.max(0, 10000 - (existing ?? 0));
    const toImport = items.slice(0, remaining);

    let inserted = 0, skipped = 0;
    const markup = 1 + data.b2cMarkupPct / 100;
    const rows = toImport.map((it) => {
      const wholesale = Number(it.price ?? 0);
      if (!it.title || wholesale <= 0) return null;
      const retail = Math.round(wholesale * markup * 100) / 100;
      return {
        supplier_id: context.userId,
        title: it.title,
        slug: `${slugify(it.title)}-${Math.random().toString(36).slice(2, 8)}`,
        description: it.description ?? "",
        price: wholesale,
        price_wholesale: wholesale,
        price_retail: retail,
        currency: "EUR",
        images: it.image ? [it.image] : [],
        category: it.category ?? null,
        brand: it.brand ?? null,
        stock: it.stock ?? 10,
        discount_percent: 0,
        is_active: true,
      };
    }).filter(Boolean) as any[];

    // Bulk insert in chunks
    let firstError: string | null = null;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error, count } = await context.supabase.from("products").insert(chunk, { count: "exact" });
      if (error) { skipped += chunk.length; firstError ??= error.message; }
      else inserted += (count ?? chunk.length);
    }

    if (inserted === 0 && firstError) {
      throw new Error(`Nepavyko įkelti prekių: ${firstError}. Patikrink, ar tavo paskyra turi tiekėjo rolę.`);
    }

    return {
      ok: true,
      totalParsed: rawItems.length,
      imported: inserted,
      skipped: skipped + (items.length - toImport.length),
      error: firstError,
      cap: remaining < items.length ? { remaining, cap: 10000 } : undefined,
    };
  });

