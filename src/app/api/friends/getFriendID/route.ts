import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return new NextResponse("Username query parameter is required", {
      status: 400,
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true }, // you can return more fields if needed
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
