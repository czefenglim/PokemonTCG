// src/app/api/pokemon/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import abi from '@/lib/pokemonCardABI.json';
import path from 'path';
import { promises as fsp } from 'fs';
import { ipfsToHttp } from '@/lib/ipfs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/* ----------------------------- Local JSON fallback (async) ----------------------------- */
async function loadLocalPokemonData() {
  try {
    const filePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'pokemon-list.json'
    );
    const fileContents = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (err) {
    console.error('Error loading local JSON:', err);
    return [];
  }
}

/* ----------------------------- Self-referencing guard ----------------------------- */
function isSelfReferencing(url: string): boolean {
  const selfPatterns = [
    'localhost:3000/api/pokemon',
    '127.0.0.1:3000/api/pokemon',
    'http://localhost:3000/api/pokemon',
    'https://localhost:3000/api/pokemon',
  ];
  return selfPatterns.some((pattern) => url.includes(pattern));
}

/* ----------------------------- IPFS multi-gateway helpers ----------------------------- */
const IPFS_GATEWAYS = [
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://ipfs.infura.io/ipfs/',
];

function toGatewayUrl(gateway: string, ipfsUrl: string) {
  return ipfsUrl.startsWith('ipfs://')
    ? ipfsUrl.replace('ipfs://', gateway)
    : ipfsUrl;
}

async function fetchJsonFromGateways(
  ipfsUrl: string,
  timeoutMs = 20_000,
  retriesPerGateway = 1
) {
  let lastErr: any;
  for (const gw of IPFS_GATEWAYS) {
    const httpUrl = toGatewayUrl(gw, ipfsUrl);
    for (let attempt = 0; attempt <= retriesPerGateway; attempt++) {
      try {
        const res = await fetch(httpUrl, {
          headers: { 'User-Agent': 'Pokemon-TCG-App/1.0' },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return await res.json();
      } catch (e) {
        lastErr = e;
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
    }
  }
  throw lastErr ?? new Error('All IPFS gateways failed');
}

/* ----------------------------- Helper: get id from ctx.params (sync or async) --------- */
async function getIdFromParams(
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
): Promise<string> {
  // Works whether ctx.params is already an object or a Promise
  const { id } = await Promise.resolve((ctx as any).params);
  return id;
}

/* ----------------------------------- Route ----------------------------------- */
export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const id = await getIdFromParams(ctx); // ✅ await params (compat with both forms)
    const tokenId = parseInt(id, 10);
    if (Number.isNaN(tokenId) || tokenId <= 0) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    console.log(`🎯 API called for token ${tokenId}`);

    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!rpcUrl || !contractAddress) {
      console.error('Missing RPC_URL or NEXT_PUBLIC_CONTRACT_ADDRESS');
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      );
    }

    // Connect to the blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // 1) Get token URI from contract
    let tokenUri: string | undefined;
    try {
      tokenUri = await contract.uri(tokenId);
      console.log('📍 Token URI from contract:', tokenUri);

      // Replace {id} placeholder if present
      tokenUri = tokenUri.replace('{id}', tokenId.toString());

      // If IPFS layout is /<id>.json, enforce suffix when missing
      if (tokenUri.startsWith('ipfs://') && !tokenUri.endsWith('.json')) {
        tokenUri = `${tokenUri}.json`;
      }

      console.log('📍 Processed Token URI:', tokenUri);
    } catch (err) {
      console.warn('⚠️ Failed to get URI from contract:', err);
    }

    // 2) Try IPFS (unless self-referencing)
    let metadata: any;

    if (tokenUri && !isSelfReferencing(tokenUri)) {
      try {
        console.log('🌐 Fetching from IPFS via gateways:', tokenUri);
        metadata = await fetchJsonFromGateways(tokenUri, 20_000, 1);

        if (!metadata?.name && !metadata?.image) {
          throw new Error('Invalid metadata structure');
        }
      } catch (err) {
        console.warn('⚠️ IPFS fetch failed across gateways:', err);
        metadata = null;
      }
    } else if (tokenUri) {
      console.warn('🔄 Self-referencing URI detected, skipping external fetch');
      metadata = null;
    }

    // 3) Fallback to local JSON if IPFS failed
    if (!metadata) {
      console.log(`📁 Using local JSON fallback for token ${tokenId}`);
      const allPokemon = await loadLocalPokemonData();
      const pokemon = allPokemon.find((p: any) => p.tokenId === tokenId);

      if (!pokemon) {
        console.error(
          `❌ Pokemon not found in local data for token ${tokenId}`
        );
        return NextResponse.json(
          { error: 'Pokemon not found' },
          { status: 404 }
        );
      }

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

    // (Optional) include original on-chain URI for debugging
    if (tokenUri) {
      metadata.onchainUri = tokenUri;
    }

    // 4) Normalize image fields for the browser
    if (metadata?.image) {
      metadata.image = ipfsToHttp(metadata.image);
    }
    if (metadata?.image_url) {
      metadata.image_url = ipfsToHttp(metadata.image_url);
    }

    // 5) Ensure gameData exists for frontend compatibility
    if (!metadata.gameData && metadata.attributes) {
      metadata.gameData = {
        tcgId: metadata.attributes.find((a: any) => a.trait_type === 'TCG ID')
          ?.value,
        rarity: metadata.attributes.find((a: any) => a.trait_type === 'Rarity')
          ?.value,
        type: metadata.attributes.find((a: any) => a.trait_type === 'Type')
          ?.value,
        strikePower: metadata.attributes.find(
          (a: any) => a.trait_type === 'Strike Power'
        )?.value,
        battleRating: metadata.attributes.find(
          (a: any) => a.trait_type === 'Battle Rating'
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
