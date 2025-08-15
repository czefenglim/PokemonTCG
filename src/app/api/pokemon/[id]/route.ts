import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import abi from '@/lib/pokemonCardABI.json';
import path from 'path';
import fs from 'fs';

// Fallback local JSON loader
function loadLocalPokemonData() {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'pokemon-list.json'
    );
    if (fs.existsSync(filePath)) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContents);
    }
  } catch (err) {
    console.error('Error loading local JSON:', err);
  }
  return [];
}

// Check if URL points to this same API
function isSelfReferencing(url: string): boolean {
  const selfPatterns = [
    'localhost:3000/api/pokemon',
    '127.0.0.1:3000/api/pokemon',
    'http://localhost:3000/api/pokemon',
    'https://localhost:3000/api/pokemon',
  ];

  return selfPatterns.some((pattern) => url.includes(pattern));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const tokenId = parseInt(resolvedParams.id);

    if (isNaN(tokenId) || tokenId <= 0) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    console.log(`🎯 API called for token ${tokenId}`);

    // Connect to the blockchain
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
      abi,
      provider
    );

    // 1️⃣ Get Base URI from contract
    let tokenUri;
    try {
      tokenUri = await contract.uri(tokenId);
      console.log('📍 Token URI from contract:', tokenUri);

      // Replace {id} placeholder if needed
      tokenUri = tokenUri.replace('{id}', tokenId.toString());
      console.log('📍 Processed Token URI:', tokenUri);
    } catch (err) {
      console.warn('⚠️ Failed to get URI from contract:', err);
    }

    // 2️⃣ Try to fetch metadata from blockchain URI (only if it's not self-referencing)
    let metadata;

    if (tokenUri && !isSelfReferencing(tokenUri)) {
      try {
        console.log('🌐 Fetching from external URI:', tokenUri);
        const res = await fetch(tokenUri, {
          headers: {
            'User-Agent': 'Pokemon-TCG-App/1.0',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        metadata = await res.json();
        console.log(`✅ External metadata fetched for token ${tokenId}`);

        // Validate that we got actual metadata
        if (!metadata.name && !metadata.image) {
          throw new Error('Invalid metadata structure');
        }
      } catch (err) {
        console.warn(`⚠️ Failed to fetch from external URI:`, err);
        metadata = null;
      }
    } else if (tokenUri) {
      console.warn(
        '🔄 Self-referencing URI detected, skipping fetch to prevent infinite loop'
      );
      metadata = null;
    }

    // 3️⃣ If external fetch failed or URI was self-referencing, use local JSON
    if (!metadata) {
      console.log(`📁 Using local JSON fallback for token ${tokenId}`);
      const allPokemon = loadLocalPokemonData();
      const pokemon = allPokemon.find((p) => p.tokenId === tokenId);

      if (!pokemon) {
        console.error(
          `❌ Pokemon not found in local data for token ${tokenId}`
        );
        return NextResponse.json(
          { error: 'Pokemon not found' },
          { status: 404 }
        );
      }

      // Create metadata structure from local data
      metadata = {
        name: pokemon.name,
        description:
          pokemon.description ||
          `A ${pokemon.rarity} ${pokemon.type} Pokemon card`,
        image: pokemon.largeImage || pokemon.image,
        attributes: [
          { trait_type: 'Type', value: pokemon.type },
          { trait_type: 'Rarity', value: pokemon.rarity },
          { trait_type: 'TCG ID', value: pokemon.tcgId },
          ...(pokemon.strikePower
            ? [{ trait_type: 'Strike Power', value: pokemon.strikePower }]
            : []),
          ...(pokemon.battleRating
            ? [{ trait_type: 'Battle Rating', value: pokemon.battleRating }]
            : []),
        ],
        gameData: pokemon,
      };

      console.log(`✅ Local metadata created for ${pokemon.name}`);
    }

    // 4️⃣ Ensure gameData exists for frontend compatibility
    if (!metadata.gameData && metadata.attributes) {
      metadata.gameData = {
        tcgId: metadata.attributes.find((attr) => attr.trait_type === 'TCG ID')
          ?.value,
        rarity: metadata.attributes.find((attr) => attr.trait_type === 'Rarity')
          ?.value,
        type: metadata.attributes.find((attr) => attr.trait_type === 'Type')
          ?.value,
        strikePower: metadata.attributes.find(
          (attr) => attr.trait_type === 'Strike Power'
        )?.value,
        battleRating: metadata.attributes.find(
          (attr) => attr.trait_type === 'Battle Rating'
        )?.value,
      };
    }

    console.log(`🎉 Successfully returning metadata for token ${tokenId}`);

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('💥 Error in /api/pokemon/[id]:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
