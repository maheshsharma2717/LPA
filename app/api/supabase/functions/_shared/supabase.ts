import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
export const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

/** Service-role client — bypasses RLS. Use for trusted server-side operations. */
export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Create a client authenticated as the requesting user (from Authorization header). */
export function createUserClient(authHeader: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
