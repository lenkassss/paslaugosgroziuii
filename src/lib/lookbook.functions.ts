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

export type LookbookItem = {
  id: string;
  title: string;
  trend: string;
  image_url: string;
  master_name: string | null;
  city: string | null;
  price: number | null;
  profile_id: string | null;
  service_name: string | null;
};

export const listLookbook = createServerFn({ method: "GET" }).handler(async () => {
  const s = publicClient();
  const { data, error } = await s
    .from("lookbook_items")
    .select("id, title, trend, image_url, master_name, city, price, profile_id, service_name")
    .eq("is_active", true)
    .order("trend", { ascending: true })
    .order("sort_order", { ascending: true })
    .limit(48);
  if (error) return { items: [] as LookbookItem[] };
  const items = (data ?? []).map((r) => ({ ...r, price: r.price === null ? null : Number(r.price) })) as LookbookItem[];
  return { items };
});
