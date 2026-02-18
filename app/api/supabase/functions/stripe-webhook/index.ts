import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createServiceClient } from "../_shared/supabase.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", (err as Error).message);
      return new Response(`Webhook signature verification failed: ${(err as Error).message}`, {
        status: 400,
      });
    }

    const serviceClient = createServiceClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const applicationId = session.metadata?.application_id;

        if (!applicationId) {
          console.error("No application_id in session metadata");
          return new Response("No application_id in metadata", { status: 400 });
        }

        // Set system context for audit trail + allow system edit (post-payment)
        await serviceClient.rpc("set_audit_context", {
          p_user_id: "",
          p_user_role: "system",
          p_allow_system_edit: "true",
        });

        // Insert payment record (idempotent via UNIQUE on stripe_checkout_session_id)
        const { error: paymentError } = await serviceClient
          .from("payments")
          .upsert(
            {
              application_id: applicationId,
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string,
              amount_pence: session.amount_total || 0,
              status: "succeeded",
              stripe_event_data: event.data.object,
              paid_at: new Date().toISOString(),
            },
            { onConflict: "stripe_checkout_session_id" },
          );

        if (paymentError) {
          console.error("Payment insert error:", paymentError);
          // If it's a duplicate, that's fine (idempotency)
          if (!paymentError.message.includes("duplicate")) {
            return new Response(JSON.stringify({ error: paymentError.message }), { status: 500 });
          }
        }

        // Update application status to paid
        const { error: appError } = await serviceClient
          .from("applications")
          .update({
            status: "paid",
            stripe_payment_intent_id: session.payment_intent as string,
            paid_at: new Date().toISOString(),
          })
          .eq("id", applicationId);

        if (appError) {
          console.error("Application update error:", appError);
          return new Response(JSON.stringify({ error: appError.message }), { status: 500 });
        }

        console.log(`Payment succeeded for application ${applicationId}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Find the application by payment intent ID
        const { data: apps } = await serviceClient
          .from("applications")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id);

        if (apps && apps.length > 0) {
          // Update any existing payment records
          await serviceClient
            .from("payments")
            .update({ status: "failed" })
            .eq("stripe_payment_intent_id", paymentIntent.id);
        }

        console.log(`Payment failed for intent ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
