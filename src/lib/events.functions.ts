import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

// Public event registration (anon or authed)
export const registerForEvent = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    article_id: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    phone: z.string().trim().max(40).optional(),
    seats: z.number().int().min(1).max(20).default(1),
    note: z.string().trim().max(500).optional(),
    user_id: z.string().uuid().nullable().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    // Verify seats availability
    const { data: art } = await s.from("articles").select("event_seats, kind, status, title, event_price_eur").eq("id", data.article_id).maybeSingle();
    if (!art || art.kind !== "event" || art.status !== "published") throw new Error("Renginys nerastas.");
    if (art.event_seats) {
      const { data: taken } = await s.from("event_registrations").select("seats").eq("article_id", data.article_id).neq("status", "cancelled");
      const used = (taken ?? []).reduce((n, r) => n + (r.seats ?? 1), 0);
      if (used + data.seats > art.event_seats) throw new Error(`Liko tik ${Math.max(art.event_seats - used, 0)} vietų.`);
    }
    // Platform fee: 0,49 € per registration (same as appointments & courses)
    const PLATFORM_FEE_CENTS = 49;
    const price = Number(art.event_price_eur ?? 0);
    const amount_cents = Math.round(price * 100) * data.seats + PLATFORM_FEE_CENTS;
    const { data: reg, error } = await s.from("event_registrations").insert({
      amount_cents,
      payment_status: "pending",
      article_id: data.article_id,
      user_id: data.user_id ?? null,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      seats: data.seats,
      note: data.note ?? null,
    }).select("id").maybeSingle();
    if (error) throw new Error(error.message);

    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      await sendTemplateEmail("booking-confirmation", data.email, {
        idempotencyKey: `event-registration-${reg?.id ?? data.article_id}`,
        templateData: {
          customerName: data.name,
          salonName: art.title ?? undefined,
          serviceName: `Registracija · ${data.seats} viet${data.seats === 1 ? "a" : "os"}`,
          manageUrl: "https://testinispuslapis.online/feed/renginiai",
        },
      });
    } catch (e) {
      console.error("event registration email failed", e);
    }

    return { ok: true };
  });

// Organizer / admin: list registrations for an event
export const listEventRegistrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ article_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("event_registrations")
      .select("*")
      .eq("article_id", data.article_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { registrations: rows ?? [] };
  });

// Organizer: list all their events with registration counts
export const listMyEventsWithCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: events } = await context.supabase
      .from("articles")
      .select("id, slug, title, event_starts_at, event_location, event_seats, cover_url")
      .eq("author_id", context.userId)
      .eq("kind", "event")
      .order("event_starts_at", { ascending: false });
    const ids = (events ?? []).map((e) => e.id);
    let counts: Record<string, { total: number; seats: number }> = {};
    if (ids.length) {
      const { data: regs } = await context.supabase
        .from("event_registrations")
        .select("article_id, seats, status")
        .in("article_id", ids)
        .neq("status", "cancelled");
      for (const r of regs ?? []) {
        const k = r.article_id as string;
        counts[k] = counts[k] ?? { total: 0, seats: 0 };
        counts[k].total += 1;
        counts[k].seats += r.seats ?? 1;
      }
    }
    return { events: events ?? [], counts };
  });

// Update registration status (organizer/admin)
export const setRegistrationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "confirmed", "cancelled", "attended"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("event_registrations")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Counts for public event page (seats used)
export const getEventStats = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ article_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = publicClient();
    const { data: regs } = await s.from("event_registrations").select("seats, status").eq("article_id", data.article_id);
    let used = 0, confirmed = 0;
    for (const r of regs ?? []) {
      if (r.status === "cancelled") continue;
      used += r.seats ?? 1;
      if (r.status === "confirmed" || r.status === "attended") confirmed += r.seats ?? 1;
    }
    return { used, confirmed };
  });
