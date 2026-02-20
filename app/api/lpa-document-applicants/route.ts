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
            .from('lpa_document_applicants')
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
            .from('lpa_document_applicants')
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
        const lpaDocId = searchParams.get('lpaDocId');

        if (!lpaDocId) {
            return NextResponse.json({ error: 'LPA Document ID is required' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        // Delete all applicants for this LPA document (delete-and-recreate pattern)
        const { error } = await db
            .from('lpa_document_applicants')
            .delete()
            .eq('lpa_document_id', lpaDocId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
