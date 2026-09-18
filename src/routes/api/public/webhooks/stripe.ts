import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
          return new Response("Stripe not configured", { status: 503 });
        }
        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });
        const body = await request.text();

        const Stripe = require("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2024-06-20",
          httpClient: Stripe.createFetchHttpClient(),
        });

        let event: { type: string; data: { object: Record<string, unknown> } };
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (e) {
          return new Response(`Signature verify failed: ${(e as Error).message}`, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as { id: string; metadata?: { appointment_id?: string }; payment_intent?: string };
          const apptId = session.metadata?.appointment_id;
          if (apptId) {
            await supabaseAdmin.from("appointments").update({
              payment_status: "paid",
              status: "confirmed",
              deposit_status: "paid",
              stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
            }).eq("id", apptId);
          }
        } else if (event.type === "charge.refunded" || event.type === "payment_intent.payment_failed") {
          const obj = event.data.object as { payment_intent?: string; id?: string };
          const pi = event.type === "charge.refunded" ? obj.payment_intent : obj.id;
          if (pi) {
            await supabaseAdmin.from("appointments").update({
              payment_status: event.type === "charge.refunded" ? "refunded" : "failed",
            }).eq("stripe_payment_intent_id", pi);
          }
        } else if (event.type === "account.updated") {
          const acct = event.data.object as { id: string; charges_enabled?: boolean; details_submitted?: boolean };
          const enabled = !!(acct.charges_enabled && acct.details_submitted);
          await supabaseAdmin.from("profiles").update({ payments_enabled: enabled }).eq("stripe_account_id", acct.id);
        }

        return Response.json({ received: true });
      },
    },
  },
});
