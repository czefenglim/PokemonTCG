import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { headers as nextHeaders } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // updated to match expected type
});

export async function POST(req: Request) {
  // 1) Verify signature with raw body
  const rawBody = await req.text();
  const hdrs = await nextHeaders(); // App Router: must await
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

  // 2) Only credit on checkout.session.completed (ignore payment_intent.*, charge.*)
  if (event.type !== 'checkout.session.completed') {
    console.log('ℹ️ Ignoring event type:', event.type);
    return new Response('ok (ignored)', { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  console.log('🧾 Session ID:', session.id);
  console.log('🔎 Metadata:', session.metadata);

  // 3) Determine purchase type (default to "gems" if not set)
  const purchaseType = session.metadata?.purchaseType ?? 'gems';

  // ---- GEM PURCHASE PREP ---------------------------------------------------
  let userId: string | null = session.metadata?.userId ?? null;
  let priceId: string | null = session.metadata?.priceId ?? null;

  // Fallback: fetch expanded line_items to get priceId, if missing
  if (purchaseType === 'gems' && !priceId) {
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

  // Basic validations per type
  if (!userId) {
    console.error('❌ Missing userId in metadata; cannot process.');
    return new Response('Missing userId', { status: 400 });
  }
  if (purchaseType === 'gems' && !priceId) {
    console.error(
      '❌ Missing priceId (metadata or line_items); cannot map package.'
    );
    return new Response('Missing priceId', { status: 400 });
  }

  // 4) Idempotent DB work in a single transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Idempotency guard: throws on duplicate event.id (requires StripeEvent model)
      await tx.stripeEvent.create({ data: { id: event.id } });

      if (purchaseType === 'gems') {
        // Find gem package by Stripe priceId
        const pkg = await tx.gemPackage.findUnique({
          where: { stripeId: priceId! },
        });
        if (!pkg) {
          throw new Error(`Gem package not found for priceId=${priceId}`);
        }

        // Record the purchase
        await tx.gemPurchase.create({
          data: {
            userId,
            packageId: pkg.id,
            amount: pkg.amount,
            priceCents: pkg.priceCents,
            currency: pkg.currency,
            stripeId: String(session.payment_intent ?? ''), // useful for audits
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });

        // Credit gems
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { gems: { increment: pkg.amount } },
          select: { id: true, gems: true },
        });

        return {
          type: 'gems' as const,
          credited: pkg.amount,
          newBalance: updatedUser.gems,
        };
      }

      if (purchaseType === 'product') {
        const productId = session.metadata?.productId ?? null;
        const quantity = parseInt(session.metadata?.quantity || '1', 10);

        if (!productId)
          throw new Error('Missing productId for product purchase');

        // Reduce inventory
        await tx.merchandise.update({
          where: { id: productId },
          data: { quantity: { decrement: quantity } },
        });

        // Save transaction
        await tx.transaction.create({
          data: {
            merchandiseId: productId,
            quantity,
            totalAmount: (session.amount_total ?? 0) / 100, // cents -> major
            currency: session.currency?.toUpperCase() || 'USD',
            location: session.metadata?.location || '',
            phoneNumber: session.metadata?.phoneNumber || '',
            email: session.customer_email || null,
            status: 'COMPLETED',
            paymentRef: String(session.payment_intent ?? ''),
            userId,
          },
        });

        return { type: 'product' as const, credited: 0, newBalance: null };
      }

      // Unknown purchaseType: do nothing but keep idempotency row
      return { type: 'unknown' as const, credited: 0, newBalance: null };
    });

    if (result.type === 'gems') {
      console.log(
        `✅ Credited ${result.credited} gems to user ${userId}. New balance: ${result.newBalance}`
      );
    } else if (result.type === 'product') {
      console.log(
        `✅ Inventory updated and transaction recorded for user ${userId}`
      );
    } else {
      console.log(
        '⚠️ Unknown purchaseType; event recorded but no state changes.'
      );
    }

    return new Response('ok', { status: 200 });
  } catch (err: any) {
    // Duplicate event => already processed
    if (err.code === 'P2002') {
      console.warn('⚠️ Duplicate event (already processed):', event.id);
      return new Response('ok (duplicate)', { status: 200 });
    }
    console.error('❌ Webhook processing error:', err);
    return new Response('Webhook error', { status: 500 });
  }
}
