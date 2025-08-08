// app/api/battle/room/list/route.ts
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        isFinished: false, // Only show active rooms
        players: {
          lt: 2, // Only rooms with less than 2 players (0 or 1)
        },
      },
      select: {
        id: true,
        name: true,
        isPrivate: true,
        players: true,
        creatorId: true,
        wagerRarity: true, // Include the new wager rarity field
        createdAt: true,
        // Add maxPlayers if you have it in your schema, otherwise remove this line
        // maxPlayers: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to include maxPlayers if not in database
    const roomsWithDefaults = rooms.map((room) => ({
      ...room,
      maxPlayers: 2, // Default to 2 if not stored in database
    }));

    console.log(`Found ${rooms.length} available rooms`); // Debug log
    return NextResponse.json(roomsWithDefaults);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
