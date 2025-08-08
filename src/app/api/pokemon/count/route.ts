// src/app/api/pokemon/count/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Load Pokemon data and get count info
function getPokemonCountInfo() {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'pokemon-list.json'
    );

    if (!fs.existsSync(filePath)) {
      console.error('❌ pokemon-list.json not found');
      return { totalPokemon: 0, minTokenId: 1, maxTokenId: 1000, tokenIds: [] };
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const allPokemon = JSON.parse(fileContents);

    if (!Array.isArray(allPokemon) || allPokemon.length === 0) {
      console.error('❌ pokemon-list.json is empty or invalid');
      return { totalPokemon: 0, minTokenId: 1, maxTokenId: 1000, tokenIds: [] };
    }

    // Extract all token IDs from the JSON
    const tokenIds = allPokemon
      .map((pokemon) => pokemon.tokenId)
      .filter((id) => typeof id === 'number' && id > 0)
      .sort((a, b) => a - b);

    const minTokenId = Math.min(...tokenIds);
    const maxTokenId = Math.max(...tokenIds);
    const totalPokemon = tokenIds.length;

    console.log(
      `📊 Pokemon data loaded: ${totalPokemon} Pokemon, ID range: ${minTokenId}-${maxTokenId}`
    );

    return {
      totalPokemon,
      minTokenId,
      maxTokenId,
      tokenIds,
      samplePokemon: allPokemon
        .slice(0, 3)
        .map((p) => ({ tokenId: p.tokenId, name: p.name })),
    };
  } catch (err) {
    console.error('❌ Error loading Pokemon count info:', err);
    return { totalPokemon: 0, minTokenId: 1, maxTokenId: 1000, tokenIds: [] };
  }
}

export async function GET() {
  const countInfo = getPokemonCountInfo();

  return NextResponse.json(countInfo, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Type': 'application/json',
    },
  });
}
