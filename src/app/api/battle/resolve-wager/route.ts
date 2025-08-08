// pages/api/battle/resolve-wager.ts
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";

const WAGER_CONTRACT_ADDRESS = process.env.WAGER_CONTRACT_ADDRESS!;
const PRIVATE_KEY = process.env.CONTRACT_OWNER_PRIVATE_KEY!; // Backend wallet that owns the contract
const RPC_URL = process.env.RPC_URL!;

const WAGER_CONTRACT_ABI = [
  "function resolveBattle(string calldata battleId, address winner) external",
  "function getWager(string calldata battleId) external view returns (tuple(string battleId, address player1, address player2, uint256 player1TokenId, uint256 player2TokenId, bool isActive, uint256 createdAt))",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { battleId, winnerUserId, loserUserId } = req.body;

    if (!battleId || !winnerUserId || !loserUserId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const wagerContract = new ethers.Contract(
      WAGER_CONTRACT_ADDRESS,
      WAGER_CONTRACT_ABI,
      signer
    );

    // Get wager details from contract
    const wager = await wagerContract.getWager(battleId);

    if (!wager.isActive) {
      return res
        .status(400)
        .json({ error: "Wager is not active or does not exist" });
    }

    // Get winner's wallet address (you'll need to map userId to wallet address)
    // This is a simplified example - you'd get this from your database
    const winnerAddress = await getUserWalletAddress(winnerUserId);

    if (!winnerAddress) {
      return res.status(400).json({ error: "Winner wallet address not found" });
    }

    // Resolve the battle on the contract
    console.log(`Resolving battle ${battleId} for winner ${winnerAddress}`);
    const tx = await wagerContract.resolveBattle(battleId, winnerAddress);
    const receipt = await tx.wait();

    // Log the resolution
    console.log(`✅ Battle resolved! TX: ${receipt.transactionHash}`);

    res.status(200).json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      winner: winnerAddress,
      battleId,
    });
  } catch (error: any) {
    console.error("Contract resolution error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to resolve battle contract",
    });
  }
}

// Helper function to get user's wallet address
// You'll need to implement this based on your user model
async function getUserWalletAddress(userId: string): Promise<string | null> {
  try {
    // Example using Prisma - adjust based on your setup
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    return user?.walletAddress || null;
  } catch (error) {
    console.error("Error getting user wallet address:", error);
    return null;
  }
}
