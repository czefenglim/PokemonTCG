import { NextRequest, NextResponse } from "next/server";
import { completeTrade } from "../../../lib/contract/completeTrade";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sender, receiver } = body;

    if (!sender || !receiver) {
      return NextResponse.json(
        { error: "Missing sender or receiver address" },
        { status: 400 }
      );
    }

    await completeTrade(sender, receiver);

    return NextResponse.json({ message: "Trade completed successfully." });
  } catch (error) {
    console.error("Trade completion failed:", error);
    return NextResponse.json(
      { error: "Failed to complete trade" },
      { status: 500 }
    );
  }
}
