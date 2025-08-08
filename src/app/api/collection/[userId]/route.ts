// app/api/collection/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import pokemonList from "@/app/lib/pokemon-list.json";

const prisma = new PrismaClient();

// Contract configuration with fallbacks
const POKEMON_CARD_CONTRACT_ADDRESS =
  process.env.POKEMON_CARD_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const RPC_URL =
  process.env.RPC_URL ||
  process.env.ETHEREUM_RPC_URL ||
  "http://localhost:8545";

const POKEMON_CARD_ABI = [
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function uri(uint256 tokenId) external view returns (string)",
  "function balanceOfBatch(address[] accounts, uint256[] ids) external view returns (uint256[])",
];

interface CollectionCard {
  tokenId: number;
  tcgId?: string;
  name: string;
  imageUrl: string;
  rarity?: string;
  type?: string;
  balance: number;
  lastUpdated: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`📦 Fetching collection for user: ${userId}`);

    // Check if user exists (without requiring walletAddress)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        // Only select walletAddress if the column exists
        ...((await hasWalletAddressColumn()) ? { walletAddress: true } : {}),
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try to get wallet address from database if available, otherwise return fallback collection
    const walletAddress = (user as any).walletAddress;

    if (!walletAddress) {
      console.log(
        `⚠️ User ${userId} has no wallet address, returning fallback collection`
      );
      return NextResponse.json(getFallbackCollection());
    }

    console.log(
      `🔍 Checking blockchain collection for wallet: ${walletAddress}`
    );

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      console.log(`⚠️ Invalid wallet address format: ${walletAddress}`);
      return NextResponse.json(getFallbackCollection());
    }

    // Try to get cached collection first
    const cachedCollection = await getCachedCollection(userId);
    const shouldRefresh = shouldRefreshCollection(cachedCollection);

    if (!shouldRefresh && cachedCollection.length > 0) {
      console.log(
        `📋 Returning cached collection: ${cachedCollection.length} cards`
      );
      return NextResponse.json(cachedCollection);
    }

    // Fetch from blockchain
    const blockchainCollection = await fetchBlockchainCollection(walletAddress);

    // Cache the results if successful
    if (blockchainCollection.length > 0) {
      await cacheCollection(userId, blockchainCollection);
    }

    console.log(
      `✅ Fetched ${blockchainCollection.length} cards from blockchain`
    );
    return NextResponse.json(blockchainCollection);
  } catch (error) {
    console.error("❌ Error fetching collection:", error);

    // Return fallback collection on error
    const fallbackCollection = getFallbackCollection();
    return NextResponse.json(fallbackCollection, {
      status: 200,
      headers: {
        "X-Warning": "Returned fallback collection due to error",
      },
    });
  }
}

// Check if walletAddress column exists in the user table
async function hasWalletAddressColumn(): Promise<boolean> {
  try {
    // Try a simple query to see if the column exists
    await prisma.$queryRaw`SELECT walletAddress FROM users LIMIT 1`;
    return true;
  } catch (error) {
    // Column doesn't exist
    console.log(
      "📋 walletAddress column not found in user table, using fallback collection"
    );
    return false;
  }
}

async function getCachedCollection(userId: string): Promise<CollectionCard[]> {
  try {
    // For now, skip caching since we don't have a cache table
    // You can implement this later if needed
    return [];
  } catch (error) {
    console.log("📋 No cached collection available, will fetch fresh data");
    return [];
  }
}

function shouldRefreshCollection(cachedCollection: CollectionCard[]): boolean {
  if (cachedCollection.length === 0) return true;

  // Refresh if cache is older than 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const lastUpdate = Math.max(
    ...cachedCollection.map((c) => c.lastUpdated.getTime())
  );
  const isStale = Date.now() - lastUpdate > CACHE_DURATION;

  return isStale;
}

