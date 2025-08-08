// app/api/battle/room/create/route.ts
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { isValidRarity, formatRarityName } from "@/app/lib/cardUtils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      isPrivate,
      password,
      creatorId,
      player1Id,
      player1DeckId,
      player1Avatar,
      player1Address, // Add blockchain address for verification
      wagerRarity, // Single rarity for the entire room
    } = body;

    console.log("Creating room with data:", {
      id,
      name,
      isPrivate,
      wagerRarity,
      player1Address,
    });

    // Validate required fields
    if (!id || !name || !creatorId || !player1Id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate rarity if provided
    if (wagerRarity) {
      if (!isValidRarity(wagerRarity)) {
        return NextResponse.json(
          { error: "Invalid card rarity selected" },
          { status: 400 }
        );
      }

      // Note: Card verification will be handled on the frontend before sending the request
      // Server-side blockchain verification is not practical due to lack of wallet access
      if (!player1Address) {
        console.warn("No blockchain address provided for card verification");
      }
    }

    // Create the room
    const room = await prisma.room.create({
      data: {
        id,
        name,
        isPrivate,
        password,
        creatorId,
        player1Id,
        player1DeckId,
        player1Avatar,
        wagerRarity, // Single rarity for the room
        players: 1,
      },
    });

    console.log("Room created successfully:", room.id);
    return NextResponse.json(room);
  } catch (error) {
    console.error("Error creating room:", error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to create room",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
