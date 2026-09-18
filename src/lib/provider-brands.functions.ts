import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export type ProviderBrand = { id: string; name: string; slug: string; logo_url: string | null; is_verified: boolean };

/** Brands used by one provider (salon / master / supplier). Public. */
export const listProviderBrands = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { data: rows, error } = await s
      .from("provider_brands")
      .select("brand_id, global_brands(id, name, slug, logo_url, is_verified)")
      .eq("profile_id", data.profileId);
    if (error) throw new Error(error.message);
    const brands = (rows ?? [])
      .map((r) => r.global_brands as unknown as ProviderBrand | null)
      .filter((b): b is ProviderBrand => !!b)
      .sort((a, b) => a.name.localeCompare(b.name, "lt"));
    return { brands };
  });

/** Brands that at least one provider declared — used as a search filter list. Public. */
export const listBrandsInUse = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data: rows } = await s
    .from("provider_brands")
    .select("brand_id, global_brands(id, name, slug, logo_url, is_verified)")
    .limit(5000);
  const map = new Map<string, ProviderBrand>();
  for (const r of rows ?? []) {
    const b = r.global_brands as unknown as ProviderBrand | null;
    if (b) map.set(b.id, b);
  }
  return { brands: Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "lt")) };
});

/** My own declared brands. */
export const getMyBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("provider_brands")
      .select("brand_id, global_brands(id, name, slug, logo_url, is_verified)")
      .eq("profile_id", context.userId);
    if (error) throw new Error(error.message);
    const brands = (rows ?? [])
      .map((r) => r.global_brands as unknown as ProviderBrand | null)
      .filter((b): b is ProviderBrand => !!b)
      .sort((a, b) => a.name.localeCompare(b.name, "lt"));
    return { brands };
  });

/** Replace my declared brand list. */
export const setMyBrands = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ brandIds: z.array(z.string().uuid()).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: current } = await context.supabase
      .from("provider_brands")
      .select("id, brand_id")
      .eq("profile_id", context.userId);
    const currentIds = new Set((current ?? []).map((r) => r.brand_id));
    const next = new Set(data.brandIds);

    const toRemove = (current ?? []).filter((r) => !next.has(r.brand_id)).map((r) => r.id);
    const toAdd = data.brandIds.filter((id) => !currentIds.has(id));

    if (toRemove.length) {
      const { error } = await context.supabase.from("provider_brands").delete().in("id", toRemove);
      if (error) throw new Error(error.message);
    }
    if (toAdd.length) {
      const { error } = await context.supabase
        .from("provider_brands")
        .insert(toAdd.map((brand_id) => ({ profile_id: context.userId, brand_id })));
      if (error) throw new Error(error.message);
    }
    return { ok: true, count: data.brandIds.length };
  });

export type BrandCatalogItem = ProviderBrand & {
  /** Kiek meistrų / salonų dirba su šiuo ženklu (pagal filtrą). */
  provider_count: number;
  /** Paslaugų sritys, kuriose ženklas naudojamas. */
  categories: string[];
  /** Miestai, kuriuose ženklas naudojamas. */
  cities: string[];
};

/**
 * Viešas prekinių ženklų katalogas su trimis paieškos būdais:
 * pagal pavadinimą (`q`), pagal paslaugų sritį (`category`) ir pagal konkretų ženklą (`brandId`).
 */
export const searchBrandCatalog = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({
    q: z.string().max(80).optional(),
    category: z.string().max(80).optional(),
    brandId: z.string().uuid().optional(),
    city: z.string().max(80).optional(),
  }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const s = publicClient();
    let query = s
      .from("provider_brands")
      .select("brand_id, profile_id, global_brands(id, name, slug, logo_url, is_verified), profiles(id, category, city)")
      .limit(8000);
    if (data.brandId) query = query.eq("brand_id", data.brandId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const needle = (data.q ?? "").trim().toLowerCase();
    const map = new Map<string, BrandCatalogItem>();
    for (const row of rows ?? []) {
      const brand = row.global_brands as unknown as ProviderBrand | null;
      const profile = row.profiles as unknown as { category: string | null; city: string | null } | null;
      if (!brand) continue;
      if (needle && !brand.name.toLowerCase().includes(needle)) continue;
      if (data.category && (profile?.category ?? "") !== data.category) continue;
      if (data.city && !(profile?.city ?? "").toLowerCase().includes(data.city.toLowerCase())) continue;
      const current = map.get(brand.id) ?? { ...brand, provider_count: 0, categories: [], cities: [] };
      current.provider_count += 1;
      if (profile?.category && !current.categories.includes(profile.category)) current.categories.push(profile.category);
      if (profile?.city && !current.cities.includes(profile.city)) current.cities.push(profile.city);
      map.set(brand.id, current);
    }
    const brands = Array.from(map.values()).sort(
      (a, b) => b.provider_count - a.provider_count || a.name.localeCompare(b.name, "lt"),
    );
    return { brands };
  });
