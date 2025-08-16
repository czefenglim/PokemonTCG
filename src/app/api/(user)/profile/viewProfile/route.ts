import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/(public)/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (typeof session.user.email !== 'string') {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        gems: true,
        createdAt: true,
        walletAddress: true,
        role: true,
        nextPackAt: true,
        // Include friend counts
        friends: {
          select: {
            friendId: true, // Replace 'friendId' with the correct field name from your schema
          },
        },
        friendOf: {
          select: {
            userId: true, // Replace 'userId' with the correct field name from your schema
          },
        },
        profilePicture: true,
        country: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate friend count
    const friendCount = user.friends.length;

    // Remove the arrays and add the count
    const { friends, friendOf, ...userProfile } = user;
    const profileData = {
      ...userProfile,
      friendCount,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
