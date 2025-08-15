// used in websocket

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  const body = await req.json();
  const userId = req.headers.get('x-user-id');
  const { deckId } = body;

  if (!userId || !deckId) {
    return NextResponse.json(
      { error: 'Missing userId or deckId' },
      { status: 400 }
    );
  }

  try {
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId,
      },
      select: {
        id: true,
        name: true,
        cards: {
          select: {
            tokenId: true,
            name: true,
            imageUrl: true,
            rarity: true,
            type: true,
          },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error using deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deck' },
      { status: 500 }
    );
  }
}
