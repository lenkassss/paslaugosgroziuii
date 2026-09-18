type AdminClient = {
  from: (table: string) => any;
};

/** Rezervuoja vienkartinį nupirktą priedą prieš kuriant jo turinį. */
export async function claimAddonCredit(userId: string, acceptedKeys: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const client = supabaseAdmin as unknown as AdminClient;
  const { data, error } = await client
    .from("demo_payments")
    .select("id, meta, created_at")
    .eq("user_id", userId)
    .eq("kind", "addon")
    .eq("status", "paid")
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);

  const payment = (data ?? []).find((row: { meta?: Record<string, unknown> | null }) => {
    const meta = row.meta ?? {};
    const hasCredits = meta.credits_remaining == null || Number(meta.credits_remaining) > 0;
    return acceptedKeys.includes(String(meta.key ?? "")) && !meta.consumed_at && hasCredits;
  });
  if (!payment) throw new Error("Pirmiausia įsigykite šią paslaugą skiltyje „Papildomos paslaugos“.");

  const oldMeta = (payment.meta ?? {}) as Record<string, unknown>;
  const remaining = oldMeta.credits_remaining == null ? null : Number(oldMeta.credits_remaining);
  const meta = remaining == null
    ? { ...oldMeta, consumed_at: new Date().toISOString() }
    : { ...oldMeta, credits_remaining: Math.max(0, remaining - 1), ...(remaining <= 1 ? { consumed_at: new Date().toISOString() } : {}) };
  const { error: updateError } = await client.from("demo_payments").update({ meta }).eq("id", payment.id);
  if (updateError) throw new Error(updateError.message);
  return { id: payment.id as string, key: String(oldMeta.key ?? "") };
}

export async function releaseAddonCredit(paymentId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const client = supabaseAdmin as unknown as AdminClient;
  const { data } = await client.from("demo_payments").select("meta").eq("id", paymentId).maybeSingle();
  if (!data) return;
  const meta = { ...((data.meta ?? {}) as Record<string, unknown>) };
  if (meta.credits_remaining != null) meta.credits_remaining = Number(meta.credits_remaining) + 1;
  delete meta.consumed_at;
  await client.from("demo_payments").update({ meta }).eq("id", paymentId);
}

export async function isSalonOrStaff(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).some((row: { role: string }) => row.role === "salon" || row.role === "staff");
}