import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { addonByKey } from "@/lib/addons";
import { TIER_PRICING } from "@/lib/access";

/** Mano nusipirkti priedai (demo mokėjimai). */
export const listMyAddons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("demo_payments")
      .select("id, amount, kind, meta, created_at")
      .eq("user_id", context.userId)
      .eq("kind", "addon")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const now = Date.now();
    const rows = (data ?? []).map((r) => {
      const meta = (r.meta ?? {}) as { key?: string; label?: string; days?: number; consumed_at?: string; credits_remaining?: number };
      const days = Number(meta.days ?? 0);
      const endsAt = days > 0 ? new Date(new Date(r.created_at).getTime() + days * 86_400_000).toISOString() : null;
      return {
        id: r.id,
        key: String(meta.key ?? ""),
        label: String(meta.label ?? ""),
        amount: Number(r.amount ?? 0),
        created_at: r.created_at,
        ends_at: endsAt,
        credits_remaining: meta.credits_remaining == null ? (meta.consumed_at ? 0 : 1) : Number(meta.credits_remaining),
        active: endsAt
          ? new Date(endsAt).getTime() > now
          : meta.credits_remaining != null
            ? meta.credits_remaining > 0
            : !meta.consumed_at,
      };
    });
    return { addons: rows };
  });

/** Priedo pirkimas demo režimu (kortelė 4242 …). */
export const purchaseAddon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ key: z.string().min(2), card_last4: z.string().regex(/^\d{4}$/).default("4242") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const addon = addonByKey(data.key);
    if (!addon) throw new Error("Nežinomas priedas");

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const allowed = (roles ?? []).some((r) => addon.roles.includes(String(r.role)));
    if (!allowed) throw new Error("Šis priedas neprieinamas jūsų paskyrai");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("demo_payments").insert({
      user_id: context.userId,
      amount: addon.eur,
      card_last4: data.card_last4,
      status: "paid",
      kind: "addon",
      meta: {
        key: addon.key,
        label: addon.label,
        days: addon.days,
        ...(addon.credits ? { credits_remaining: addon.credits } : {}),
      } as never,
    });
    if (error) throw new Error(error.message);

    return { ok: true, amount: addon.eur, label: addon.label, key: addon.key };
  });

/** Skelbimo paryškinimas — 2,99 €/savaitė (demo mokėjimas). */
export const purchaseClassifiedHighlight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), weeks: z.number().int().min(1).max(8).default(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("classified_listings")
      .select("id, owner_id, highlight_until")
      .eq("id", data.id)
      .maybeSingle();
    if (!row || row.owner_id !== context.userId) throw new Error("Skelbimas nerastas");

    const base = row.highlight_until && new Date(row.highlight_until) > new Date() ? new Date(row.highlight_until) : new Date();
    const ends = new Date(base.getTime() + data.weeks * 7 * 86_400_000);
    const amountCents = TIER_PRICING.highlight.cents * data.weeks;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("highlight_purchases").insert({
      user_id: context.userId,
      target_kind: "classified",
      target_id: row.id,
      weeks: data.weeks,
      amount_cents: amountCents,
      payment_status: "paid",
      payment_provider: "demo",
      starts_at: new Date().toISOString(),
      ends_at: ends.toISOString(),
      plan_type: "highlight",
    });
    const { error } = await supabaseAdmin
      .from("classified_listings")
      .update({ is_highlighted: true, highlight_until: ends.toISOString() })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true, ends_at: ends.toISOString(), amount: amountCents / 100 };
  });
