// /api/battle/wager/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ethers } from "ethers";

// Contract addresses - replace with your deployed contract addresses
const POKEMON_CARD_CONTRACT = process.env.POKEMON_CARD_CONTRACT_ADDRESS;
const BATTLE_WAGER_CONTRACT = process.env.BATTLE_WAGER_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.BATTLE_SERVER_PRIVATE_KEY; // Server wallet for battle operations
const RPC_URL = process.env.ETHEREUM_RPC_URL; // Your Ethereum node URL

// Contract ABIs
const BATTLE_WAGER_ABI = [
  {
    name: "createBattleAndLockCards",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "battleId", type: "string" },
      { name: "player1", type: "address" },
      { name: "player2", type: "address" },
      { name: "player1Cards", type: "uint256[]" },
      { name: "player2Cards", type: "uint256[]" },
      { name: "cardNames", type: "string[]" },
      { name: "cardImages", type: "string[]" },
    ],
    outputs: [],
  },
  {
    name: "completeBattle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "battleId", type: "string" },
      { name: "winner", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "distributeCards",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "battleId", type: "string" }],
    outputs: [],
  },
  {
    name: "getBattle",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "battleId", type: "string" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "battleId", type: "string" },
          { name: "player1", type: "address" },
          { name: "player2", type: "address" },
          {
            name: "player1Card",
            type: "tuple",
            components: [
              { name: "tokenId", type: "uint256" },
              { name: "amount", type: "uint256" },
              { name: "owner", type: "address" },
              { name: "cardName", type: "string" },
              { name: "cardImage", type: "string" },
            ],
          },
          {
            name: "player2Card",
            type: "tuple",
            components: [
              { name: "tokenId", type: "uint256" },
              { name: "amount", type: "uint256" },
              { name: "owner", type: "address" },
              { name: "cardName", type: "string" },
              { name: "cardImage", type: "string" },
            ],
          },
          { name: "status", type: "uint8" },
          { name: "winner", type: "address" },
          { name: "createdAt", type: "uint256" },
          { name: "completedAt", type: "uint256" },
          { name: "cardsDistributed", type: "bool" },
        ],
      },
    ],
  },
  {
    name: "startBattle",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "battleId", type: "string" }],
    outputs: [],
  },
];

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY!, provider);
const battleWagerContract = new ethers.Contract(
  BATTLE_WAGER_CONTRACT!,
  BATTLE_WAGER_ABI,
  signer
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case "createBattle":
        return await handleCreateBattle(params);

      case "startBattle":
        return await handleStartBattle(params);

      case "completeBattle":
        return await handleCompleteBattle(params);

      case "distributeCards":
        return await handleDistributeCards(params);

      case "getBattle":
        return await handleGetBattle(params);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Battle wager API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleCreateBattle(params: {
  battleId: string;
  player1: string;
  player2: string;
  player1Cards: number[];
  player2Cards: number[];
  cardNames: string[];
  cardImages: string[];
}) {
  try {
    const {
      battleId,
      player1,
      player2,
      player1Cards,
      player2Cards,
      cardNames,
      cardImages,
    } = params;

    // Convert card IDs to BigInt for contract
    const player1CardsBigInt = player1Cards.map((id) => BigInt(id));
    const player2CardsBigInt = player2Cards.map((id) => BigInt(id));

    console.log(
      `Creating battle ${battleId} between ${player1} and ${player2}`
    );

    // Call the smart contract
    const tx = await battleWagerContract.createBattleAndLockCards(
      battleId,
      player1,
      player2,
      player1CardsBigInt,
      player2CardsBigInt,
      cardNames,
      cardImages
    );

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    console.log(
      `Battle created successfully. Transaction hash: ${receipt.hash}`
    );

    // Get the battle data to return
    const battleData = await battleWagerContract.getBattle(battleId);

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      battleData: {
        battleId: battleData.battleId,
        player1: battleData.player1,
        player2: battleData.player2,
        player1Card: {
          tokenId: battleData.player1Card.tokenId.toString(),
          cardName: battleData.player1Card.cardName,
          cardImage: battleData.player1Card.cardImage,
          owner: battleData.player1Card.owner,
        },
        player2Card: {
          tokenId: battleData.player2Card.tokenId.toString(),
          cardName: battleData.player2Card.cardName,
          cardImage: battleData.player2Card.cardImage,
          owner: battleData.player2Card.owner,
        },
        status: battleData.status,
        createdAt: battleData.createdAt.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating battle:", error);
    return NextResponse.json(
      {
        error: "Failed to create battle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleStartBattle(params: { battleId: string }) {
  try {
    const { battleId } = params;

    console.log(`Starting battle ${battleId}`);

    const tx = await battleWagerContract.startBattle(battleId);
    const receipt = await tx.wait();

    console.log(
      `Battle started successfully. Transaction hash: ${receipt.hash}`
    );

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      message: "Battle started successfully",
    });
  } catch (error) {
    console.error("Error starting battle:", error);
    return NextResponse.json(
      {
        error: "Failed to start battle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleCompleteBattle(params: {
  battleId: string;
  winnerId: string;
}) {
  try {
    const { battleId, winnerId } = params;

    console.log(`Completing battle ${battleId} with winner ${winnerId}`);

    const tx = await battleWagerContract.completeBattle(battleId, winnerId);
    const receipt = await tx.wait();

    console.log(
      `Battle completed successfully. Transaction hash: ${receipt.hash}`
    );

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      message: "Battle completed successfully",
    });
  } catch (error) {
    console.error("Error completing battle:", error);
    return NextResponse.json(
      {
        error: "Failed to complete battle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleDistributeCards(params: { battleId: string }) {
  try {
    const { battleId } = params;

    console.log(`Distributing cards for battle ${battleId}`);

    const tx = await battleWagerContract.distributeCards(battleId);
    const receipt = await tx.wait();

    console.log(
      `Cards distributed successfully. Transaction hash: ${receipt.hash}`
    );

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      message: "Cards distributed successfully",
    });
  } catch (error) {
    console.error("Error distributing cards:", error);
    return NextResponse.json(
      {
        error: "Failed to distribute cards",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function handleGetBattle(params: { battleId: string }) {
  try {
    const { battleId } = params;

    const battleData = await battleWagerContract.getBattle(battleId);

    return NextResponse.json({
      success: true,
      battleData: {
        battleId: battleData.battleId,
        player1: battleData.player1,
        player2: battleData.player2,
        player1Card: {
          tokenId: battleData.player1Card.tokenId.toString(),
          cardName: battleData.player1Card.cardName,
          cardImage: battleData.player1Card.cardImage,
          owner: battleData.player1Card.owner,
        },
        player2Card: {
          tokenId: battleData.player2Card.tokenId.toString(),
          cardName: battleData.player2Card.cardName,
          cardImage: battleData.player2Card.cardImage,
          owner: battleData.player2Card.owner,
        },
        status: battleData.status,
        winner: battleData.winner,
        createdAt: battleData.createdAt.toString(),
        completedAt: battleData.completedAt.toString(),
        cardsDistributed: battleData.cardsDistributed,
      },
    });
  } catch (error) {
    console.error("Error getting battle:", error);
    return NextResponse.json(
      {
        error: "Failed to get battle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const battleId = searchParams.get("battleId");

    if (!battleId) {
      return NextResponse.json(
        { error: "Battle ID is required" },
        { status: 400 }
      );
    }

    return await handleGetBattle({ battleId });
  } catch (error) {
    console.error("Battle wager GET error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
