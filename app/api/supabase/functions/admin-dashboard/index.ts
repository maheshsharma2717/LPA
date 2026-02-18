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

    const userClient = createUserClient(authHeader);

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check MFA assurance level
    const { data: mfaData, error: mfaError } =
      await userClient.auth.mfa.getAuthenticatorAssuranceLevel();

    if (mfaError || !mfaData) {
      return new Response(JSON.stringify({ error: "Failed to check MFA status" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mfaData.currentLevel !== "aal2") {
      return new Response(
        JSON.stringify({ error: "MFA verification required", current_level: mfaData.currentLevel }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify user is an admin
    const serviceClient = createServiceClient();
    const { data: admin } = await serviceClient
      .from("admin_users")
      .select("id, is_active")
      .eq("id", user.id)
      .eq("is_active", true)
      .single();

    if (!admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather dashboard stats
    // Total applications (non-deleted)
    const { count: totalApplications } = await serviceClient
      .from("applications")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Applications by status
    const { data: statusCounts } = await serviceClient
      .from("applications")
      .select("status")
      .is("deleted_at", null);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts || []) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    }

    // Revenue (sum of payments that succeeded)
    const { data: revenueData } = await serviceClient
      .from("payments")
      .select("amount_pence")
      .eq("status", "succeeded");

    const revenuePence = (revenueData || []).reduce(
      (sum: number, p: { amount_pence: number }) => sum + p.amount_pence,
      0,
    );

    // Conversion rate (paid+ / total)
    const paidStatuses = ["paid", "processing", "completed"];
    const paidCount = paidStatuses.reduce((sum, s) => sum + (byStatus[s] || 0), 0);
    const conversionRate = totalApplications && totalApplications > 0
      ? paidCount / totalApplications
      : 0;

    // Recent applications (last 20)
    const { data: recentApplications } = await serviceClient
      .from("applications")
      .select(`
        id,
        status,
        total_pence,
        paid_at,
        created_at,
        leads!inner (
          first_name,
          last_name
        )
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

    return new Response(
      JSON.stringify({
        total_applications: totalApplications || 0,
        by_status: byStatus,
        revenue_pence: revenuePence,
        conversion_rate: Math.round(conversionRate * 10000) / 10000, // 4 decimal places
        recent_applications: recentApplications || [],
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
