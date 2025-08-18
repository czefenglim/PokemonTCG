import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, productId, quantity, location, phoneNumber, total } = body;

    // 1️⃣ Fetch product from DB
    const product = await prisma.merchandise.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return new NextResponse('Product not found', { status: 404 });
    }

    // 2️⃣ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: { name: product.name },
            unit_amount: Math.round(product.price * 100), // Convert to cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:3000/user/success?total=${total.toFixed(
        2
      )}`,
      cancel_url: 'http://localhost:3000/user/cancel',
      metadata: {
        purchaseType: 'product',
        userId,
        productId,
        quantity: quantity.toString(),
        location,
        phoneNumber,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating checkout session', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
