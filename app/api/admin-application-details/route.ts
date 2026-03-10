import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing application ID" }, { status: 400 });
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = getServerSupabase(token);

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to check MFA claim
    let currentLevel = "aal1";
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      currentLevel = payload.aal || "aal1";
    } catch (e) {
      console.error("Error decoding JWT:", e);
    }

    if (currentLevel !== "aal2") {
      return NextResponse.json(
        { error: "MFA verification required", current_level: currentLevel },
        { status: 403 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { data: admin } = await supabaseAdmin
      .from("admin_users")
      .select("id, is_active")
      .eq("id", user.id)
      .eq("is_active", true)
      .single();

    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select(`
        *,
        leads (*),
        donors (
          *,
          lpa_documents (
            *,
            certificate_providers (*),
            people_to_notify (*),
            lpa_document_applicants (*),
            lpa_document_attorneys (*)
          ),
          benefits_assessments (*)
        ),
        attorneys (*),
        payments (*)
      `)
      .eq("id", id)
      .single();

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
