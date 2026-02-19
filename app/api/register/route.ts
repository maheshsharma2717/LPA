import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
    try {
        const { userId, firstName, lastName, preferredName } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const { data, error } = await supabase
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
