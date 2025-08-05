// File: app/api/tradeRequest/getReceivedRequest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function GET(req: NextRequest) {
  const prisma = new PrismaClient();
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json(
      { error: "Missing wallet address" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress: wallet },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const receivedRequests = await prisma.tradeRequest.findMany({
    where: { receiverId: user.id },
    include: {
      sender: {
        select: { username: true, walletAddress: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(receivedRequests);
}
