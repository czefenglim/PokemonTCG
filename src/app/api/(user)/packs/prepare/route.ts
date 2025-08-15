import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import abi from '@/lib/data/pokemonCardABI.json';

const prisma = new PrismaClient();

const getCurrentMalaysiaTime = () => {
  const utcNow = new Date();
  return new Date(utcNow.getTime() + 8 * 60 * 60 * 1000);
};

export async function POST(req: Request) {
  try {
    const { email, force, tokenIds } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found.' }), {
        status: 404,
      });
    }

    const currentMalaysiaTime = getCurrentMalaysiaTime();
    const canOpen = currentMalaysiaTime.getTime() >= user.nextPackAt.getTime();

    // Block if not ready and not force
    if (!canOpen && !force) {
      return new Response(JSON.stringify({ error: 'Pack is not ready yet.' }), {
        status: 403,
      });
    }

    // Force open requires 500 gems
    if (force && !canOpen && user.gems < 500) {
      return new Response(JSON.stringify({ error: 'Not enough gems.' }), {
        status: 403,
      });
    }

    // --------------------
    // Generate token IDs
    // --------------------
    let selectedIds: number[] = [];
    if (tokenIds?.length) {
      selectedIds = tokenIds;
    } else {
      // fallback random IDs (0 - 999) if not provided
      const idSet = new Set<number>();
      while (idSet.size < 5) {
        idSet.add(Math.floor(Math.random() * 1000)); // adjust range if needed
      }
      selectedIds = Array.from(idSet);
    }

    // --------------------
    // Fetch metadata from Base URI
    // --------------------
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // e.g. Hardhat or testnet RPC
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
      abi,
      provider
    );

    const cards = [];
    for (const tokenId of selectedIds) {
      try {
        // ✅ NEW: Consistent API approach (uses same logic as collection)
        const response = await fetch(
          `http://localhost:3000/api/pokemon/${tokenId}`
        );

        if (!response.ok)
          throw new Error(`Failed to fetch metadata for ${tokenId}`);

        const metadata = await response.json();
        cards.push({
          tokenId,
          tcgId: metadata.tcgId || `tcg-${tokenId}`,
          name: metadata.name || `Pokemon #${tokenId}`,
          imageUrl: metadata.image || '/placeholder-card.png',
          rarity:
            metadata.attributes?.find(
              (attr: any) => attr.trait_type === 'Rarity'
            )?.value || 'Common',
        });
      } catch (err) {
        console.error(`Error fetching metadata for tokenId ${tokenId}:`, err);
        cards.push({
          tokenId,
          tcgId: `unknown-${tokenId}`,
          name: `Unknown Pokemon #${tokenId}`,
          imageUrl: '/placeholder-card.png',
          rarity: 'Common',
        });
      }
    }

    return new Response(
      JSON.stringify({
        cards,
        nextPackAt: user.nextPackAt.getTime(),
        gems: user.gems,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/packs/prepare:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
