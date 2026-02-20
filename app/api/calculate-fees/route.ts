import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

const OUR_FEE_PER_LPA_PENCE = 9900;
const OPG_FEE_FULL_PENCE = 8200;
const OPG_FEE_REDUCED_PENCE = 4100;
const OPG_FEE_EXEMPT_PENCE = 0;

function calculateOpgFee(tier: string): number {
    switch (tier) {
        case 'exempt': return OPG_FEE_EXEMPT_PENCE;
        case 'reduced': return OPG_FEE_REDUCED_PENCE;
        default: return OPG_FEE_FULL_PENCE;
    }
}

export async function POST(request: Request) {
    try {
        const { application_id } = await request.json();
        if (!application_id) {
            return NextResponse.json({ error: 'application_id is required' }, { status: 400 });
        }


        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
        const db = getServerSupabase(token);

        const { data: lpaDocuments, error: lpaError } = await db
            .from('lpa_documents')
            .select(`
        id,
        lpa_type,
        donor_id,
        donors!inner (
          id,
          first_name,
          last_name,
          application_id
        )
      `)
            .eq('donors.application_id', application_id)
            .is('deleted_at', null);

        if (lpaError) return NextResponse.json({ error: lpaError.message }, { status: 500 });

        const donorIds = [...new Set((lpaDocuments || []).map((ld: any) => ld.donor_id))];
        const { data: assessments } = await db
            .from('benefits_assessments')
            .select('donor_id, calculated_fee_tier')
            .in('donor_id', donorIds);

        const tierByDonor: Record<string, string> = {};
        for (const a of assessments || []) {
            tierByDonor[a.donor_id] = a.calculated_fee_tier;
        }

        const breakdown = [];
        let totalOurFee = 0;
        let totalOpgFee = 0;

        for (const doc of lpaDocuments || []) {
            const donor = doc.donors as any;
            const tier = tierByDonor[doc.donor_id] || 'full';
            const opgFee = calculateOpgFee(tier);

            breakdown.push({
                lpa_document_id: doc.id,
                donor_id: doc.donor_id,
                donor_name: `${donor.first_name} ${donor.last_name}`,
                lpa_type: doc.lpa_type,
                our_fee_pence: OUR_FEE_PER_LPA_PENCE,
                opg_fee_tier: tier,
                opg_fee_pence: opgFee,
            });

            totalOurFee += OUR_FEE_PER_LPA_PENCE;
            totalOpgFee += opgFee;
        }

        return NextResponse.json({
            our_fee_pence: totalOurFee,
            opg_fee_pence: totalOpgFee,
            total_pence: totalOurFee + totalOpgFee,
            breakdown,
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
