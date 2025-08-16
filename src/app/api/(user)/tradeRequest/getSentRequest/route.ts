import { NextResponse } from 'next/server';
import { AuthOptions, getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient();
  try {
    const session = await getServerSession(authOptions as AuthOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sentRequests = await prisma.tradeRequest.findMany({
      where: {
        senderId: session.user.id,
      },
      include: {
        receiver: {
          select: { username: true, email: true, walletAddress: true }, // adjust based on your User model
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sentRequests);
  } catch (error) {
    console.error('Error fetching sent trade requests:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
