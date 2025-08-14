import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, userId, userAddress, cards } = body;

    if (!name || !userId || !Array.isArray(cards) || cards.length !== 10) {
      return NextResponse.json(
        {
          error:
            "Invalid deck data: name, userId, or exactly 10 cards required",
        },
        { status: 400 }
      );
    }

    const newDeck = await prisma.deck.create({
      data: {
        name,
        userId,
        userAddress,
        cards: {
          create: cards.map((card: any) => ({
            tokenId: card.tokenId,
            name: card.name,
            imageUrl: card.imageUrl,
            rarity: card.rarity,
            type: card.type,
          })),
        },
      },
      include: { cards: true },
    });

    return NextResponse.json(
      { message: "Deck created", deck: newDeck },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/decks error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
