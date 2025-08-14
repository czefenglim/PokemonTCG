// used in battle/pvp/page.tsx
import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        isFinished: false,
        players: {
          lt: 2,
        },
      },
      select: {
        id: true,
        name: true,
        isPrivate: true,
        players: true,
        creatorId: true,
        wagerRarity: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const roomsWithDefaults = rooms.map((room) => ({
      ...room,
      maxPlayers: 2,
    }));

    return NextResponse.json(roomsWithDefaults);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
