import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://api.pokemontcg.io/v2/cards', {
    headers: {
      'X-Api-Key': process.env.POKEMON_TCG_API_KEY!,
    },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
