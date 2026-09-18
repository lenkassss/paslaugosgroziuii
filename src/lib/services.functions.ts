import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

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

export type StandardService = {
  id: string;
  name: string;
  slug: string;
  category: string;
  synonyms: string[] | null;
  sort_order: number;
};

export const listStandardServices = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data, error } = await s.from("standard_services")
    .select("id, name, slug, category, synonyms, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return { services: (data ?? []) as StandardService[] };
});
