import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SupplierHit = {
  id: string;
  business_name: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  verification_status: string;
  product_count: number;
  brands: string[];
  matches: { id: string; title: string; brand: string | null; category: string | null }[];
};

/**
 * Tiekėjų katalogas: paieška pagal produkciją (pvz. „guminės pirštinės“) ir brandą.
 * Prieiga tik verslo rolėms – klientai ir neregistruoti negauna nieko.
 */
export const searchSuppliers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        q: z.string().trim().max(80).nullable().optional(),
        brand: z.string().trim().max(80).nullable().optional(),
        category: z.string().trim().max(80).nullable().optional(),
        city: z.string().trim().max(60).nullable().optional(),
        limit: z.number().int().min(1).max(60).default(30),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: business } = await context.supabase.rpc("is_business_user", { _user_id: context.userId });
    if (!business) throw new Error("Tiekėjų katalogas prieinamas tik verslo paskyroms.");

    let pq = context.supabase
      .from("products")
      .select("id, supplier_id, title, brand, category")
      .eq("is_active", true)
      .limit(1200);

    const term = data.q?.replace(/[%_]/g, "").trim();
    if (term) pq = pq.or(`title.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%`);
    if (data.brand) pq = pq.ilike("brand", `%${data.brand.replace(/[%_]/g, "")}%`);
    if (data.category) pq = pq.eq("category", data.category);

    const { data: products, error } = await pq;
    if (error) throw new Error(error.message);

    const bySupplier = new Map<string, SupplierHit["matches"]>();
    const brandsBySupplier = new Map<string, Set<string>>();
    for (const p of products ?? []) {
      const list = bySupplier.get(p.supplier_id) ?? [];
      if (list.length < 6) list.push({ id: p.id, title: p.title, brand: p.brand ?? null, category: p.category ?? null });
      bySupplier.set(p.supplier_id, list);
      if (p.brand) {
        const set = brandsBySupplier.get(p.supplier_id) ?? new Set<string>();
        set.add(p.brand);
        brandsBySupplier.set(p.supplier_id, set);
      }
    }

    const ids = Array.from(bySupplier.keys());
    if (ids.length === 0) return { items: [] as SupplierHit[] };

    let prof = context.supabase
      .from("profiles")
      .select("id, business_name, city, phone, email, avatar_url, bio, verification_status")
      .in("id", ids.slice(0, 200));
    if (data.city) prof = prof.eq("city", data.city);

    const { data: profiles, error: pErr } = await prof;
    if (pErr) throw new Error(pErr.message);

    const items: SupplierHit[] = (profiles ?? []).map((p) => ({
      id: p.id,
      business_name: p.business_name,
      city: p.city,
      phone: p.phone,
      email: p.email,
      avatar_url: p.avatar_url,
      bio: p.bio,
      verification_status: String(p.verification_status),
      product_count: bySupplier.get(p.id)?.length ?? 0,
      brands: Array.from(brandsBySupplier.get(p.id) ?? []).slice(0, 8),
      matches: bySupplier.get(p.id) ?? [],
    }));

    items.sort((a, b) => b.product_count - a.product_count);
    return { items: items.slice(0, data.limit) };
  });

/** Filtrų reikšmės (brandai ir kategorijos) – taip pat tik verslui. */
export const listSupplierFacets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("brand, category")
      .eq("is_active", true)
      .limit(2000);
    if (error) throw new Error(error.message);
    const brands = new Set<string>();
    const categories = new Set<string>();
    for (const r of data ?? []) {
      if (r.brand) brands.add(r.brand);
      if (r.category) categories.add(r.category);
    }
    return {
      brands: Array.from(brands).sort().slice(0, 120),
      categories: Array.from(categories).sort().slice(0, 60),
    };
  });
