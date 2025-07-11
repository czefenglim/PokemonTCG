// app/api/packs/open/route.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // In real life, you'd:
  // 1. Check user session
  // 2. Verify cooldown
  // 3. Update inventory

  // Randomly pick 5 Pokémon from your DB
  const cards = await prisma.pokemon.findMany({
    orderBy: { id: 'asc' },
    take: 5,
    skip: Math.floor(Math.random() * (151 - 5)), // If you have 151 Pokémon
  });

  // Map to your desired output format
  const result = cards.map((card) => ({
    id: String(card.id),
    name: card.name,
    images: { small: card.imageUri },
  }));

  return Response.json({ cards: result });
}
