// src/app/api/tradeRequest/updateReceiver/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { TradeStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const prisma = new PrismaClient();
    const body = await req.json();
    const { tradeRequestId, receiverCardId } = body;

    if (!tradeRequestId || !receiverCardId) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const updated = await prisma.tradeRequest.update({
      where: { id: tradeRequestId },
      data: {
        receiverStatus: TradeStatus.accepted,
        requestedCardId: receiverCardId,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
