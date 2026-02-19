import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Standard client for client-side or restricted server-side use (RLS applied)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates a server-side Supabase client.
 * If a token is provided, the client will act on behalf of that user (respecting RLS).
 */
export const getServerSupabase = (token?: string) => {
    console.log('getServerSupabase called', { hasToken: !!token });
    if (!token) {
        return supabase;
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        },
        auth: {
            persistSession: false
        }
    });
};

// Admin client for server-side use only (bypasses RLS)
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
