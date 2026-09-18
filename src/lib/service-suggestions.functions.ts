import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notifyAdmins } from "@/lib/notify-admins.server";

export type ServiceSuggestion = {
  id: string;
  user_id: string;
  suggestion: string;
  note: string | null;
  status: string;
  created_at: string;
};

const COLS = "id, user_id, suggestion, note, status, created_at";

/** Verslo paskyra pasiūlo paslaugą, kurios nėra sąraše (arba pateikia patarimą). */
export const submitServiceSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        suggestion: z.string().trim().min(3).max(120),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("service_suggestions").insert({
      user_id: context.userId,
      suggestion: data.suggestion,
      note: data.note ?? null,
    });
    if (error) throw new Error(error.message);
    await notifyAdmins("admin_course_pending", {
      kind: "service_suggestion",
      suggestion: data.suggestion,
    });
    return { ok: true };
  });

/** Mano pateikti pasiūlymai. */
export const listMyServiceSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_suggestions")
      .select(COLS)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as unknown as ServiceSuggestion[] };
  });

/** Administratoriams: visi pasiūlymai. */
export const listServiceSuggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("service_suggestions")
      .select(COLS)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { items: (data ?? []) as unknown as ServiceSuggestion[] };
  });

/** Administratorius pažymi pasiūlymą apsvarstytu. */
export const resolveServiceSuggestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), status: z.enum(["reviewed", "added", "declined"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("service_suggestions")
      .update({ status: data.status, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
