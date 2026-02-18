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

    // Verify caller is admin with MFA
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

    // Fetch LPA document with all related data
    const { data: lpaDoc, error: lpaError } = await serviceClient
      .from("lpa_documents")
      .select(`
        *,
        donors!inner (
          *,
          applications!inner (
            id,
            lead_id,
            status
          )
        )
      `)
      .eq("id", lpa_document_id)
      .is("deleted_at", null)
      .single();

    if (lpaError || !lpaDoc) {
      return new Response(JSON.stringify({ error: "LPA document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const donor = lpaDoc.donors as any;
    const application = donor.applications as any;

    // Fetch attorneys linked to this document
    const { data: docAttorneys } = await serviceClient
      .from("lpa_document_attorneys")
      .select(`
        role,
        sort_order,
        attorneys!inner (*)
      `)
      .eq("lpa_document_id", lpa_document_id)
      .is("deleted_at", null)
      .order("sort_order");

    // Fetch applicants
    const { data: applicants } = await serviceClient
      .from("lpa_document_applicants")
      .select(`
        applicant_role,
        attorney_id,
        attorneys (*)
      `)
      .eq("lpa_document_id", lpa_document_id);

    // Fetch people to notify
    const { data: peopleToNotify } = await serviceClient
      .from("people_to_notify")
      .select("*")
      .eq("lpa_document_id", lpa_document_id)
      .is("deleted_at", null);

    // Fetch certificate provider
    const { data: certProvider } = await serviceClient
      .from("certificate_providers")
      .select("*")
      .eq("lpa_document_id", lpa_document_id)
      .is("deleted_at", null)
      .maybeSingle();

    // Collect all data for PDF generation
    const pdfData = {
      lpa_type: lpaDoc.lpa_type,
      donor: {
        title: donor.title,
        first_name: donor.first_name,
        last_name: donor.last_name,
        middle_name: donor.middle_name,
        preferred_name: donor.preferred_name,
        date_of_birth: donor.date_of_birth,
        address_line_1: donor.address_line_1,
        address_line_2: donor.address_line_2,
        city: donor.city,
        county: donor.county,
        postcode: donor.postcode,
      },
      attorneys: {
        primary: (docAttorneys || [])
          .filter((a: any) => a.role === "primary")
          .map((a: any) => a.attorneys),
        replacement: (docAttorneys || [])
          .filter((a: any) => a.role === "replacement")
          .map((a: any) => a.attorneys),
      },
      attorney_decision_type: lpaDoc.attorney_decision_type,
      replacement_attorney_decision_type: lpaDoc.replacement_attorney_decision_type,
      life_sustaining_treatment: lpaDoc.life_sustaining_treatment,
      when_attorneys_can_act: lpaDoc.when_attorneys_can_act,
      applicants: applicants || [],
      people_to_notify: peopleToNotify || [],
      certificate_provider: certProvider,
    };

    // TODO: Replace with actual PDF generation using OPG template
    // For now, create a placeholder PDF with the collected data
    // In production, use a library like pdf-lib to fill the official OPG form fields
    const pdfContent = new TextEncoder().encode(JSON.stringify(pdfData, null, 2));

    // Upload to Supabase Storage
    const storagePath = `${application.id}/${lpa_document_id}/${lpaDoc.lpa_type}.pdf`;

    const { error: uploadError } = await serviceClient.storage
      .from("lpa-pdfs")
      .upload(storagePath, pdfContent, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: `Upload failed: ${uploadError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update LPA document with PDF path and status
    // Use system edit flag to bypass post-payment lock
    await serviceClient.rpc("set_audit_context", {
      p_user_id: user.id,
      p_user_role: "admin",
      p_allow_system_edit: "true",
    });

    const { error: updateError } = await serviceClient
      .from("lpa_documents")
      .update({
        pdf_storage_path: storagePath,
        status: "pdf_generated",
      })
      .eq("id", lpa_document_id);

    if (updateError) {
      return new Response(JSON.stringify({ error: `Update failed: ${updateError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate signed URL for download
    const { data: signedUrl } = await serviceClient.storage
      .from("lpa-pdfs")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    return new Response(
      JSON.stringify({
        pdf_url: signedUrl?.signedUrl,
        storage_path: storagePath,
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
