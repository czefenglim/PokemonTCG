import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Type definitions based on your JSON structure
interface PokemonCard {
  tokenId: number;
  tcgId: string;
  name: string;
  smallImage: string;
  largeImage: string;
  description: string;
  type: string;
  rarity: string;
}

// Cache the JSON data to avoid reading file repeatedly
let pokemonData: PokemonCard[] | null = null;
let lastModified = 0;

function loadPokemonData(): PokemonCard[] {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'pokemon-list.json'
    );
    const stats = fs.statSync(filePath);

    // Only reload if file has been modified
    if (!pokemonData || stats.mtimeMs > lastModified) {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      pokemonData = JSON.parse(fileContents);
      lastModified = stats.mtimeMs;
      console.log(`Loaded ${pokemonData?.length || 0} Pokemon from JSON`);
    }

    return pokemonData || [];
  } catch (error) {
    console.error('Error loading pokemon data:', error);
    return [];
  }
}

// Calculate strike power based on type and rarity
function calculateStrikePower(pokemon: PokemonCard): number {
  let basePower = 50;

  // Type multipliers
  const typeMultiplier: Record<string, number> = {
    Fire: 1.3,
    Water: 1.1,
    Electric: 1.4,
    Grass: 1.0,
    Psychic: 1.5,
    Fighting: 1.6,
    Dark: 1.3,
    Steel: 1.2,
    Dragon: 1.8,
    Fairy: 1.1,
    Normal: 1.0,
    Flying: 1.2,
    Poison: 1.1,
    Ground: 1.2,
    Rock: 1.2,
    Bug: 0.9,
    Ghost: 1.4,
    Ice: 1.1,
  };

  // Rarity multipliers
  const rarityMultiplier: Record<string, number> = {
    Common: 1.0,
    Uncommon: 1.3,
    Rare: 1.6,
    'Rare Holo': 1.8,
    'Ultra Rare': 2.2,
    'Secret Rare': 2.5,
    Legendary: 3.0,
  };

  const typeBonus = typeMultiplier[pokemon.type] || 1.0;
  const rarityBonus = rarityMultiplier[pokemon.rarity] || 1.0;

  return Math.floor(basePower * typeBonus * rarityBonus);
}

// Calculate battle rating
function calculateBattleRating(pokemon: PokemonCard): number {
  const rarityRating: Record<string, number> = {
    Common: 100,
    Uncommon: 150,
    Rare: 200,
    'Rare Holo': 250,
    'Ultra Rare': 350,
    'Secret Rare': 400,
    Legendary: 500,
  };

  return rarityRating[pokemon.rarity] || 100;
}

// Get type emoji
function getTypeEmoji(type: string): string {
  const typeEmojis: Record<string, string> = {
    Fire: '🔥',
    Water: '💧',
    Electric: '⚡',
    Grass: '🌿',
    Psychic: '🔮',
    Fighting: '👊',
    Dark: '🌙',
    Steel: '⚔️',
    Dragon: '🐲',
    Fairy: '🧚',
    Normal: '⭐',
    Flying: '🦅',
    Poison: '☠️',
    Ground: '🌍',
    Rock: '🪨',
    Bug: '🐛',
    Ghost: '👻',
    Ice: '❄️',
  };

  return typeEmojis[type] || '⭐';
}

