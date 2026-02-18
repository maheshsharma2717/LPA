import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('lead_id', userId)
            .is('deleted_at', null);

        if (error) {
            console.error('Error fetching applications:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Applications GET API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, ...applicationData } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('applications')
            .insert({
                ...applicationData,
                lead_id: userId,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating application:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Applications POST API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, ...updateData } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('applications')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating application:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Applications PATCH API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
