import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Ar vartotojas sutiko gauti naujienlaiškį. */
export const getNewsletterOptIn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("newsletter_opt_in")
      .eq("id", context.userId)
      .maybeSingle();
    return { optIn: !!data?.newsletter_opt_in };
  });

/** Sutikimo gavimas / atšaukimas (įrašomas ir laikas – GDPR įrodymui). */
export const setNewsletterOptIn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ optIn: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        newsletter_opt_in: data.optIn,
        newsletter_opt_in_at: data.optIn ? new Date().toISOString() : null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
