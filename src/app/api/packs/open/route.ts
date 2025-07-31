import { PrismaClient } from '@prisma/client';
import pokemonList from '@/lib/pokemon-list.json';

const prisma = new PrismaClient();

// Helper to get current Malaysia time (add 8 hours to UTC)
const getCurrentMalaysiaTime = () => {
  const utcNow = new Date();
  return new Date(utcNow.getTime() + 8 * 60 * 60 * 1000);
};

export async function POST(req: Request) {
  try {
    const { email, force, userAddress, tokenIds } = await req.json(); // Added userAddress and tokenIds

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add userAddress validation
    if (!userAddress) {
      return new Response(
        JSON.stringify({ error: 'User wallet address is required.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current Malaysia time (UTC + 8 hours)
    const currentMalaysiaTime = getCurrentMalaysiaTime();

    // user.nextPackAt is already Malaysia time from database, no conversion needed
    const canOpen = currentMalaysiaTime.getTime() >= user.nextPackAt.getTime();

    console.log('🎴 Pack Opening Debug:');
    console.log('Current UTC:', new Date().toISOString());
    console.log('User Address:', userAddress); // Log wallet address
    console.log(
      'Current Malaysia Time:',
      currentMalaysiaTime.toLocaleString('en-US', {
        timeZone: 'Asia/Kuala_Lumpur',
      })
    );
    console.log(
      'Next Pack Time (DB - already Malaysia):',
      user.nextPackAt.toLocaleString('en-US', {
        timeZone: 'Asia/Kuala_Lumpur',
      })
    );
    console.log('Can open pack:', canOpen);
    console.log(
      'Time difference (hours):',
      (user.nextPackAt.getTime() - currentMalaysiaTime.getTime()) /
        (1000 * 60 * 60)
    );

    // Block opening if it's too early and not forcing
    if (!canOpen && !force) {
      return new Response(JSON.stringify({ error: 'Pack is not ready yet.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Force open requires 500 gems
    if (force && !canOpen && user.gems < 500) {
      return new Response(JSON.stringify({ error: 'Not enough gems.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate next pack time: current Malaysia time + 6 hours
    const nextPackMalaysiaTime = new Date(
      currentMalaysiaTime.getTime() + 6 * 60 * 60 * 1000
    );

    console.log(
      '🕐 Setting next pack time (Malaysia):',
      nextPackMalaysiaTime.toLocaleString('en-US', {
        timeZone: 'Asia/Kuala_Lumpur',
      })
    );

    // Update user
    await prisma.user.update({
      where: { email },
      data: {
        ...(force && !canOpen ? { gems: { decrement: 500 } } : {}),
        nextPackAt: nextPackMalaysiaTime, // This will be stored as Malaysia time
      },
    });

    // Generate cards - UPDATED LOGIC
    let cards;

    if (tokenIds && tokenIds.length > 0) {
      // Option 1: Use tokenIds from smart contract's getRandomPokemonIds()
      console.log('🎯 Using contract-generated token IDs:', tokenIds);

      cards = tokenIds.map((tokenId) => {
        // Find the Pokemon in your list by tokenId
        const pokemon = pokemonList.find((p) => p.tokenId === tokenId);

        if (!pokemon) {
          console.warn(`⚠️ Pokemon with tokenId ${tokenId} not found in list`);
          // Return a fallback card
          return {
            tokenId: tokenId,
            tcgId: `unknown-${tokenId}`,
            name: `Unknown Pokemon #${tokenId}`,
            imageUrl: '/placeholder-card.png', // Add a placeholder image
            rarity: 'Common',
          };
        }

        return {
          tokenId: pokemon.tokenId,
          tcgId: pokemon.tcgId,
          name: pokemon.name,
          imageUrl: pokemon.largeImage,
          rarity: pokemon.rarity,
        };
      });
    } else {
      // Option 2: Generate random cards (fallback method)
      console.log('🎲 Generating random cards (fallback method)');

      const maxIndex = pokemonList.length;
      const idSet = new Set<number>();
      while (idSet.size < 5) {
        const randomIndex = Math.floor(Math.random() * maxIndex);
        idSet.add(randomIndex);
      }

      cards = Array.from(idSet).map((index) => {
        const p = pokemonList[index];
        return {
          tokenId: p.tokenId,
          tcgId: p.tcgId,
          name: p.name,
          imageUrl: p.largeImage,
          rarity: p.rarity,
        };
      });
    }

    console.log(
      '🃏 Generated cards:',
      cards.map((c) => `${c.name} (ID: ${c.tokenId})`)
    );

    return new Response(
      JSON.stringify({
        cards,
        userAddress, // Include in response for frontend verification
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in /api/packs/open:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
