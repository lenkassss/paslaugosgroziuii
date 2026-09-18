import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ScrapedPreviewItem } from "@/lib/shop-scraper-types";

const urlSchema = z.object({
  url: z.string().url(),
  limit: z.number().int().min(1).max(500).default(120),
});

export const scrapeShopUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => urlSchema.parse(d))
  .handler(async ({ data }) => {
    const { scrapeShop } = await import("@/lib/shop-scraper.server");
    const r = await scrapeShop(data.url, data.limit);
    return {
      platform: r.platform,
      domain: r.domain,
      count: r.count,
      items: r.items as ScrapedPreviewItem[],
    };
  });

export const importScrapedProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        b2cMarkupPct: z.number().min(0).max(300).default(30),
        defaultBrand: z.string().max(120).optional(),
        items: z
          .array(
            z.object({
              title: z.string().min(1).max(200),
              description: z.string().max(8000).optional(),
              html: z.string().max(12000).optional(),
              price: z.number().min(0).optional(),
              images: z.array(z.string().url()).max(8).default([]),
              brand: z.string().max(120).optional(),
              category: z.string().max(120).optional(),
              stock: z.number().int().min(0).max(100000).optional(),
              volume: z.string().max(60).optional(),
              inci: z.string().max(2000).optional(),
            }),
          )
          .min(1)
          .max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: isSupplier }, { data: isAdmin }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "supplier" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    if (!isSupplier && !isAdmin) throw new Error("Reikia tiekėjo paskyros");

    const { slugify } = await import("@/lib/shop-scraper.server");

    const { count: existing } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("supplier_id", userId);
    const remaining = Math.max(0, 10000 - (existing ?? 0));
    const toImport = data.items.slice(0, remaining);

    const markup = 1 + data.b2cMarkupPct / 100;
    const rows = toImport
      .filter((i) => i.title)
      .map((i) => {
        const wholesale = Math.round((i.price ?? 0) * 100) / 100;
        const retail = Math.round(wholesale * markup * 100) / 100;
        return {
          supplier_id: userId,
          title: i.title,
          slug: `${slugify(i.title)}-${Math.random().toString(36).slice(2, 8)}`,
          description: i.html || i.description || "",
          price: wholesale,
          price_wholesale: wholesale,
          price_retail: retail,
          currency: "EUR",
          images: i.images ?? [],
          category: i.category ?? null,
          brand: i.brand || data.defaultBrand || null,
          stock: i.stock ?? 10,
          volume: i.volume ?? null,
          inci: i.inci ?? null,
          discount_percent: 0,
          is_active: true,
        };
      });

    let inserted = 0;
    let skipped = 0;
    let firstError: string | null = null;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error, count } = await supabase.from("products").insert(chunk, { count: "exact" });
      if (error) {
        skipped += chunk.length;
        firstError ??= error.message;
      } else {
        inserted += count ?? chunk.length;
      }
    }

    if (inserted === 0 && firstError) throw new Error(`Nepavyko įkelti prekių: ${firstError}`);

    return {
      ok: true,
      imported: inserted,
      skipped: skipped + (data.items.length - toImport.length),
      remaining: Math.max(0, remaining - inserted),
    };
  });
