import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Create Malaysia time by manually adding 8 hours to UTC
const createMalaysiaTime = () => {
  const utcNow = new Date(); // This gets UTC time
  const malaysiaTime = new Date(utcNow.getTime() + 8 * 60 * 60 * 1000); // Add 8 hours
  return malaysiaTime;
};

export async function POST(req: Request) {
  // Ensure content-type is JSON
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Invalid content type' }), {
      status: 400,
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON format' }), {
      status: 400,
    });
  }

  const { email, password, username, walletAddress, profilePicture, country } =
    body;

  if (!email || !password || !username || !profilePicture || !country) {
    return new Response(
      JSON.stringify({
        error: 'Email, password, username, and wallet address are required.',
      }),
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Email is already registered.' }),
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  // Force Malaysia time for both timestamps
  const malaysiaTime = createMalaysiaTime();

  console.log('🇲🇾 Registration Time Debug:');
  console.log('UTC Now:', new Date().toISOString());
  console.log('Malaysia Time (UTC+8):', malaysiaTime.toISOString());
  console.log(
    'Malaysia Time Display:',
    malaysiaTime.toLocaleString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
    })
  );

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      username,
      gems: 100,
      createdAt: malaysiaTime, // ← Malaysia time for registration
      nextPackAt: malaysiaTime, // ← Malaysia time for pack availability
      role: 'USER',
      walletAddress, // ✅ Include this if available
      profilePicture, // ← Add this line
      country, // ← And this
    },
  });

  console.log(
    '✅ User created with Malaysia time for both createdAt and nextPackAt'
  );

  return new Response(
    JSON.stringify({ message: 'User created successfully.' }),
    { status: 201 }
  );
}
