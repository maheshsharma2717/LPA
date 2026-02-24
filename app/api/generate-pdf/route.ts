import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { lpa_document_id } = await request.json();
        if (!lpa_document_id) {
            return NextResponse.json({ error: 'lpa_document_id is required' }, { status: 400 });
        }


        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        const { data: lpaDoc, error: lpaError } = await db
            .from('lpa_documents')
            .select(`
        *,
        donors!inner (
          *,
          applications!inner (
            id,
            lead_id,
            status
          )
        )
      `)
            .eq('id', lpa_document_id)
            .is('deleted_at', null)
            .single();

        if (lpaError || !lpaDoc) {
            return NextResponse.json({ error: 'LPA document not found' }, { status: 404 });
        }

        const donor = lpaDoc.donors as { applications: unknown };
        const application = donor.applications as { id: string };


        const { data: docAttorneys } = await db
            .from('lpa_document_attorneys')
            .select('role, sort_order, attorneys!inner (*)')
            .eq('lpa_document_id', lpa_document_id)
            .is('deleted_at', null)
            .order('sort_order');

        const { data: applicants } = await db
            .from('lpa_document_applicants')
            .select('applicant_role, attorney_id, attorneys (*)')
            .eq('lpa_document_id', lpa_document_id);

        const { data: peopleToNotify } = await db
            .from('people_to_notify')
            .select('*')
            .eq('lpa_document_id', lpa_document_id)
            .is('deleted_at', null);

        const { data: certProvider } = await db
            .from('certificate_providers')
            .select('*')
            .eq('lpa_document_id', lpa_document_id)
            .is('deleted_at', null)
            .maybeSingle();

        const pdfData = {
            lpa_type: lpaDoc.lpa_type,
            donor,
            attorneys: {
                primary: (docAttorneys || []).filter((a: { role: string; attorneys: unknown }) => a.role === 'primary').map((a: { attorneys: unknown }) => a.attorneys),
                replacement: (docAttorneys || []).filter((a: { role: string; attorneys: unknown }) => a.role === 'replacement').map((a: { attorneys: unknown }) => a.attorneys),
            },
            applicants: applicants || [],
            people_to_notify: peopleToNotify || [],
            certificate_provider: certProvider,
        };

        const pdfContent = new TextEncoder().encode(JSON.stringify(pdfData, null, 2));

        const storagePath = `${application.id}/${lpa_document_id}/${lpaDoc.lpa_type}.pdf`;
        const { error: uploadError } = await db.storage
            .from('lpa-pdfs')
            .upload(storagePath, pdfContent, {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (uploadError) {
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        await db
            .from('lpa_documents')
            .update({
                pdf_storage_path: storagePath,
                status: 'pdf_generated',
            })
            .eq('id', lpa_document_id);

        const { data: signedUrl } = await db.storage
            .from('lpa-pdfs')
            .createSignedUrl(storagePath, 3600);

        return NextResponse.json({
            pdf_url: signedUrl?.signedUrl,
            storage_path: storagePath,
        });
    } catch (error: unknown) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
