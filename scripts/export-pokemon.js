import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportPokemonList() {
  const pokemon = await prisma.pokemon.findMany({
    orderBy: { id: 'asc' },
  });

  // Transform into your desired format
  const list = pokemon.map((p) => ({
    id: p.id,
    name: p.name,
    image: p.imageUri,
    description: p.description,
    type: p.type,
    rarity: p.rarity,
  }));

  fs.writeFileSync('./pokemon-list.json', JSON.stringify(list, null, 2));

  console.log(`✅ Exported ${list.length} Pokémon to pokemon-list.json`);

  await prisma.$disconnect();
}

exportPokemonList();
