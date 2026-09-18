import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReferralStatus = {
  code: string | null;
  invitedCount: number;
  freeUntil: string | null;
  bonusGranted: boolean;
  /** Kiek pakvietimų reikia papildomam nemokamam mėnesiui. */
  goal: number;
};

/** Mano pakvietimo kodas, progresas ir nemokamo periodo pabaiga. */
export const getMyReferralStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ReferralStatus> => {
    const { data, error } = await context.supabase.rpc("my_referral_status");
    if (error) throw new Error(error.message);
    const row = (data as unknown as Array<{
      referral_code: string | null;
      invited_count: number;
      free_until: string | null;
      bonus_granted: boolean;
    }> | null)?.[0];
    return {
      code: row?.referral_code ?? null,
      invitedCount: Number(row?.invited_count ?? 0),
      freeUntil: row?.free_until ?? null,
      bonusGranted: !!row?.bonus_granted,
      goal: 10,
    };
  });

/** Naujas vartotojas užregistruoja pakvietimo kodą (po registracijos). */
export const registerReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4).max(24) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: ok, error } = await context.supabase.rpc("register_referral", { _code: data.code });
    if (error) throw new Error(error.message);
    return { ok: !!ok };
  });