// Main API handler - FIXED FOR NEXT.JS 15
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params before using them
    const resolvedParams = await params;
    const tokenId = parseInt(resolvedParams.id);

    if (isNaN(tokenId) || tokenId <= 0) {
      return NextResponse.json(
        { error: 'Invalid token ID. Must be a positive number.' },
        { status: 400 }
      );
    }

    const allPokemon = loadPokemonData();

    if (allPokemon.length === 0) {
      return NextResponse.json(
        { error: 'Pokemon data not available' },
        { status: 503 }
      );
    }

    const pokemon = allPokemon.find((p) => p.tokenId === tokenId);

    if (!pokemon) {
      return NextResponse.json(
        {
          error: 'Pokemon not found',
          availableIds: allPokemon.map((p) => p.tokenId).slice(0, 10),
          totalAvailable: allPokemon.length,
        },
        { status: 404 }
      );
    }

    // Calculate game stats
    const strikePower = calculateStrikePower(pokemon);
    const battleRating = calculateBattleRating(pokemon);
    const typeEmoji = getTypeEmoji(pokemon.type);

    // Format as NFT metadata standard
    const metadata = {
      name: pokemon.name,
      description:
        pokemon.description ||
        `A ${pokemon.rarity} ${pokemon.type}-type Pokemon card featuring ${pokemon.name}.`,
      image: pokemon.largeImage,
      external_url: `${request.nextUrl.origin}/pokemon/${tokenId}`,
      attributes: [
        { trait_type: 'Type', value: pokemon.type, display_type: 'string' },
        { trait_type: 'Rarity', value: pokemon.rarity, display_type: 'string' },
        { trait_type: 'TCG ID', value: pokemon.tcgId, display_type: 'string' },
        {
          trait_type: 'Token ID',
          value: pokemon.tokenId,
          display_type: 'number',
        },
        {
          trait_type: 'Strike Power',
          value: strikePower,
          display_type: 'number',
        },
        {
          trait_type: 'Battle Rating',
          value: battleRating,
          display_type: 'number',
        },
        { trait_type: 'Type Emoji', value: typeEmoji, display_type: 'string' },
      ],
      // Custom game data
      gameData: {
        tokenId: pokemon.tokenId,
        tcgId: pokemon.tcgId,
        name: pokemon.name,
        type: pokemon.type,
        rarity: pokemon.rarity,
        smallImage: pokemon.smallImage,
        largeImage: pokemon.largeImage,
        description: pokemon.description,
        strikePower: strikePower,
        battleRating: battleRating,
        typeEmoji: typeEmoji,
        // Additional game mechanics
        canEvolve: false, // Can be enhanced later
        evolutionStage: 1,
        weakness: getWeakness(pokemon.type),
        resistance: getResistance(pokemon.type),
      },
      // Metadata for marketplaces
      compiler: 'Pokemon TCG API v1.0',
      date: new Date().toISOString(),
    };

    return NextResponse.json(metadata, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching pokemon:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          process.env.NODE_ENV === 'development'
            ? (error as Error).message
            : 'Something went wrong',
      },
      { status: 500 }
    );
  }
}

// Helper function for type weaknesses
function getWeakness(type: string): string {
  const weaknesses: Record<string, string> = {
    Fire: 'Water',
    Water: 'Electric',
    Electric: 'Ground',
    Grass: 'Fire',
    Psychic: 'Dark',
    Fighting: 'Flying',
    Dark: 'Fighting',
    Steel: 'Fire',
    Dragon: 'Ice',
    Fairy: 'Steel',
    Normal: 'Fighting',
    Flying: 'Electric',
    Poison: 'Psychic',
    Ground: 'Water',
    Rock: 'Water',
    Bug: 'Fire',
    Ghost: 'Dark',
    Ice: 'Fire',
  };

  return weaknesses[type] || 'None';
}

// Helper function for type resistances
function getResistance(type: string): string {
  const resistances: Record<string, string> = {
    Fire: 'Grass',
    Water: 'Fire',
    Electric: 'Flying',
    Grass: 'Water',
    Psychic: 'Fighting',
    Fighting: 'Dark',
    Dark: 'Psychic',
    Steel: 'Poison',
    Dragon: 'Fire',
    Fairy: 'Dragon',
    Normal: 'None',
    Flying: 'Fighting',
    Poison: 'Grass',
    Ground: 'Electric',
    Rock: 'Fire',
    Bug: 'Grass',
    Ghost: 'Normal',
    Ice: 'None',
  };

  return resistances[type] || 'None';
}

// Alternative API endpoint to get all available Pokemon IDs
export async function OPTIONS() {
  try {
    const allPokemon = loadPokemonData();
    const availableIds = allPokemon.map((p) => ({
      tokenId: p.tokenId,
      name: p.name,
      type: p.type,
      rarity: p.rarity,
    }));

    return NextResponse.json({
      success: true,
      total: availableIds.length,
      pokemon: availableIds,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load Pokemon list' },
      { status: 500 }
    );
  }
}
