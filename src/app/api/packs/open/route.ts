import pokemonList from '@/app/lib/pokemon-list.json';

export async function POST(request: Request) {
  try {
    if (!pokemonList || pokemonList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Pokémon found.', cards: [] }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const maxId = pokemonList.length;
    console.log('Max ID:', maxId);

    // Generate 5 unique random indexes
    const idSet = new Set<number>();
    while (idSet.size < 5) {
      const randomIndex = Math.floor(Math.random() * maxId);
      idSet.add(randomIndex);
    }
    const randomIndexes = Array.from(idSet);

    console.log('Selected indexes:', randomIndexes);

    // Get the cards
    const cards = randomIndexes.map((index) => {
      const p = pokemonList[index];
      return {
        id: String(p.id),
        name: p.name,
        images: { small: p.image }, // adapt to your field names
      };
    });

    return new Response(JSON.stringify({ cards }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching random cards:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', cards: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
