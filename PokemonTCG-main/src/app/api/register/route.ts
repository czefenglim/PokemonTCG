import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, username } = body;

  // Validate
  if (!email || !password || !username) {
    return new Response(
      JSON.stringify({ error: 'Email, password, and username are required.' }),
      { status: 400 }
    );
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Email is already registered.' }),
      { status: 400 }
    );
  }

  // Hash the password
  const hashed = await bcrypt.hash(password, 10);

  // Create user
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      username,
    },
  });

  return new Response(
    JSON.stringify({ message: 'User created successfully.' }),
    { status: 201 }
  );
}
