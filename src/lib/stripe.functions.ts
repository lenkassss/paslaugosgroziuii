import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function stripeClient() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

function siteOrigin(): string {
  return process.env.SITE_URL || "https://www.testinispuslapis.online";
}

// SALON OWNER: start Stripe Connect Express onboarding
export const startStripeConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe dar nesukonfigūruotas");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = stripeClient();
    const { data: profile } = await supabaseAdmin.from("profiles").select("stripe_account_id, email, business_name").eq("id", context.userId).maybeSingle();
    if (!profile) throw new Error("Profilis nerastas");

    let accountId = profile.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "LT",
        email: profile.email ?? undefined,
        business_profile: { name: profile.business_name ?? undefined },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await supabaseAdmin.from("profiles").update({ stripe_account_id: accountId }).eq("id", context.userId);
    }

    const origin = siteOrigin();
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/salon/wallet?stripe=refresh`,
      return_url: `${origin}/dashboard/salon/wallet?stripe=return`,
      type: "account_onboarding",
    });
    return { url: link.url };
  });

// SALON OWNER: refresh Stripe status
export const refreshStripeStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!process.env.STRIPE_SECRET_KEY) return { payments_enabled: false, stripe_account_id: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = stripeClient();
    const { data: profile } = await supabaseAdmin.from("profiles").select("stripe_account_id").eq("id", context.userId).maybeSingle();
    if (!profile?.stripe_account_id) return { payments_enabled: false, stripe_account_id: null };
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const enabled = !!(account.charges_enabled && account.details_submitted);
    await supabaseAdmin.from("profiles").update({ payments_enabled: enabled }).eq("id", context.userId);
    return { payments_enabled: enabled, stripe_account_id: profile.stripe_account_id };
  });

// CLIENT: create Checkout Session for a booked appointment
export const createBookingCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Mokėjimai laikinai negalimi");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = stripeClient();
    const { data: appt } = await supabaseAdmin.from("appointments")
      .select("id, salon_id, service_name, duration_mins, cancel_token, client_user_id")
      .eq("id", data.appointmentId).maybeSingle();
    if (!appt) throw new Error("Vizitas nerastas");
    if (appt.client_user_id && appt.client_user_id !== context.userId) throw new Error("Neturite teisės apmokėti šio vizito.");

    const { data: salon } = await supabaseAdmin.from("profiles")
      .select("stripe_account_id, payments_enabled, business_name").eq("id", appt.salon_id).maybeSingle();
    if (!salon?.stripe_account_id || !salon.payments_enabled) throw new Error("Salonas dar nepriima kortelinių mokėjimų.");

    // Look up service price
    let priceEur = 0;
    const { data: svc } = await supabaseAdmin.from("appointments").select("service_id").eq("id", data.appointmentId).maybeSingle();
    if (svc?.service_id) {
      const { data: s } = await supabaseAdmin.from("services").select("price").eq("id", svc.service_id).maybeSingle();
      if (s) priceEur = Number(s.price);
    }
    if (priceEur <= 0) priceEur = 10; // fallback
    const amountCents = Math.round(priceEur * 100);
    const platformFeeCents = 49;

    const origin = siteOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: `${appt.service_name} · ${salon.business_name ?? ""}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: salon.stripe_account_id },
      },
      metadata: { appointment_id: appt.id },
      success_url: `${origin}/appointment/${appt.cancel_token}?paid=1`,
      cancel_url: `${origin}/appointment/${appt.cancel_token}?cancelled=1`,
    });

    await supabaseAdmin.from("appointments").update({ stripe_checkout_session_id: session.id }).eq("id", appt.id);
    return { url: session.url };
  });
