// app/api/battle/room/complete/route.ts
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getRandomCardByRarity, simulateBattleEnd } from "@/app/lib/cardUtils";

export async function POST(request: Request) {
  try {
    const { roomId, winnerId, winnerAddress, loserAddress } =
      await request.json();

    // Validate required fields
    if (!roomId || !winnerId || !winnerAddress || !loserAddress) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the room details
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.isFinished) {
      return NextResponse.json(
        { error: "Battle already completed" },
        { status: 400 }
      );
    }

    if (!room.wagerRarity) {
      // No cards to wager, just mark as finished
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          isFinished: true,
          winnerId,
        },
      });

      return NextResponse.json({
        success: true,
        room: updatedRoom,
        message: "Battle completed with no card wager",
      });
    }

    try {
      // Get random cards from both players for the wager
      const { winnerCard, loserCard } = await simulateBattleEnd(
        winnerAddress,
        loserAddress,
        room.wagerRarity
      );

      if (!winnerCard || !loserCard) {
        throw new Error("Could not determine wagered cards");
      }

      // Update room with battle results
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          isFinished: true,
          winnerId,
          // Store the card token IDs that were wagered
          wagerCardId1:
            winnerId === room.player1Id ? null : winnerCard.tokenId.toString(),
          wagerCardId2:
            winnerId === room.player2Id ? null : loserCard.tokenId.toString(),
        },
      });

      // Here you would implement the actual NFT transfer logic
      // For now, we'll just log what should happen
      console.log(
        `Battle Result: ${winnerId} wins ${loserCard.name} (Token ID: ${loserCard.tokenId}) from the loser`
      );

      return NextResponse.json({
        success: true,
        room: updatedRoom,
        battleResult: {
          winner: winnerId,
          wagerRarity: room.wagerRarity,
          cardWon: {
            name: loserCard.name,
            tokenId: loserCard.tokenId,
            imageUrl: loserCard.imageUrl,
          },
        },
        message: `Battle completed! Winner receives ${loserCard.name}`,
      });
    } catch (cardError) {
      console.error("Error handling card wager:", cardError);

      // Still mark battle as finished even if card transfer fails
      const updatedRoom = await prisma.room.update({
        where: { id: roomId },
        data: {
          isFinished: true,
          winnerId,
        },
      });

      return NextResponse.json({
        success: true,
        room: updatedRoom,
        warning: "Battle completed but card transfer failed",
        error: cardError.message,
      });
    }
  } catch (error) {
    console.error("Error completing battle:", error);
    return NextResponse.json(
      { error: "Failed to complete battle" },
      { status: 500 }
    );
  }
}
