import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const all = await prisma.merchandise.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(all);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const created = await prisma.merchandise.create({
      data: {
        name: String(body.name),
        price: parseFloat(body.price),
        quantity: parseInt(body.quantity),
        active: Boolean(body.active),
        imageUrl: body.imageUrl || undefined,
        description: body.description || undefined,
      },
    });

    return NextResponse.json(created);
  } catch (err) {
    console.error('Merchandise POST error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
