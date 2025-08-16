import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const merchandiseItems = await prisma.merchandise.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(merchandiseItems);
  } catch (error) {
    console.error("Error fetching merchandise:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
