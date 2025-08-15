// used in /battle/room/[id]/page.tsx
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: Request) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 });
  }

  try {
    const decks = await prisma.deck.findMany({
      where: { userId },
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

    return NextResponse.json(decks);
  } catch (error) {
    console.error("Error fetching decks:", error);
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}