async function fetchBlockchainCollection(
  walletAddress: string
): Promise<CollectionCard[]> {
  if (
    !POKEMON_CARD_CONTRACT_ADDRESS ||
    POKEMON_CARD_CONTRACT_ADDRESS === "0x..."
  ) {
    console.log(
      "⚠️ No valid contract address configured, returning fallback data"
    );
    return getFallbackCollection();
  }

  try {
    console.log("🔗 Connecting to blockchain...", {
      RPC_URL,
      CONTRACT: POKEMON_CARD_CONTRACT_ADDRESS,
    });

    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // Test connection
    try {
      const blockNumber = await provider.getBlockNumber();
      console.log("📡 Connected to blockchain, latest block:", blockNumber);
    } catch (connectionError) {
      console.error("❌ Blockchain connection failed:", connectionError);
      return getFallbackCollection();
    }

    const contract = new ethers.Contract(
      POKEMON_CARD_CONTRACT_ADDRESS,
      POKEMON_CARD_ABI,
      provider
    );

    console.log("🔗 Connected to contract, checking card balances...");

    // Get a smaller subset of token IDs for testing (first 50 cards)
    const allTokenIds = pokemonList.slice(0, 50).map((p) => p.tokenId);

    // Batch check balances for efficiency
    const accounts = Array(allTokenIds.length).fill(walletAddress);

    console.log(
      `📊 Checking ${allTokenIds.length} token balances for ${walletAddress}`
    );

    let balances;
    try {
      balances = await contract.balanceOfBatch(accounts, allTokenIds);
    } catch (batchError) {
      console.warn(
        "⚠️ Batch balance check failed, trying individual calls:",
        batchError
      );

      // Fallback to individual balance checks
      balances = [];
      for (let i = 0; i < Math.min(allTokenIds.length, 10); i++) {
        // Limit to 10 for safety
        try {
          const balance = await contract.balanceOf(
            walletAddress,
            allTokenIds[i]
          );
          balances.push(balance);
        } catch (individualError) {
          console.warn(
            `Failed to get balance for token ${allTokenIds[i]}:`,
            individualError
          );
          balances.push(0n); // Add zero balance for failed calls
        }
      }
    }

    console.log(`📊 Received ${balances.length} balance results`);

    // Filter cards that the user owns (balance > 0)
    const ownedCards: CollectionCard[] = [];

    for (let i = 0; i < Math.min(allTokenIds.length, balances.length); i++) {
      const balance = Number(balances[i]);
      if (balance > 0) {
        const pokemonData = pokemonList.find(
          (p) => p.tokenId === allTokenIds[i]
        );
        if (pokemonData) {
          ownedCards.push({
            tokenId: pokemonData.tokenId,
            tcgId: pokemonData.tcgId,
            name: pokemonData.name,
            imageUrl:
              pokemonData.largeImage ||
              pokemonData.smallImage ||
              "/placeholder.png",
            rarity: pokemonData.rarity,
            type: pokemonData.type,
            balance,
            lastUpdated: new Date(),
          });
        }
      }
    }

    console.log(`🎯 Found ${ownedCards.length} owned cards`);

    // If no cards found, return at least some fallback cards for testing
    if (ownedCards.length === 0) {
      console.log("🎲 No cards found on blockchain, returning test cards");
      return getFallbackCollection();
    }

    return ownedCards;
  } catch (error) {
    console.error("❌ Blockchain fetch failed:", error);

    // Return fallback data on blockchain error
    return getFallbackCollection();
  }
}

async function cacheCollection(
  userId: string,
  collection: CollectionCard[]
): Promise<void> {
  try {
    // Skip caching for now since we don't have a cache table
    // You can implement this later if needed
    console.log(`💾 Caching skipped - implement based on your schema`);
  } catch (error) {
    console.warn("⚠️ Failed to cache collection:", error);
    // Non-critical error, continue without caching
  }
}

function getFallbackCollection(): CollectionCard[] {
  // Return a good variety of test cards for development
  return [
    {
      tokenId: 1,
      tcgId: "base1-4",
      name: "Charizard",
      imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
      rarity: "Rare Holo",
      type: "Fire",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 2,
      tcgId: "base1-2",
      name: "Blastoise",
      imageUrl: "https://images.pokemontcg.io/base1/2_hires.png",
      rarity: "Rare Holo",
      type: "Water",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 3,
      tcgId: "base1-15",
      name: "Venusaur",
      imageUrl: "https://images.pokemontcg.io/base1/15_hires.png",
      rarity: "Rare Holo",
      type: "Grass",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 25,
      tcgId: "base1-58",
      name: "Pikachu",
      imageUrl: "https://images.pokemontcg.io/base1/58_hires.png",
      rarity: "Common",
      type: "Electric",
      balance: 2,
      lastUpdated: new Date(),
    },
    {
      tokenId: 150,
      tcgId: "base1-10",
      name: "Mewtwo",
      imageUrl: "https://images.pokemontcg.io/base1/10_hires.png",
      rarity: "Rare Holo",
      type: "Psychic",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 6,
      tcgId: "base1-4",
      name: "Charizard",
      imageUrl: "https://images.pokemontcg.io/base1/4_hires.png",
      rarity: "Rare Holo",
      type: "Fire",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 144,
      tcgId: "fossil-12",
      name: "Articuno",
      imageUrl: "https://images.pokemontcg.io/fossil/12_hires.png",
      rarity: "Rare Holo",
      type: "Water",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 145,
      tcgId: "fossil-13",
      name: "Zapdos",
      imageUrl: "https://images.pokemontcg.io/fossil/13_hires.png",
      rarity: "Rare Holo",
      type: "Electric",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 146,
      tcgId: "fossil-19",
      name: "Moltres",
      imageUrl: "https://images.pokemontcg.io/fossil/19_hires.png",
      rarity: "Rare Holo",
      type: "Fire",
      balance: 1,
      lastUpdated: new Date(),
    },
    {
      tokenId: 94,
      tcgId: "base1-11",
      name: "Gengar",
      imageUrl: "https://images.pokemontcg.io/base1/11_hires.png",
      rarity: "Rare Holo",
      type: "Psychic",
      balance: 1,
      lastUpdated: new Date(),
    },
  ];
}

// API endpoint to update wallet address for a user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Update user's wallet address
    const user = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress },
      select: { id: true, walletAddress: true, username: true },
    });

    console.log(
      `💳 Updated wallet address for user ${userId}: ${walletAddress}`
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("❌ Error updating wallet address:", error);
    return NextResponse.json(
      { error: "Failed to update wallet address" },
      { status: 500 }
    );
  }
}
