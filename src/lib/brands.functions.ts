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

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "brand";
}

export const listBrands = createServerFn({ method: "GET" })
  .handler(async () => {
    const s = publicClient();
    const { data, error } = await s.from("global_brands")
      .select("id, name, slug, logo_url, is_verified")
      .order("is_verified", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return { brands: data ?? [] };
  });

export const suggestBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ name: z.string().min(2).max(80) }).parse(d))
  .handler(async ({ data, context }) => {
    const name = data.name.trim();
    // Reuse existing by case-insensitive name if present
    const { data: existing } = await context.supabase
      .from("global_brands")
      .select("id, name, slug, is_verified")
      .ilike("name", name)
      .maybeSingle();
    if (existing) return { brand: existing, existed: true };

    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: row, error } = await context.supabase.from("global_brands").insert({
      name, slug, is_verified: false, suggested_by: context.userId,
    }).select("id, name, slug, is_verified").maybeSingle();
    if (error) throw new Error(error.message);
    return { brand: row, existed: false };
  });

export const adminVerifyBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), is_verified: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Reikia administratoriaus teisių");
    const { error } = await context.supabase.from("global_brands").update({ is_verified: data.is_verified }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
