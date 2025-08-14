// // app/api/user/wallet/[userId]/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { userId: string } }
// ) {
//   try {
//     const userId = params.userId;

//     if (!userId) {
//       return NextResponse.json(
//         { error: "User ID is required" },
//         { status: 400 }
//       );
//     }

//     console.log(`🔍 Wallet address requested for user: ${userId}`);

//     // Check if user exists and has a wallet address
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//       select: {
//         id: true,
//         walletAddress: true,
//         username: true,
//       },
//     });

//     if (!user) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//     return NextResponse.json({
//       address: user.walletAddress || null,
//       userId: userId,
//       username: user.username,
//       hasWallet: !!user.walletAddress,
//     });
//   } catch (error) {
//     console.error("❌ Error in wallet endpoint:", error);

//     // For demo purposes, return mock addresses
//     const mockAddresses: Record<string, string> = {
//       user1: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Hardhat account #0
//       user2: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Hardhat account #1
//     };

//     return NextResponse.json({
//       address:
//         mockAddresses[params.userId] ||
//         "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
//       userId: params.userId,
//       hasWallet: true,
//       mock: true,
//     });
//   }
// }

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { userId: string } }
// ) {
//   try {
//     const userId = params.userId;
//     const body = await request.json();
//     const { walletAddress } = body;

//     if (!userId || !walletAddress) {
//       return NextResponse.json(
//         { error: "User ID and wallet address are required" },
//         { status: 400 }
//       );
//     }

//     // Update user's wallet address
//     const user = await prisma.user.upsert({
//       where: { id: userId },
//       update: { walletAddress },
//       create: {
//         id: userId,
//         walletAddress,
//         username: `user_${userId.slice(0, 8)}`,
//       },
//       select: { id: true, walletAddress: true, username: true },
//     });

//     console.log(
//       `💳 Updated wallet address for user ${userId}: ${walletAddress}`
//     );

//     return NextResponse.json({
//       success: true,
//       user: {
//         id: user.id,
//         walletAddress: user.walletAddress,
//         username: user.username,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error updating wallet address:", error);
//     return NextResponse.json(
//       { error: "Failed to update wallet address" },
//       { status: 500 }
//     );
//   }
// }
