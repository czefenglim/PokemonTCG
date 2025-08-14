// src/app/api/admin/gem-purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Prisma singleton (safer in dev/HMR)
const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ---- GET ----
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isStatsRequest = searchParams.get('stats') === 'true';
    if (isStatsRequest) {
      return await handleStatsRequest(searchParams);
    } else {
      return await handleTransactionsRequest(searchParams);
    }
  } catch (error) {
    console.error('Error in gem purchases API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// ---- Helpers: list + stats ----
async function handleTransactionsRequest(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const validatedPage = Math.max(1, page);
  const validatedLimit = Math.min(Math.max(1, limit), 100);

  const where: any = {};

  // Search filter - search in transaction ID, stripe ID, username, or user email
  if (search && search.trim()) {
    const term = search.trim();
    const or: any[] = [
      { id: { contains: term, mode: 'insensitive' } },
      { stripeId: { contains: term, mode: 'insensitive' } },
      { user: { is: { username: { contains: term, mode: 'insensitive' } } } },
      { user: { is: { email: { contains: term, mode: 'insensitive' } } } },
    ];
    // optional: allow numeric searches to hit amount/price
    const n = Number(term);
    if (!Number.isNaN(n)) or.push({ amount: n }, { priceCents: n });

    where.OR = or;
  }

  if (status && status !== 'ALL') {
    const validStatuses = [
      'PENDING',
      'COMPLETED',
      'FAILED',
      'REFUNDED',
      'CANCELLED',
    ];
    if (validStatuses.includes(status)) {
      where.status = status;
    }
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start.getTime())) where.createdAt.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate + 'T23:59:59.999Z');
      if (!isNaN(end.getTime())) where.createdAt.lte = end;
    }
  }

  const skip = (validatedPage - 1) * validatedLimit;
  const allowedSortFields = [
    'createdAt',
    'priceCents',
    'status',
    'amount',
    'completedAt',
  ];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderBy: any = { [validSortBy]: sortOrder };

  const [transactions, totalCount] = await Promise.all([
    prisma.gemPurchase.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true } },
        package: {
          select: {
            id: true,
            amount: true,
            priceCents: true,
            currency: true,
            stripeId: true,
            badge: true,
            popular: true,
            active: true,
            discountPercentage: true,
            createdAt: true,
          },
        },
      },
      orderBy,
      skip,
      take: validatedLimit,
    }),
    prisma.gemPurchase.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / validatedLimit);

  return NextResponse.json(
    {
      success: true,
      transactions,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: totalCount,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
      filters: {
        search: search || null,
        status: status !== 'ALL' ? status : null,
        startDate: startDate || null,
        endDate: endDate || null,
        sortBy: validSortBy,
        sortOrder,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

async function handleStatsRequest(searchParams: URLSearchParams) {
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
  }
  if (status && status !== 'ALL') where.status = status;

  const [
    totalTransactions,
    completedTransactions,
    pendingTransactions,
    failedTransactions,
    refundedTransactions,
    cancelledTransactions,
    totalRevenue,
  ] = await Promise.all([
    prisma.gemPurchase.count({ where }),
    prisma.gemPurchase.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.gemPurchase.count({ where: { ...where, status: 'PENDING' } }),
    prisma.gemPurchase.count({ where: { ...where, status: 'FAILED' } }),
    prisma.gemPurchase.count({ where: { ...where, status: 'REFUNDED' } }),
    prisma.gemPurchase.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.gemPurchase.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { priceCents: true },
    }),
  ]);

  return NextResponse.json(
    {
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      refundedTransactions,
      cancelledTransactions,
      totalRevenue: totalRevenue._sum.priceCents || 0,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}

// ---- POST (create) ----
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      packageId,
      amount,
      priceCents,
      currency = 'USD',
      stripeId,
    } = body;

    if (!userId || !packageId || !amount || !priceCents) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: userId, packageId, amount, priceCents',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );

    const gemPackage = await prisma.gemPackage.findUnique({
      where: { id: packageId },
    });
    if (!gemPackage)
      return NextResponse.json(
        { success: false, error: 'Package not found' },
        { status: 404 }
      );
    if (!gemPackage.active) {
      return NextResponse.json(
        { success: false, error: 'Package is not active' },
        { status: 400 }
      );
    }

    const newPurchase = await prisma.gemPurchase.create({
      data: {
        userId,
        packageId,
        amount,
        priceCents,
        currency,
        stripeId,
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
        package: {
          select: {
            id: true,
            amount: true,
            priceCents: true,
            currency: true,
            badge: true,
            popular: true,
            active: true,
            discountPercentage: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        transaction: newPurchase,
        message: 'Transaction created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating gem purchase:', error);
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDevelopment
          ? `Database error: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          : 'Failed to create transaction',
      },
      { status: 500 }
    );
  }
}

// ---- PATCH (update) ----
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, stripeId } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, status' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'PENDING',
      'COMPLETED',
      'FAILED',
      'REFUNDED',
      'CANCELLED',
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const existingTransaction = await prisma.gemPurchase.findUnique({
      where: { id },
      include: { user: true, package: true },
    });
    if (!existingTransaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const updateData: any = { status, ...(stripeId && { stripeId }) };
    if (status === 'COMPLETED' && existingTransaction.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedTransaction = await prisma.gemPurchase.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, username: true, email: true } },
        package: {
          select: {
            id: true,
            amount: true,
            priceCents: true,
            currency: true,
            badge: true,
            popular: true,
            active: true,
            discountPercentage: true,
          },
        },
      },
    });

    if (status === 'COMPLETED' && existingTransaction.status !== 'COMPLETED') {
      await prisma.user.update({
        where: { id: updatedTransaction.userId },
        data: { gems: { increment: updatedTransaction.amount } },
      });
    }

    if (existingTransaction.status === 'COMPLETED' && status !== 'COMPLETED') {
      const user = await prisma.user.findUnique({
        where: { id: updatedTransaction.userId },
        select: { gems: true },
      });
      if (user && user.gems >= updatedTransaction.amount) {
        await prisma.user.update({
          where: { id: updatedTransaction.userId },
          data: { gems: { decrement: updatedTransaction.amount } },
        });
      } else {
        console.warn(
          `User ${updatedTransaction.userId} doesn't have enough gems to subtract for transaction ${id}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Error updating gem purchase:', error);
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        success: false,
        error: isDevelopment
          ? `Database error: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          : 'Failed to update transaction',
      },
      { status: 500 }
    );
  }
}
