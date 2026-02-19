import { NextResponse } from 'next/server';
import { getServerSupabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { userId, firstName, lastName, preferredName } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

        // Use admin if available (bypasses RLS), otherwise use token-based client (respects RLS)
        const db = supabaseAdmin || getServerSupabase(token);

        if (!db) {
            return NextResponse.json({ error: 'Database client not configured.' }, { status: 500 });
        }

        const { data, error } = await db
            .from('leads')
            .insert({
                id: userId,
                first_name: firstName,
                last_name: lastName || 'Unknown',
                preferred_name: preferredName,
            })
            .select()
            .single();

        if (error) {
            console.error('Database insertion error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Registration API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
