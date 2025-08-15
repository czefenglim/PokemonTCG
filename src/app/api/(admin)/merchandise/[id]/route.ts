import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const updated = await prisma.merchandise.update({
      where: { id: params.id },
      data: {
        name: String(body.name),
        price: parseFloat(body.price),
        quantity: parseInt(body.quantity),
        active: Boolean(body.active),
        imageUrl: body.imageUrl || undefined,
        description: body.description || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Merchandise PUT error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.merchandise.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Merchandise DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
