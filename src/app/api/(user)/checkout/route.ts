// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
// If you like, use zod for payload validation
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Use a stable, real API version (your string "2025-07-30.basil" will fail)
  apiVersion: '2024-06-20',
});

const prisma = new PrismaClient();

// ✅ Strict input schema (prevents weird payloads)
const BodySchema = z.object({
  userId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
  // Optional contextual fields (don’t trust them for pricing!)
  location: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 0) Validate payload early
    const { userId, productId, quantity, location, phoneNumber } =
      BodySchema.parse(await req.json());

    // 1) Fetch product from DB
    const product = await prisma.merchandise.findUnique({
      where: { id: productId },
      // You can also check `active: true` if you have that field
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Optional: enforce per-product purchase limits, stock, etc.
    // if (!product.active) return NextResponse.json({ error: "Unavailable" }, { status: 400 });

    // 2) Compute server-side totals (never trust client `total`)
    //    Store money values in cents to avoid float issues.
    //    If your DB stores decimal, convert carefully:
    const unitAmountCents = Math.round(Number(product.price) * 100);
    if (!Number.isFinite(unitAmountCents) || unitAmountCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid product price' },
        { status: 400 }
      );
    }

    // 3) Derive URLs from env (don’t hardcode localhost)
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    // 4) Create Checkout Session (ephemeral pricing via price_data)
    //    This charges exactly your DB amount at request time.
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],

        line_items: [
          {
            price_data: {
              currency: product.currency ?? 'usd',
              product_data: {
                name: product.name,
                // images: product.imageUrl ? [product.imageUrl] : undefined,
                metadata: { productId: product.id },
              },
              unit_amount: unitAmountCents,
            },
            quantity,
          },
        ],

        // Show address/phone UI in Checkout instead of passing via metadata
        // (Stripe will collect and validate them for you)
        phone_number_collection: { enabled: true },
        shipping_address_collection: {
          allowed_countries: ['US', 'MY', 'SG', 'GB', 'AU'], // adjust to your needs
        },

        // Optional: automatic tax or shipping rates if you use them
        // automatic_tax: { enabled: true },
        // shipping_options: [{ shipping_rate: "shr_..." }],

        // Success/Cancel
        success_url: `${appUrl}/user/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/user/cancel`,

        // Metadata (non-authoritative business context; OK to log here)
        metadata: {
          purchaseType: 'product',
          userId,
          productId,
          quantity: String(quantity),
          location: location ?? '',
          phoneNumber: phoneNumber ?? '',
        },
      },
      // 5) Idempotency protects against accidental double-submits/retries
      {
        idempotencyKey: `checkout-${userId}-${productId}-${quantity}-${unitAmountCents}`,
      }
    );

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    // zod validation errors
    if (err?.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid payload', details: err.flatten() },
        { status: 400 }
      );
    }
    console.error('Error creating checkout session', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
