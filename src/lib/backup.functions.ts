import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TABLES = [
  "profiles",
  "user_roles",
  "services",
  "appointments",
  "classified_listings",
  "courses",
  "course_registrations",
  "orders",
  "order_items",
  "products",
  "articles",
  "event_registrations",
] as const;

export type BackupTable = (typeof TABLES)[number];
export const BACKUP_TABLES = TABLES;

/**
 * Atsarginė kopija: tik super administratorius. Kiekvienas eksportas
 * įrašomas į veiksmų žurnalą (kas, ką ir kada eksportavo).
 */
export const exportBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tables: z.array(z.enum(TABLES)).min(1).max(TABLES.length) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSuper } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
    if (!isSuper) throw new Error("Atsargines kopijas gali daryti tik super administratorius.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload: Record<string, Record<string, unknown>[]> = {};
    for (const table of data.tables) {
      const { data: rows, error } = await supabaseAdmin.from(table).select("*").limit(20_000);
      if (error) throw new Error(`${table}: ${error.message}`);
      payload[table] = (rows ?? []) as Record<string, unknown>[];
    }

    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId,
      action: "backup.export",
      entity: "platform",
      meta: {
        tables: data.tables,
        counts: Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, v.length])),
      },
    });

    const counts: Record<string, number> = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [k, v.length]),
    );
    const generated_at = new Date().toISOString();

    // Grąžinamas JSON tekstas – paruoštas iškart išsaugoti kaip failą.
    return {
      generated_at,
      tables: data.tables as string[],
      counts,
      json: JSON.stringify({ generated_at, counts, data: payload }),
    };
  });
