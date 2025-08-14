// used in battle/pvp/page.tsx
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { roomId, userId, userAvatar, userDeckId, userAddress } =
      await request.json();

    console.log("Joining room:", { roomId, userId, userAddress });

    // Validate required fields
    if (!roomId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the room to check the required rarity
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.players >= 2) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    // Check if user is trying to join their own room
    if (room.player1Id === userId) {
      return NextResponse.json(
        { error: "You cannot join your own room" },
        { status: 400 }
      );
    }

    if (room.wagerRarity && !userAddress) {
      console.warn("Room has wager rarity but no user address provided");
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        player2Id: userId,
        player2Avatar: userAvatar,
        player2DeckId: userDeckId,
        players: 2,
      },
    });

    console.log("Successfully joined room:", updatedRoom.id);
    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error("Error joining room:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to join room",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
