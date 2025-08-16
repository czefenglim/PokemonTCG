// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthOptions, getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { merchandise: true }, // to get merchandise info
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
