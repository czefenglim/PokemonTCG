import { NextResponse } from 'next/server';
import pokemonList from '@/lib/data/pokemon-list.json';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Missing token ID' }, { status: 400 });
  }

  const tokenId = Number(id);
  const card = pokemonList.find((p) => Number(p.tokenId) === tokenId);

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  return NextResponse.json({
    imageUrl: card.largeImage,
    name: card.name,
    tokenId: card.tokenId,
    rarity: card.rarity ?? 'Common',
    type: card.type ?? 'Unknown',
  });
}
