import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const { data: leadData, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', userId)
            .single();

        if (leadError && leadError.code !== 'PGRST116') {
            console.error('Error fetching lead:', leadError);
            return NextResponse.json({ error: leadError.message }, { status: 500 });
        }

        const { data: appsData, error: appsError } = await supabase
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
    } catch (error: any) {
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

        const { data, error } = await supabase
            .from('leads')
            .upsert({
                id: userId,
                ...updateData
            })
            .select()
            .maybeSingle();

        if (error) {
            console.error('Error updating lead:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Leads PATCH API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
