import pokemonList from '@/app/lib/pokemon-list.json';

export async function POST(request: Request) {
  try {
    if (!pokemonList || pokemonList.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No Pokémon found.', cards: [] }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const maxIndex = pokemonList.length;
    console.log('Max Index:', maxIndex);

    // Generate 5 unique random indexes
    const idSet = new Set<number>();
    while (idSet.size < 5) {
      const randomIndex = Math.floor(Math.random() * maxIndex);
      idSet.add(randomIndex);
    }
    const randomIndexes = Array.from(idSet);

    console.log('Selected indexes:', randomIndexes);

    // Build the cards array
    const cards = randomIndexes.map((index) => {
      const p = pokemonList[index];
      return {
        tokenId: p.tokenId, // numeric tokenId
        tcgId: p.tcgId, // string TCG ID (like "det1-1")
        name: p.name,
        imageUrl: p.largeImage,
        rarity: p.rarity,
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
