// app/api/admin/gem-packages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth';
import prisma from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// ─────────────────────────────────────────────────────────────
// Validation schemas (coerce strings → numbers/bools from forms)
// ─────────────────────────────────────────────────────────────
const CreateSchema = z.object({
  amount: z.coerce.number().int().positive(),
  priceCents: z.coerce.number().int().positive(),
  currency: z.string().min(3).default('USD').optional(),
  // optional UI fields:
  badge: z.string().optional(),
  popular: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  // accept either spelling; normalize later:
  discountPercentage: z.coerce.number().int().min(0).max(100).optional(),
  discountpercentage: z.coerce.number().int().min(0).max(100).optional(),
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().int().positive().optional(),
  priceCents: z.coerce.number().int().positive().optional(),
  currency: z.string().min(3).optional(),
  badge: z.string().optional(),
  popular: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
  discountPercentage: z.coerce.number().int().min(0).max(100).optional(),
  discountpercentage: z.coerce.number().int().min(0).max(100).optional(),
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/gem-packages
// Returns all gem packages sorted by priceCents
// ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const packages = await prisma.gemPackage.findMany({
    orderBy: { priceCents: 'asc' },
  });
  return NextResponse.json(packages);
}

// ─────────────────────────────────────────────────────────────
// POST /api/admin/gem-packages
// Creates Stripe Price (+ implicit Product via product_data) and DB row
// ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const raw = await req.json();
    const p = CreateSchema.parse(raw);

    const currency = p.currency ?? 'USD';
    const discountPct = p.discountPercentage ?? p.discountpercentage ?? 0;

    // Create a Price and auto-create Product via product_data
    const price = await stripe.prices.create(
      {
        unit_amount: p.priceCents,
        currency,
        product_data: {
          name: `Gems ${p.amount}`,
          metadata: { amount: String(p.amount) },
          // images: ["https://your-cdn/gems.png"], // optional
        },
        nickname: `gem-${p.amount}`,
        metadata: { amount: String(p.amount) },
      },
      { idempotencyKey: `gem-create-${p.amount}-${p.priceCents}-${currency}` }
    );

    const created = await prisma.gemPackage.create({
      data: {
        amount: p.amount,
        priceCents: p.priceCents,
        currency,
        stripeId: price.id, // store the Stripe PRICE id
        badge: p.badge ?? null,
        popular: p.popular ?? false,
        active: p.active ?? true,
        discountPercentage: discountPct,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.flatten() },
        { status: 400 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error:
            'Duplicate violates a unique index (likely stripeId). Use a new Stripe price.',
        },
        { status: 409 }
      );
    }
    console.error('POST /gem-packages error:', error);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/gem-packages
// If priceCents changed → create NEW Stripe Price,
// reusing the same Product when possible; update DB stripeId.
// ─────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const u = UpdateSchema.parse(await req.json());

    const existing = await prisma.gemPackage.findUnique({
      where: { id: u.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Gem package not found' },
        { status: 404 }
      );
    }

    const patch: Record<string, any> = {};
    if (u.amount !== undefined) patch.amount = u.amount;
    if (u.currency !== undefined) patch.currency = u.currency;
    if (u.badge !== undefined) patch.badge = u.badge;
    if (u.popular !== undefined) patch.popular = u.popular;
    if (u.active !== undefined) patch.active = u.active;
    if (
      u.discountPercentage !== undefined ||
      u.discountpercentage !== undefined
    ) {
      patch.discountPercentage =
        u.discountPercentage ??
        u.discountpercentage ??
        existing.discountPercentage;
    }

    const priceChanged =
      u.priceCents !== undefined && u.priceCents !== existing.priceCents;

    if (!priceChanged) {
      if (u.priceCents !== undefined) patch.priceCents = u.priceCents;
      const updated = await prisma.gemPackage.update({
        where: { id: u.id },
        data: patch,
      });
      return NextResponse.json(updated);
    }

    // Price changed → create a new Price, preferably on the SAME Product
    const currency = (u.currency ?? existing.currency) || 'USD';

    let productId: string | undefined;
    try {
      const oldPrice = await stripe.prices.retrieve(existing.stripeId);
      // oldPrice.product can be string or Product object
      productId =
        typeof oldPrice.product === 'string'
          ? oldPrice.product
          : oldPrice.product?.id;
    } catch {
      productId = undefined; // fallback to product_data below
    }

    const newPrice = await stripe.prices.create(
      productId
        ? {
            unit_amount: u.priceCents!, // safe due to priceChanged check
            currency,
            product: productId, // reuse same Product
            nickname: `gem-${u.amount ?? existing.amount}`,
            metadata: {
              gemPackageId: u.id,
              amount: String(u.amount ?? existing.amount),
            },
          }
        : {
            unit_amount: u.priceCents!,
            currency,
            product_data: {
              name: `Gems ${u.amount ?? existing.amount}`,
              metadata: {
                gemPackageId: u.id,
                amount: String(u.amount ?? existing.amount),
              },
            },
            nickname: `gem-${u.amount ?? existing.amount}`,
            metadata: {
              gemPackageId: u.id,
              amount: String(u.amount ?? existing.amount),
            },
          },
      { idempotencyKey: `gem-update-${u.id}-${u.priceCents}` }
    );

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.gemPackage.update({
        where: { id: u.id },
        data: { ...patch, priceCents: u.priceCents!, stripeId: newPrice.id },
      });

      // Optional: deactivate previous price to avoid accidental reuse
      if (existing.stripeId) {
        try {
          await stripe.prices.update(existing.stripeId, { active: false });
        } catch (e) {
          console.warn(
            `Failed to deactivate old price ${existing.stripeId}:`,
            e
          );
        }
      }
      return row;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.flatten() },
        { status: 400 }
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error:
            'Duplicate violates a unique index (likely stripeId). Use a new Stripe price.',
        },
        { status: 409 }
      );
    }
    console.error('PUT /gem-packages error:', error);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/gem-packages?id=...
// Optionally deactivates its Stripe Price first
// ─────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json(
      { error: 'Package ID is required' },
      { status: 400 }
    );
  }

  try {
    const pkg = await prisma.gemPackage.findUnique({ where: { id } });
    if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (pkg.stripeId) {
      try {
        await stripe.prices.update(pkg.stripeId, { active: false });
      } catch (e) {
        console.warn(`Failed to deactivate price ${pkg.stripeId}:`, e);
      }
    }

    await prisma.gemPackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /gem-packages error:', err);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
