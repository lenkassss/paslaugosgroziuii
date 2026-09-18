import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function pub() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type ModelCall = {
  id: string;
  provider_id: string;
  service_category: string | null;
  service_name: string;
  city: string | null;
  description: string | null;
  price_cents: number;
  spots: number;
  starts_on: string | null;
  ends_on: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  image_urls: string[];
  status: string;
  created_at: string;
  provider?: { business_name: string | null; owner_name: string | null; avatar_url: string | null; city: string | null } | null;
};

/** Vieša „Ieškomi modeliai“ paieška – pagal paslaugą ir pagal miestą. */
export const listModelCalls = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        city: z.string().optional(),
        category: z.string().optional(),
        q: z.string().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    const s = pub();
    let q = s
      .from("model_calls")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(120);
    if (data.city && data.city !== "Visi") q = q.ilike("city", `%${data.city}%`);
    if (data.category) q = q.eq("service_category", data.category);
    if (data.q) q = q.ilike("service_name", `%${data.q.replace(/[%_]/g, "")}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const calls = (rows ?? []) as ModelCall[];
    if (!calls.length) return { calls };

    const ids = Array.from(new Set(calls.map((c) => c.provider_id)));
    const { data: profs } = await s
      .from("profiles")
      .select("id, business_name, owner_name, avatar_url, city")
      .in("id", ids);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    return { calls: calls.map((c) => ({ ...c, provider: byId.get(c.provider_id) ?? null })) };
  });

/** Meistrės / salono savi „Ieškomi modeliai“ skelbimai. */
export const listMyModelCalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("model_calls")
      .select("*")
      .eq("provider_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { calls: (data ?? []) as ModelCall[] };
  });

const payload = z.object({
  id: z.string().uuid().optional(),
  service_name: z.string().min(2).max(120),
  service_category: z.string().max(80).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  price_cents: z.number().int().min(0).max(100000).optional(),
  spots: z.number().int().min(1).max(50).optional(),
  starts_on: z.string().nullable().optional(),
  ends_on: z.string().nullable().optional(),
  contact_phone: z.string().max(40).nullable().optional(),
  contact_email: z.string().max(120).nullable().optional(),
  image_urls: z.array(z.string()).max(6).optional(),
  status: z.enum(["active", "closed"]).optional(),
});

export const saveModelCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => payload.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const row = {
      ...rest,
      starts_on: rest.starts_on || null,
      ends_on: rest.ends_on || null,
      provider_id: context.userId,
    };
    if (id) {
      const { error } = await context.supabase
        .from("model_calls")
        .update(row)
        .eq("id", id)
        .eq("provider_id", context.userId);
      if (error) throw new Error(error.message);
    } else {
      const { claimAddonCredit, releaseAddonCredit } = await import("@/lib/addon-access.server");
      const { MODEL_KEYS } = await import("@/lib/packages");
      const payment = await claimAddonCredit(context.userId, MODEL_KEYS);
      const { error } = await context.supabase.from("model_calls").insert(row);
      if (error) {
        await releaseAddonCredit(payment.id);
        throw new Error(error.message);
      }
    }
    return { ok: true };
  });

export const deleteModelCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("model_calls")
      .delete()
      .eq("id", data.id)
      .eq("provider_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
