import { NextResponse } from 'next/server';
import { getServerSupabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        const { data: leads, error: leadError } = await db
            .from('leads')
            .select('*')
            .eq('id', userId)
            .limit(1);

        const leadData = leads?.[0];

        if (leadError && leadError.code !== 'PGRST116') {
            console.error('Error fetching lead:', leadError);
            return NextResponse.json({ error: leadError.message }, { status: 500 });
        }

        const { data: appsData, error: appsError } = await db
            .from('applications')
            .select('*')
            .eq('lead_id', userId)
            .is('deleted_at', null);

        console.log(`Leads API Debug [${userId}]:`, {
            leadFound: !!leadData,
            appsCount: appsData?.length || 0,
            leadError,
            appsError
        });

        if (appsError) {
            console.error('Error fetching applications:', appsError);
            return NextResponse.json({ error: appsError.message }, { status: 500 });
        }

        return NextResponse.json({
            lead: leadData,
            applications: appsData || [],
        });
    } catch (error: unknown) {
        console.error('Leads GET API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { userId, ...updateData } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        console.log('PATCH /api/leads hit...', { hasToken: !!token });


        const db = supabaseAdmin || getServerSupabase(token);

        if (!db) {
            console.error('CRITICAL: db client not initialized');
            return NextResponse.json({ error: 'Database client not configured. [ERR_DB_NULL]' }, { status: 500 });
        }

        const { data: leads, error: error } = await db
            .from('leads')
            .upsert({
                id: userId,
                ...updateData
            })
            .select()
            .limit(1);

        const data = leads?.[0];

        if (error) {
            console.error('Error updating lead:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Lead not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error: unknown) {
        console.error('Leads PATCH API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
