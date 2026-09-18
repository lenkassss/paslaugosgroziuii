import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ClientCard = {
  key: string;
  name: string;
  phone: string | null;
  email: string | null;
  visits: number;
  lastVisit: string | null;
  services: string[];
  note: string | null;
  isBlocked: boolean;
  blockedReason: string | null;
  recordId: string | null;
};

/**
 * Salono / meistrės klientų kartoteka.
 * Apsilankymai suskaičiuojami iš rezervacijų; pastabos ir blokavimai – iš `salon_clients`.
 * Jokių finansinių duomenų čia nėra ir niekur nekaupiama.
 */
export const listMyClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Meistrė mato savo salono klientus (tik savo vizitus).
    const { data: staffRow } = await supabase
      .from("salon_staff")
      .select("id, salon_id")
      .eq("user_id", userId)
      .maybeSingle();

    const salonId = staffRow?.salon_id ?? userId;
    let apptQ = supabase
      .from("appointments")
      .select("client_name, client_phone, client_email, service_name, appointment_date, status")
      .eq("salon_id", salonId)
      .order("appointment_date", { ascending: false })
      .limit(1000);
    if (staffRow?.id) apptQ = apptQ.eq("staff_id", staffRow.id);

    const [{ data: appts, error }, { data: records }] = await Promise.all([
      apptQ,
      supabase.from("salon_clients").select("*").eq("salon_id", userId),
    ]);
    if (error) throw new Error(error.message);

    const byKey = new Map<string, ClientCard>();
    for (const a of appts ?? []) {
      if (a.status === "cancelled") continue;
      const key = (a.client_phone || a.client_email || a.client_name || "").trim().toLowerCase();
      if (!key) continue;
      const card = byKey.get(key) ?? {
        key,
        name: a.client_name ?? "Klientas",
        phone: a.client_phone ?? null,
        email: a.client_email ?? null,
        visits: 0,
        lastVisit: null,
        services: [],
        note: null,
        isBlocked: false,
        blockedReason: null,
        recordId: null,
      };
      card.visits += 1;
      if (!card.lastVisit || a.appointment_date > card.lastVisit) card.lastVisit = a.appointment_date;
      if (a.service_name && !card.services.includes(a.service_name) && card.services.length < 8)
        card.services.push(a.service_name);
      byKey.set(key, card);
    }

    for (const r of records ?? []) {
      const key = (r.client_phone || r.client_email || r.client_name || "").trim().toLowerCase();
      if (!key) continue;
      const card = byKey.get(key) ?? {
        key,
        name: r.client_name ?? "Klientas",
        phone: r.client_phone ?? null,
        email: r.client_email ?? null,
        visits: 0,
        lastVisit: null,
        services: [],
        note: null,
        isBlocked: false,
        blockedReason: null,
        recordId: null,
      };
      card.note = r.note ?? null;
      card.isBlocked = !!r.is_blocked;
      card.blockedReason = r.blocked_reason ?? null;
      card.recordId = r.id;
      if (!card.phone) card.phone = r.client_phone ?? null;
      if (!card.email) card.email = r.client_email ?? null;
      byKey.set(key, card);
    }

    const clients = Array.from(byKey.values()).sort(
      (a, b) => (b.lastVisit ?? "").localeCompare(a.lastVisit ?? "") || b.visits - a.visits,
    );
    return { clients };
  });

/** Pastaba prie kliento arba blokavimas – tik savo kartotekoje. */
export const saveClientRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        client_name: z.string().max(120).nullable().optional(),
        client_phone: z.string().max(40).nullable().optional(),
        client_email: z.string().max(160).nullable().optional(),
        note: z.string().max(2000).nullable().optional(),
        is_blocked: z.boolean().optional(),
        blocked_reason: z.string().max(300).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const phone = data.client_phone || null;
    const row = { ...data, client_phone: phone, salon_id: context.userId };
    if (phone) {
      const { error } = await context.supabase
        .from("salon_clients")
        .upsert(row, { onConflict: "salon_id,client_phone" });
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { data: existing } = await context.supabase
      .from("salon_clients")
      .select("id")
      .eq("salon_id", context.userId)
      .eq("client_email", data.client_email ?? "")
      .maybeSingle();
    if (existing?.id) {
      const { error } = await context.supabase.from("salon_clients").update(row).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("salon_clients").insert(row);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
