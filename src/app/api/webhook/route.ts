import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const rawBody = await req.arrayBuffer();
  const sig = headers().get('stripe-signature');

  console.log('🔔 Webhook received');
  console.log('🔐 Signature header:', sig);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the checkout session
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('📦 Session object:', session);

    const userId = session.metadata?.userId;
    const priceId = session.metadata?.priceId;

    console.log('👤 userId:', userId);
    console.log('💳 priceId:', priceId);

    if (!userId || !priceId) {
      console.error('❌ Missing metadata in Stripe session');
      return new Response('Missing metadata', { status: 400 });
    }

    try {
      const gemPackage = await prisma.gemPackage.findUnique({
        where: { stripeId: priceId },
      });

      if (!gemPackage) {
        console.error('❌ Gem package not found');
        return new Response('Gem package not found', { status: 404 });
      }

      console.log(`🎁 Found gem package: ${gemPackage.amount} gems`);

      await prisma.gemPurchase.create({
        data: {
          userId,
          packageId: gemPackage.id,
          amount: gemPackage.amount,
          priceCents: gemPackage.priceCents,
          currency: gemPackage.currency,
          stripeId: session.payment_intent?.toString(),
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          gems: { increment: gemPackage.amount },
        },
      });

      console.log(`✅ Gems added: ${gemPackage.amount} to user ${userId}`);
    } catch (err: any) {
      console.error('❌ Error processing webhook logic:', err);
      return new Response('Internal server error', { status: 500 });
    }
  }

  return new Response('Webhook received', { status: 200 });
}
