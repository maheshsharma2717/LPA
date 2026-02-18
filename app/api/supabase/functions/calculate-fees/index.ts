import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";

const OUR_FEE_PER_LPA_PENCE = 9900; // £99
const OPG_FEE_FULL_PENCE = 8200; // £82
const OPG_FEE_REDUCED_PENCE = 4100; // £41
const OPG_FEE_EXEMPT_PENCE = 0;

interface FeeBreakdown {
  lpa_document_id: string;
  donor_id: string;
  donor_name: string;
  lpa_type: string;
  our_fee_pence: number;
  opg_fee_tier: string;
  opg_fee_pence: number;
}

export function calculateOpgFee(tier: string): number {
  switch (tier) {
    case "exempt":
      return OPG_FEE_EXEMPT_PENCE;
    case "reduced":
      return OPG_FEE_REDUCED_PENCE;
    default:
      return OPG_FEE_FULL_PENCE;
  }
}

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

    // Verify user owns this application
    const { data: app, error: appError } = await userClient
      .from("applications")
      .select("id, lead_id")
      .eq("id", application_id)
      .is("deleted_at", null)
      .single();

    if (appError || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all LPA documents for this application via donors
    const serviceClient = createServiceClient();
    const { data: lpaDocuments, error: lpaError } = await serviceClient
      .from("lpa_documents")
      .select(`
        id,
        lpa_type,
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

    // Fetch benefit assessments for all donors in this application
    const donorIds = [...new Set((lpaDocuments || []).map((ld: any) => ld.donor_id))];
    const { data: assessments } = await serviceClient
      .from("benefits_assessments")
      .select("donor_id, calculated_fee_tier")
      .in("donor_id", donorIds);

    const tierByDonor: Record<string, string> = {};
    for (const a of assessments || []) {
      tierByDonor[a.donor_id] = a.calculated_fee_tier;
    }

    // Calculate fees
    const breakdown: FeeBreakdown[] = [];
    let totalOurFee = 0;
    let totalOpgFee = 0;

    for (const doc of lpaDocuments || []) {
      const donor = doc.donors as any;
      const tier = tierByDonor[doc.donor_id] || "full";
      const opgFee = calculateOpgFee(tier);

      breakdown.push({
        lpa_document_id: doc.id,
        donor_id: doc.donor_id,
        donor_name: `${donor.first_name} ${donor.last_name}`,
        lpa_type: doc.lpa_type,
        our_fee_pence: OUR_FEE_PER_LPA_PENCE,
        opg_fee_tier: tier,
        opg_fee_pence: opgFee,
      });

      totalOurFee += OUR_FEE_PER_LPA_PENCE;
      totalOpgFee += opgFee;
    }

    const result = {
      our_fee_pence: totalOurFee,
      opg_fee_pence: totalOpgFee,
      total_pence: totalOurFee + totalOpgFee,
      breakdown,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
