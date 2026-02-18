import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createUserClient, createServiceClient } from "../_shared/supabase.ts";

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

    const { lpa_document_id } = await req.json();
    if (!lpa_document_id) {
      return new Response(JSON.stringify({ error: "lpa_document_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const userClient = createUserClient(authHeader);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createServiceClient();

    const { data: admin } = await serviceClient
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .eq("is_active", true)
      .single();

    if (!admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch LPA document
    const { data: lpaDoc, error: lpaError } = await serviceClient
      .from("lpa_documents")
      .select("id, status, pdf_storage_path, lpa_type, donor_id")
      .eq("id", lpa_document_id)
      .is("deleted_at", null)
      .single();

    if (lpaError || !lpaDoc) {
      return new Response(JSON.stringify({ error: "LPA document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lpaDoc.status !== "pdf_generated") {
      return new Response(
        JSON.stringify({
          error: `LPA document must have status 'pdf_generated'. Current status: '${lpaDoc.status}'`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!lpaDoc.pdf_storage_path) {
      return new Response(
        JSON.stringify({ error: "No PDF file found for this LPA document" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Download PDF from storage
    const { data: pdfFile, error: downloadError } = await serviceClient.storage
      .from("lpa-pdfs")
      .download(lpaDoc.pdf_storage_path);

    if (downloadError || !pdfFile) {
      return new Response(
        JSON.stringify({ error: `Failed to download PDF: ${downloadError?.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // TODO: Replace with actual 3rd party postal API integration
    // For now, simulate a postal submission
    const postalApiUrl = Deno.env.get("POSTAL_API_URL");
    const postalApiKey = Deno.env.get("POSTAL_API_KEY");

    let postalReference: string;
    let postalStatus: string;

    if (postalApiUrl && postalApiKey) {
      // Real postal API call
      const formData = new FormData();
      formData.append("file", pdfFile, `${lpaDoc.lpa_type}.pdf`);
      formData.append("reference", lpa_document_id);

      const postalResponse = await fetch(postalApiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${postalApiKey}`,
        },
        body: formData,
      });

      if (!postalResponse.ok) {
        const errorText = await postalResponse.text();
        return new Response(
          JSON.stringify({ error: `Postal API error: ${errorText}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const postalResult = await postalResponse.json();
      postalReference = postalResult.reference || postalResult.id;
      postalStatus = "submitted";
    } else {
      // Simulated postal submission for development
      postalReference = `SIM-${Date.now()}-${lpa_document_id.substring(0, 8)}`;
      postalStatus = "submitted";
      console.log(`[DEV] Simulated postal submission: ${postalReference}`);
    }

    // Update LPA document with postal info
    // Use system edit flag to bypass post-payment lock
    await serviceClient.rpc("set_audit_context", {
      p_user_id: user.id,
      p_user_role: "admin",
      p_allow_system_edit: "true",
    });

    const { error: updateError } = await serviceClient
      .from("lpa_documents")
      .update({
        postal_reference: postalReference,
        postal_status: postalStatus,
        postal_submitted_at: new Date().toISOString(),
        status: "sent_to_post",
      })
      .eq("id", lpa_document_id);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Failed to update document: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        postal_reference: postalReference,
        status: postalStatus,
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
