// used in fightPage
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  console.log("🔍 Update room API called");

  try {
    const body = await request.json();
    console.log("🔍 Request body:", body);

    const { roomId, winnerId } = body;

    if (!roomId || !winnerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: {
        isFinished: true,
        winnerId: winnerId,
      },
    });

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (err) {
    console.error("❌ Error updating room:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
