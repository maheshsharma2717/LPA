import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";
import { calculateOpgFee } from "../calculate-fees/index.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-04-10",
  httpClient: Stripe.createFetchHttpClient(),
});

const OUR_FEE_PER_LPA_PENCE = 9900;

serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { application_id } = await req.json();
    if (!application_id) {
      return new Response(JSON.stringify({ error: "application_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createUserClient(authHeader);

    // Verify user owns and application is in correct state
    const { data: app, error: appError } = await userClient
      .from("applications")
      .select("id, lead_id, status")
      .eq("id", application_id)
      .is("deleted_at", null)
      .single();

    if (appError || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (app.status !== "complete") {
      return new Response(
        JSON.stringify({ error: "Application must be in 'complete' status before payment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const serviceClient = createServiceClient();

    // Fetch all LPA documents and validate they are complete
    const { data: lpaDocuments, error: lpaError } = await serviceClient
      .from("lpa_documents")
      .select(`
        id,
        lpa_type,
        status,
        donor_id,
        donors!inner (
          id,
          first_name,
          last_name,
          application_id
        )
      `)
      .eq("donors.application_id", application_id)
      .is("deleted_at", null);

    if (lpaError) {
      return new Response(JSON.stringify({ error: lpaError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const incompleteDocs = (lpaDocuments || []).filter((d: any) => d.status !== "complete");
    if (incompleteDocs.length > 0) {
      return new Response(
        JSON.stringify({
          error: "All LPA documents must be complete before payment",
          incomplete_ids: incompleteDocs.map((d: any) => d.id),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Calculate fees
    const donorIds = [...new Set((lpaDocuments || []).map((ld: any) => ld.donor_id))];
    const { data: assessments } = await serviceClient
      .from("benefits_assessments")
      .select("donor_id, calculated_fee_tier")
      .in("donor_id", donorIds);

    const tierByDonor: Record<string, string> = {};
    for (const a of assessments || []) {
      tierByDonor[a.donor_id] = a.calculated_fee_tier;
    }

    let totalOurFee = 0;
    let totalOpgFee = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const doc of lpaDocuments || []) {
      const donor = doc.donors as any;
      const tier = tierByDonor[doc.donor_id] || "full";
      const opgFee = calculateOpgFee(tier);
      const lpaTypeLabel = doc.lpa_type === "health_and_welfare"
        ? "Health & Welfare"
        : "Property & Finance";

      totalOurFee += OUR_FEE_PER_LPA_PENCE;
      totalOpgFee += opgFee;

      // Our service fee line item
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: `LPA Service Fee - ${lpaTypeLabel}`,
            description: `${donor.first_name} ${donor.last_name}`,
          },
          unit_amount: OUR_FEE_PER_LPA_PENCE,
        },
        quantity: 1,
      });

      // OPG fee line item (if not exempt)
      if (opgFee > 0) {
        lineItems.push({
          price_data: {
            currency: "gbp",
            product_data: {
              name: `OPG Registration Fee - ${lpaTypeLabel}`,
              description: `${donor.first_name} ${donor.last_name} (${tier === "reduced" ? "Reduced" : "Full"})`,
            },
            unit_amount: opgFee,
          },
          quantity: 1,
        });
      }
    }

    const totalPence = totalOurFee + totalOpgFee;

    // Get lead email for Stripe
    const { data: { user } } = await serviceClient.auth.admin.getUserById(app.lead_id);

    // Create Stripe Checkout Session
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user?.email,
      line_items: lineItems,
      metadata: {
        application_id,
      },
      success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/payment/cancel?application_id=${application_id}`,
    });

    // Set audit context and update application with checkout session ID and calculated fees
    await serviceClient.rpc("set_audit_context", {
      p_user_id: app.lead_id,
      p_user_role: "lead",
    });

    await serviceClient
      .from("applications")
      .update({
        stripe_checkout_session_id: session.id,
        our_fee_pence: totalOurFee,
        opg_fee_pence: totalOpgFee,
        total_pence: totalPence,
        payment_method: "card",
      })
      .eq("id", application_id);

    // Also update each lpa_document with its opg_fee
    for (const doc of lpaDocuments || []) {
      const tier = tierByDonor[doc.donor_id] || "full";
      const opgFee = calculateOpgFee(tier);
      await serviceClient
        .from("lpa_documents")
        .update({ opg_fee_tier: tier, opg_fee_pence: opgFee })
        .eq("id", doc.id);
    }

    return new Response(
      JSON.stringify({
        checkout_url: session.url,
        session_id: session.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
