// /app/api/pve/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCurrentUser } from '@/lib/auth/auth-compat';

export async function GET(req: NextRequest) {
  try {
    console.log('=== DEBUG: GET /api/pve/progress ===');

    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get('difficulty') as
      | 'EASY'
      | 'MEDIUM'
      | 'HARD';

    if (!difficulty || !['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      return NextResponse.json(
        { error: 'Invalid or missing difficulty parameter' },
        { status: 400 }
      );
    }

    // Use your existing auth system
    const user = await getCurrentUser(req);
    console.log('Authenticated user:', user);

    // Return default progress if no user found
    if (!user) {
      return NextResponse.json({
        id: 'default',
        userId: 'default',
        difficulty,
        unlockedIds: [],
        wins: 0,
        losses: 0,
        lastClearedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Get or create user's progress for this difficulty
    let progress = await prisma.pveProgress.findFirst({
      where: {
        userId: user.id,
        difficulty,
      },
    });

    if (!progress) {
      // Create default progress record
      progress = await prisma.pveProgress.create({
        data: {
          userId: user.id,
          difficulty,
          unlockedIds: JSON.stringify([]),
          wins: 0,
          losses: 0,
        },
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('GET /api/pve/progress error:', error);
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
