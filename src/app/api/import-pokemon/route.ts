import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  const pokemonIds = Array.from({ length: 151 }, (_, i) => i + 1);

  for (const id of pokemonIds) {
    try {
      const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!pokeRes.ok) {
        console.error(`Failed to fetch Pokémon ${id}`);
        continue;
      }
      const pokeData = await pokeRes.json();

      const speciesRes = await fetch(pokeData.species.url);
      let description = 'No description available';
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        const entry = speciesData.flavor_text_entries.find(
          (e) => e.language.name === 'en'
        );
        if (entry) {
          description = entry.flavor_text.replace(/\n|\f/g, ' ').trim();
        }
      }

      const name =
        pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1);
      const type = pokeData.types[0].type.name;
      const rarity = 'Common';
      const imageUri = pokeData.sprites.other['official-artwork'].front_default;
      const createdAt = new Date();

      await prisma.pokemon.upsert({
        where: { id },
        update: {
          name,
          type,
          rarity,
          imageUri,
          description,
          createdAt,
        },
        create: {
          id,
          name,
          type,
          rarity,
          imageUri,
          description,
          createdAt,
        },
      });

      console.log(`✅ Imported ${name}`);
    } catch (error) {
      console.error(`Error processing Pokémon ${id}:`, error);
    }
  }

  await prisma.$disconnect();

  return new Response(JSON.stringify({ message: '✅ Import complete' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
