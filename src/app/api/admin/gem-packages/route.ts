import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/gem-packages
 * Returns a sorted list of all gem packages.
 * Access restricted to ADMIN users only.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated and has admin privileges
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Fetch all gem packages ordered by amount ascending
  const packages = await prisma.gemPackage.findMany({
    orderBy: { amount: 'asc' },
  });

  return NextResponse.json(packages);
}

/**
 * POST /api/admin/gem-packages
 * Creates a new gem package.
 * Access restricted to ADMIN users only.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await req.json();

    const created = await prisma.gemPackage.create({ data });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    // Handle duplicate stripeId
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      error.meta?.target?.includes('stripeId')
    ) {
      return NextResponse.json(
        { error: 'Stripe ID must be unique' },
        { status: 400 }
      );
    }

    console.error('POST /gem-packages error:', error);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/gem-packages
 * Updates an existing gem package by ID.
 * Expects `id` and update fields in the request body.
 * Access restricted to ADMIN users only.
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { id, ...rest } = data;

    const updated = await prisma.gemPackage.update({
      where: { id },
      data: rest,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    // Handle duplicate stripeId on update
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      error.meta?.target?.includes('stripeId')
    ) {
      return NextResponse.json(
        { error: 'Stripe ID must be unique' },
        { status: 400 }
      );
    }

    console.error('PUT /gem-packages error:', error);
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/gem-packages
 * Deletes a gem package by its ID (provided in search params).
 * Access restricted to ADMIN users only.
 */
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
    await prisma.gemPackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json(
      { error: 'Failed to delete package' },
      { status: 500 }
    );
  }
}
