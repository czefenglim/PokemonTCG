import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// If using Node <18:
// import fetch from "node-fetch";

async function exportGen1Pokemon() {
  console.log(`🔍 Fetching ALL Pokémon cards...`);

  let allCards = [];
  let page = 1;
  const pageSize = 250;
  let totalPages = 1;

  do {
    const res = await fetch(
      `https://api.pokemontcg.io/v2/cards?page=${page}&pageSize=${pageSize}`,
      {
        headers: {
          'X-Api-Key': process.env.POKEMON_API_KEY,
        },
      }
    );

    if (!res.ok) {
      console.warn(`⚠️ Skipping page ${page}: ${res.statusText}`);
      page++;
      continue;
    }

    const data = await res.json();
    allCards = allCards.concat(data.data);

    if (page === 1) {
      const totalCount = data.totalCount;
      totalPages = Math.ceil(totalCount / pageSize);
      console.log(`✅ Found ${totalCount} total cards (${totalPages} pages)`);
    }

    page++;
  } while (page <= totalPages);

  console.log(`✅ Fetched ${allCards.length} total cards.`);

  const gen1Cards = allCards.filter(
    (card) =>
      card.nationalPokedexNumbers &&
      card.nationalPokedexNumbers.some((num) => num >= 1 && num <= 151)
  );

  console.log(`✅ Found ${gen1Cards.length} Gen 1 cards.`);

  const list = gen1Cards.map((card, index) => ({
    tokenId: index + 1, // numeric token ID for ERC1155
    tcgId: card.id, // string TCG ID for display
    name: card.name,
    smallImage: card.images.small,
    largeImage: card.images.large,
    description: '',
    type: card.types?.[0] || 'Unknown',
    rarity: card.rarity || 'Common',
  }));

  fs.writeFileSync(
    'src/app/lib/pokemon-list.json',
    JSON.stringify(list, null, 2)
  );

  console.log(
    `✅ Exported ${list.length} Gen 1 Pokémon cards to src/app/lib/pokemon-list.json`
  );
}

exportGen1Pokemon();
