import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type ProviderCard = {
  id: string;
  business_name: string | null;
  owner_name: string | null;
  city: string | null;
  category: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  gallery_urls: string[] | null;
  verification_status: string | null;
  kind: "salon" | "specialist";
  /** Ar profilis turi PRO narystę – tik tada galima registruotis. */
  canBook: boolean;
  brands: string[];
  services: Array<{ name: string; price: number; duration_mins: number }>;
};

/**
 * Viešas salonų / individualių meistrų katalogas.
 * Rodo VISUS aktyvius profilius (net be laisvų laikų) – naršymui ir peržiūrai.
 * Registruotis galima tik pas PRO narystę turinčius (canBook).
 */
export const listProviders = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["salon", "specialist", "all"]).optional().default("all"),
        city: z.string().optional(),
        q: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const s = publicClient();
    let q = s
      .from("profiles")
      .select(
        "id, business_name, owner_name, city, category, bio, avatar_url, cover_url, gallery_urls, verification_status, subscription_active, membership_level, is_approved",
      )
      .eq("suspended", false)
      .is("blocked_at", null)
      .not("business_name", "is", null)
      .or("is_approved.eq.true,subscription_active.eq.true")
      .limit(200);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.q) q = q.ilike("business_name", `%${data.q.replace(/[%_]/g, "")}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    if (!rows?.length) return { providers: [] as ProviderCard[] };

    const { data: roles } = await s.rpc("list_provider_roles");
    const roleById = new Map((roles ?? []).map((r: { user_id: string; role: string }) => [r.user_id, r.role]));

    let list = rows.filter((r) => roleById.has(r.id));
    const kindOf = (id: string): "salon" | "specialist" => (roleById.get(id) === "staff" ? "specialist" : "salon");
    if (data.kind !== "all") list = list.filter((r) => kindOf(r.id) === data.kind);
    if (!list.length) return { providers: [] as ProviderCard[] };

    const ids = list.map((r) => r.id);
    const [{ data: svcRows }, { data: brandRows }] = await Promise.all([
      s.from("services").select("salon_id, name, price, duration_mins").in("salon_id", ids).limit(600),
      s.from("provider_brands").select("profile_id, global_brands(name)").in("profile_id", ids).limit(600),
    ]);

    const svcBy = new Map<string, ProviderCard["services"]>();
    for (const r of svcRows ?? []) {
      const arr = svcBy.get(r.salon_id) ?? [];
      if (arr.length < 6) arr.push({ name: r.name, price: Number(r.price ?? 0), duration_mins: r.duration_mins });
      svcBy.set(r.salon_id, arr);
    }
    const brandBy = new Map<string, string[]>();
    for (const r of (brandRows ?? []) as Array<{ profile_id: string; global_brands: { name: string } | null }>) {
      const arr = brandBy.get(r.profile_id) ?? [];
      if (r.global_brands?.name) arr.push(r.global_brands.name);
      brandBy.set(r.profile_id, arr);
    }

    const providers: ProviderCard[] = list.map((r) => ({
      id: r.id,
      business_name: r.business_name,
      owner_name: r.owner_name,
      city: r.city,
      category: r.category,
      bio: r.bio,
      avatar_url: r.avatar_url,
      cover_url: r.cover_url,
      gallery_urls: r.gallery_urls,
      verification_status: r.verification_status,
      kind: kindOf(r.id),
      canBook: !!r.subscription_active && r.membership_level === "pro",
      brands: brandBy.get(r.id) ?? [],
      services: svcBy.get(r.id) ?? [],
    }));

    providers.sort((a, b) => Number(b.canBook) - Number(a.canBook) || (a.business_name ?? "").localeCompare(b.business_name ?? ""));
    return { providers };
  });
