import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getCurrentMalaysiaTime = () => {
  const utcNow = new Date();
  return new Date(utcNow.getTime() + 8 * 60 * 60 * 1000);
};

export async function POST(req: Request) {
  try {
    const { email, force } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found.' }), {
        status: 404,
      });
    }

    const currentMalaysiaTime = getCurrentMalaysiaTime();
    const canOpen = currentMalaysiaTime.getTime() >= user.nextPackAt.getTime();

    // Safety checks again
    if (!canOpen && !force) {
      return new Response(JSON.stringify({ error: 'Pack is not ready yet.' }), {
        status: 403,
      });
    }
    if (force && !canOpen && user.gems < 500) {
      return new Response(JSON.stringify({ error: 'Not enough gems.' }), {
        status: 403,
      });
    }

    // Calculate next pack time: now + 6 hours
    const nextPackMalaysiaTime = new Date(
      currentMalaysiaTime.getTime() + 6 * 60 * 60 * 1000
    );

    // ✅ Deduct gems & set next pack time
    await prisma.user.update({
      where: { email },
      data: {
        ...(force && !canOpen ? { gems: { decrement: 500 } } : {}),
        nextPackAt: nextPackMalaysiaTime,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { email },
      select: { gems: true, nextPackAt: true },
    });

    return new Response(
      JSON.stringify({
        updatedUserData: {
          gems: updatedUser?.gems ?? user.gems,
          nextPackAt:
            updatedUser?.nextPackAt.getTime() ?? user.nextPackAt.getTime(),
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/packs/open:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
