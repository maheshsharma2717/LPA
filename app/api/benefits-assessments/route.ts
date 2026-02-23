import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const donorId = searchParams.get('donorId');

        if (!donorId) {
            return NextResponse.json({ error: 'Donor ID is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        const { data, error } = await db
            .from('benefits_assessments')
            .select('*')
            .eq('donor_id', donorId)
            .single();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        const { data, error } = await db
            .from('benefits_assessments')
            .upsert(body, { onConflict: 'donor_id' })
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
