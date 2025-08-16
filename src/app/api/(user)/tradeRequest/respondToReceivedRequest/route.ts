import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const prisma = new PrismaClient();
  try {
    const { requestId, action } = await req.json();

    if (!["accepted", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.tradeRequest.update({
      where: { id: requestId },
      data: {
        receiverStatus: action,
      },
    });

    return NextResponse.json({ message: `Trade ${action} by sender`, updated });
  } catch (error) {
    console.error("Error in respondToReceivedRequest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
