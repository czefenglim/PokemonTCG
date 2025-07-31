import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { authOptions } from '@/lib/auth'; // adjust path as needed
import { getServerSession } from 'next-auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions); // ✅ get logged-in user

  if (!session || !session.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // ✅ GET BOTH priceId AND gemAmount from request
  const { priceId, gemAmount } = await req.json();

  try {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      // ✅ ADD gemAmount to success URL as parameter
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/buy-gems?success=1&amount=${gemAmount}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/user/buy-gems?canceled=1`,
      metadata: {
        userId: session.user.id,
        priceId: priceId,
        // ✅ ALSO store in metadata for webhooks/records
        gemAmount: gemAmount?.toString() || '0', // Convert to string for metadata
      },
    });

    return NextResponse.json({ url: stripeSession.url });
  } catch (err) {
    console.error('❌ Stripe error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
