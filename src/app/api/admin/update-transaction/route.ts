import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // <-- your NextAuth config file

export async function POST(req: Request) {
  const prisma = new PrismaClient();

  try {
    // ✅ Get user session from NextAuth
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== 'ADMIN') {
      return new NextResponse('Forbidden - Admin access required', {
        status: 403,
      });
    }

    const body = await req.json();
    const { transactionId, status } = body;

    if (!transactionId || !status) {
      return new NextResponse('Transaction ID and status are required', {
        status: 400,
      });
    }

    // Validate status
    const validStatuses = ['SHIPPED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return new NextResponse('Invalid status', { status: 400 });
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        merchandise: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('[ADMIN_TRANSACTION_UPDATE]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
