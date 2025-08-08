import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id, name, isPrivate, password, creatorId } = await req.json();

    const room = await prisma.room.create({
      data: {
        id,
        name,
        isPrivate,
        password,
        creatorId,
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error("[ROOM_CREATE_ERROR]", error);
    return new NextResponse("Error creating room", { status: 500 });
  }
}
