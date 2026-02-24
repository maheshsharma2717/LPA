import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2026-01-28.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'dummy_secret';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('Missing Stripe environment variables');
        return NextResponse.json({ error: 'Internal Server Error (Misconfigured Stripe)' }, { status: 500 });
    }

    if (!supabaseAdmin) {
        console.error('supabaseAdmin is not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
        return NextResponse.json({ error: 'Internal Server Error (Admin client missing)' }, { status: 500 });
    }

    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (!sig) {
            return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            console.error('Webhook signature verification failed:', errorMessage);
            return NextResponse.json({ error: `Webhook signature verification failed: ${errorMessage}` }, { status: 400 });
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const applicationId = session.metadata?.application_id;

                if (!applicationId) {
                    console.error('No application_id in session metadata');
                    return NextResponse.json({ error: 'No application_id in metadata' }, { status: 400 });
                }

                // 1. Create payment record (idempotent)
                const { error: paymentError } = await supabaseAdmin
                    .from('payments')
                    .upsert({
                        application_id: applicationId,
                        stripe_checkout_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent as string,
                        amount_pence: session.amount_total || 0,
                        status: 'succeeded',
                        stripe_event_data: event.data.object as unknown as Record<string, unknown>,
                        paid_at: new Date().toISOString(),
                    }, { onConflict: 'stripe_checkout_session_id' });

                if (paymentError) {
                    console.error('Error creating payment record:', paymentError);
                    return NextResponse.json({ error: paymentError.message }, { status: 500 });
                }

                // 2. Update application status -> paid
                const { error: appUpdateError } = await supabaseAdmin
                    .from('applications')
                    .update({
                        status: 'paid',
                        stripe_payment_intent_id: session.payment_intent as string,
                        paid_at: new Date().toISOString(),
                    })
                    .eq('id', applicationId);

                if (appUpdateError) {
                    console.error('Error updating application status:', appUpdateError);
                    return NextResponse.json({ error: appUpdateError.message }, { status: 500 });
                }

                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                const { error: paymentUpdateError } = await supabaseAdmin
                    .from('payments')
                    .update({ status: 'failed' })
                    .eq('stripe_payment_intent_id', paymentIntent.id);

                if (paymentUpdateError) {
                    console.error('Error updating payment status on failure:', paymentUpdateError);
                    return NextResponse.json({ error: paymentUpdateError.message }, { status: 500 });
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
