import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        if (!sig) {
            return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
        }

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } catch (err: any) {
            console.error('Webhook signature verification failed:', err.message);
            return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const applicationId = session.metadata?.application_id;

                if (!applicationId) {
                    console.error('No application_id in session metadata');
                    return NextResponse.json({ error: 'No application_id in metadata' }, { status: 400 });
                }

                // Insert payment record
                await supabase
                    .from('payments')
                    .upsert({
                        application_id: applicationId,
                        stripe_checkout_session_id: session.id,
                        stripe_payment_intent_id: session.payment_intent as string,
                        amount_pence: session.amount_total || 0,
                        status: 'succeeded',
                        stripe_event_data: event.data.object as any,
                        paid_at: new Date().toISOString(),
                    }, { onConflict: 'stripe_checkout_session_id' });

                // Update application status
                await supabase
                    .from('applications')
                    .update({
                        status: 'paid',
                        stripe_payment_intent_id: session.payment_intent as string,
                        paid_at: new Date().toISOString(),
                    })
                    .eq('id', applicationId);

                break;
            }
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await supabase
                    .from('payments')
                    .update({ status: 'failed' })
                    .eq('stripe_payment_intent_id', paymentIntent.id);
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
