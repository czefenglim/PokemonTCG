//src\app\lib\pve\cards.ts
import { CardData } from '@/lib/battle-pve/types';

// In-memory cache for card data
let cardCache: Map<string, CardData> | null = null;
let cacheLoadPromise: Promise<Map<string, CardData>> | null = null;

/**
 * Load and cache all Pokemon card data from pokemon-list.json
 * Uses read-through cache pattern for optimal performance
 */
export async function loadCardIndex(): Promise<Map<string, CardData>> {
  // Return cache if already loaded
  if (cardCache) {
    return cardCache;
  }

  // If already loading, return the existing promise
  if (cacheLoadPromise) {
    return cacheLoadPromise;
  }

  // Create new load promise
  cacheLoadPromise = loadCardsFromFile();

  try {
    cardCache = await cacheLoadPromise;
    return cardCache;
  } catch (error) {
    // Reset promise on error so we can retry
    cacheLoadPromise = null;
    throw error;
  }
}

/**
 * Internal function to load cards from JSON file
 */
async function loadCardsFromFile(): Promise<Map<string, CardData>> {
  try {
    // Import the JSON file from your lib folder (Next.js will handle this at build time)
    const cardData = await import('@/lib/data/pokemon-list.json');
    const cards = cardData.default;

    if (!Array.isArray(cards)) {
      throw new Error('Invalid pokemon-list.json: expected array');
    }

    const cardMap = new Map<string, CardData>();

    for (const card of cards) {
      // Validate required fields
      if (!card.tokenId || !card.name || !card.type) {
        console.warn('Skipping invalid card:', card);
        continue;
      }

      // Use tokenId as key (convert to string for consistency)
      const cardId = String(card.tokenId);

      cardMap.set(cardId, {
        tokenId: card.tokenId,
        tcgId: card.tcgId,
        name: card.name,
        smallImage: card.smallImage,
        largeImage: card.largeImage,
        type: card.type,
        hp: card.hp,
        attacks: card.attacks || [],
        weaknesses: card.weaknesses || [],
        resistances: card.resistances || [],
        rarity: card.rarity,
      });
    }

    console.log(`Loaded ${cardMap.size} cards into cache`);
    return cardMap;
  } catch (error) {
    console.error('Failed to load pokemon-list.json:', error);
    throw new Error('Failed to load card data');
  }
}

/**
 * Get a specific card by tokenId
 */
export async function getCard(
  tokenId: string | number
): Promise<CardData | null> {
  const cardMap = await loadCardIndex();
  return cardMap.get(String(tokenId)) || null;
}

/**
 * Get multiple cards by tokenIds
 */
export async function getCards(
  tokenIds: (string | number)[]
): Promise<CardData[]> {
  const cardMap = await loadCardIndex();
  const cards: CardData[] = [];

  for (const tokenId of tokenIds) {
    const card = cardMap.get(String(tokenId));
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Get cards by type (useful for building AI decks)
 */
export async function getCardsByType(type: string): Promise<CardData[]> {
  const cardMap = await loadCardIndex();
  const cards: CardData[] = [];

  for (const card of cardMap.values()) {
    if (card.type.toLowerCase() === type.toLowerCase()) {
      cards.push(card);
    }
  }

  return cards;
}

/**
 * Get random cards (useful for generating AI decks)
 */
export async function getRandomCards(
  count: number,
  type?: string
): Promise<CardData[]> {
  let allCards: CardData[];

  if (type) {
    allCards = await getCardsByType(type);
  } else {
    const cardMap = await loadCardIndex();
    allCards = Array.from(cardMap.values());
  }

  // Shuffle and take requested count
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Clear the cache (useful for testing or memory management)
 */
export function clearCardCache(): void {
  cardCache = null;
  cacheLoadPromise = null;
}
