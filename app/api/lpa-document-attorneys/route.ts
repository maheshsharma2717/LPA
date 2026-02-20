import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const lpaDocId = searchParams.get('lpaDocId');

        if (!lpaDocId) {
            return NextResponse.json({ error: 'LPA Document ID is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        const { data, error } = await db
            .from('lpa_document_attorneys')
            .select('*, attorneys(*)')
            .eq('lpa_document_id', lpaDocId);

        if (error) {
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
            .from('lpa_document_attorneys')
            .insert(body)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const lpaDocId = searchParams.get('lpaDocId');
        const attorneyId = searchParams.get('attorneyId');

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        if (id) {
            const { error } = await db
                .from('lpa_document_attorneys')
                .delete()
                .eq('id', id);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else if (lpaDocId && attorneyId) {
            const { error } = await db
                .from('lpa_document_attorneys')
                .delete()
                .eq('lpa_document_id', lpaDocId)
                .eq('attorney_id', attorneyId);
            if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ error: 'ID or lpaDocId+attorneyId required' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
