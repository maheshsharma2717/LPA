import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const donorId = searchParams.get('donorId');
        const lpaDocId = searchParams.get('lpaDocId');

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        if (lpaDocId) {
            const { data, error } = await db
                .from('lpa_documents')
                .select(`
          *,
          lpa_document_attorneys (*, attorneys(*)),
          lpa_document_applicants (*, attorneys(*)),
          people_to_notify (*),
          certificate_providers (*)
        `)
                .eq('id', lpaDocId)
                .is('deleted_at', null)
                .single();

            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
            return NextResponse.json({ data });
        }

        if (!donorId) {
            return NextResponse.json({ error: 'Donor ID or LPA Doc ID is required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('lpa_documents')
            .select('*')
            .eq('donor_id', donorId)
            .is('deleted_at', null);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
            .from('lpa_documents')
            .insert(body)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, ...updateData } = await request.json();
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        const { data, error } = await db
            .from('lpa_documents')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
