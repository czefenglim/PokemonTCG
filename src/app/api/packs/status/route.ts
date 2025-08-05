import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 404,
    });
  }

  console.log('📊 Pack Status Debug:');
  console.log(
    'DB nextPackAt (already Malaysia):',
    user.nextPackAt.toLocaleString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
    })
  );

  // user.nextPackAt is already Malaysia time, just return the timestamp
  return new Response(
    JSON.stringify({
      nextPackAt: user.nextPackAt.getTime(), // Already Malaysia time
      gems: user.gems,
    }),
    { status: 200 }
  );
}
