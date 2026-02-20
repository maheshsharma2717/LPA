import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { lpa_document_id } = await request.json();
        if (!lpa_document_id) {
            return NextResponse.json({ error: 'lpa_document_id is required' }, { status: 400 });
        }

        const { data: lpaDoc, error: lpaError } = await supabase
            .from('lpa_documents')
            .select('id, status, pdf_storage_path, lpa_type')
            .eq('id', lpa_document_id)
            .is('deleted_at', null)
            .single();

        if (lpaError || !lpaDoc) {
            return NextResponse.json({ error: 'LPA document not found' }, { status: 404 });
        }

        if (lpaDoc.status !== 'pdf_generated') {
            return NextResponse.json({ error: `LPA document must have status 'pdf_generated'. Current status: '${lpaDoc.status}'` }, { status: 400 });
        }

        if (!lpaDoc.pdf_storage_path) {
            return NextResponse.json({ error: 'No PDF file found for this LPA document' }, { status: 400 });
        }

        const postalReference = `SIM-${Date.now()}-${lpa_document_id.substring(0, 8)}`;
        const postalStatus = 'submitted';

        await supabase
            .from('lpa_documents')
            .update({
                postal_reference: postalReference,
                postal_status: postalStatus,
                postal_submitted_at: new Date().toISOString(),
                status: 'sent_to_post',
            })
            .eq('id', lpa_document_id);

        return NextResponse.json({
            postal_reference: postalReference,
            status: postalStatus,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
