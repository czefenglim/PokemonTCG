import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { headers as nextHeaders } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  // 1) Verify signature with raw body
  const rawBody = await req.text();
  const hdrs = await nextHeaders();
  const sig = hdrs.get('stripe-signature');

  console.log('🔔 Webhook hit /api/gems/webhook');
  if (!sig) {
    console.error('❌ Missing stripe-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Verified event:', event.type, 'id:', event.id);
  } catch (err: any) {
    console.error('❌ Signature verification failed:', err?.message);
    return new Response(`Webhook Error: ${err?.message}`, { status: 400 });
  }

  // 2) We only credit on checkout.session.completed
  if (event.type !== 'checkout.session.completed') {
    console.log('ℹ️ Ignoring event type:', event.type);
    return new Response('ok (ignored)', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  console.log('🧾 Session ID:', session.id);

  // 3) Try to get userId/priceId from metadata first
  let userId = session.metadata?.userId ?? null;
  let priceId = session.metadata?.priceId ?? null;

  console.log('🔎 Metadata:', session.metadata);

  // 4) Fallback: fetch session with expanded line_items to derive priceId
  if (!priceId) {
    try {
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price'],
      });
      const firstItem = full.line_items?.data?.[0];
      const price = (firstItem as any)?.price;
      priceId = price?.id ?? null;
      console.log('🧩 Fallback priceId from line_items:', priceId);
    } catch (e) {
      console.error('❌ Failed to retrieve session with expand:', e);
    }
  }

  if (!userId) {
    console.error('❌ Missing userId (metadata.userId). Cannot credit.');
    return new Response('Missing userId', { status: 400 });
  }
  if (!priceId) {
    console.error(
      '❌ Missing priceId (metadata.priceId or line_items). Cannot map package.'
    );
    return new Response('Missing priceId', { status: 400 });
  }

  // 5) Idempotent credit in a transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Idempotency: record event.id once; throws if already processed
      await tx.stripeEvent.create({ data: { id: event.id } });

      const pkg = await tx.gemPackage.findUnique({
        where: { stripeId: priceId! },
      });
      if (!pkg) {
        throw new Error(`Gem package not found for priceId=${priceId}`);
      }

      await tx.gemPurchase.create({
        data: {
          userId,
          packageId: pkg.id,
          amount: pkg.amount,
          priceCents: pkg.priceCents,
          currency: pkg.currency,
          stripeId: String(session.payment_intent ?? ''),
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { gems: { increment: pkg.amount } },
        select: { id: true, gems: true },
      });

      return { credited: pkg.amount, newBalance: updatedUser.gems };
    });

    console.log(
      `✅ Credited ${result.credited} gems to user ${userId}. New balance: ${result.newBalance}`
    );
    return new Response('ok', { status: 200 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      console.warn('⚠️ Duplicate event (already processed):', event.id);
      return new Response('ok (duplicate)', { status: 200 });
    }
    console.error('❌ Webhook processing error:', err);
    return new Response('Webhook error', { status: 500 });
  }
}
