import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, password } = body;

  if (!roomId || !password) {
    return NextResponse.json(
      { success: false, error: "Missing fields" },
      { status: 400 }
    );
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });

  if (!room) {
    return NextResponse.json(
      { success: false, error: "Room not found" },
      { status: 404 }
    );
  }

  if (room.password !== password) {
    return NextResponse.json(
      { success: false, error: "Incorrect password" },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
