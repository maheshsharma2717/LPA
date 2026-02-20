import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

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

        const { data: app, error: appError } = await db
            .from('applications')
            .select('id, lead_id, status')
            .eq('id', application_id)
            .is('deleted_at', null)
            .single();

        if (appError || !app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        if (app.status !== 'complete') {
            return NextResponse.json({ error: "Application must be in 'complete' status before payment" }, { status: 400 });
        }

        const { data: lpaDocuments, error: lpaError } = await db
            .from('lpa_documents')
            .select(`
        id,
        lpa_type,
        status,
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

        const incompleteDocs = (lpaDocuments || []).filter((d: any) => d.status !== 'complete');
        if (incompleteDocs.length > 0) {
            return NextResponse.json({
                error: 'All LPA documents must be complete before payment',
                incomplete_ids: incompleteDocs.map((d: any) => d.id),
            }, { status: 400 });
        }

        const donorIds = [...new Set((lpaDocuments || []).map((ld: any) => ld.donor_id))];
        const { data: assessments } = await db
            .from('benefits_assessments')
            .select('donor_id, calculated_fee_tier')
            .in('donor_id', donorIds);

        const tierByDonor: Record<string, string> = {};
        for (const a of assessments || []) {
            tierByDonor[a.donor_id] = a.calculated_fee_tier;
        }

        let totalOurFee = 0;
        let totalOpgFee = 0;
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

        for (const doc of lpaDocuments || []) {
            const donor = doc.donors as any;
            const tier = tierByDonor[doc.donor_id] || 'full';
            const opgFee = calculateOpgFee(tier);
            const lpaTypeLabel = doc.lpa_type === 'health_and_welfare' ? 'Health & Welfare' : 'Property & Finance';

            totalOurFee += OUR_FEE_PER_LPA_PENCE;
            totalOpgFee += opgFee;

            lineItems.push({
                price_data: {
                    currency: 'gbp',
                    product_data: {
                        name: `LPA Service Fee - ${lpaTypeLabel}`,
                        description: `${donor.first_name} ${donor.last_name}`,
                    },
                    unit_amount: OUR_FEE_PER_LPA_PENCE,
                },
                quantity: 1,
            });

            if (opgFee > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: `OPG Registration Fee - ${lpaTypeLabel}`,
                            description: `${donor.first_name} ${donor.last_name} (${tier === 'reduced' ? 'Reduced' : 'Full'})`,
                        },
                        unit_amount: opgFee,
                    },
                    quantity: 1,
                });
            }
        }

        const totalPence = totalOurFee + totalOpgFee;

        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: lineItems,
            metadata: { application_id },
            success_url: `${siteUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/payment/cancel?application_id=${application_id}`,
        });

        await db
            .from('applications')
            .update({
                stripe_checkout_session_id: session.id,
                our_fee_pence: totalOurFee,
                opg_fee_pence: totalOpgFee,
                total_pence: totalPence,
                payment_method: 'card',
            })
            .eq('id', application_id);

        for (const doc of lpaDocuments || []) {
            const tier = tierByDonor[doc.donor_id] || 'full';
            const opgFee = calculateOpgFee(tier);
            await db
                .from('lpa_documents')
                .update({ opg_fee_tier: tier, opg_fee_pence: opgFee })
                .eq('id', doc.id);
        }

        return NextResponse.json({
            checkout_url: session.url,
            session_id: session.id,
        });
    } catch (error: any) {
        console.error('Create checkout error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
