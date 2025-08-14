import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/app/lib/prisma";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function GET(req: Request) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);

    // Trust the wallet address from the header (requires secure frontend)
    const walletAddress = req.headers.get("x-wallet-address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing wallet address" },
        { status: 400 }
      );
    }

    // Fetch decks based on wallet address
    const decks = await prisma.deck.findMany({
      where: { userAddress: walletAddress.toLowerCase() }, // lowercase matching
      include: { cards: true },
    });

    return NextResponse.json({ decks });
  } catch (error) {
    console.error("GET /api/decks error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
