import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, walletAddress } = body;

    // Validation
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        {
          error: "Username must be at least 3 characters long",
        },
        { status: 400 }
      );
    }

    if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        {
          error: "Invalid wallet address format",
        },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        NOT: {
          email: session.user.email ?? "",
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Username is already taken",
        },
        { status: 409 }
      );
    }

    // Check if wallet address is already taken by another user
    if (walletAddress) {
      const existingWallet = await prisma.user.findFirst({
        where: {
          walletAddress: walletAddress,
          NOT: {
            email: session.user.email ?? "",
          },
        },
      });

      if (existingWallet) {
        return NextResponse.json(
          {
            error: "Wallet address is already registered",
          },
          { status: 409 }
        );
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        email: session.user.email ?? "",
      },
      data: {
        username: username.trim(),
        ...(walletAddress && { walletAddress }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        gems: true,
        createdAt: true,
        walletAddress: true,
        role: true,
        nextPackAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
