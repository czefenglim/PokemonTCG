import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

/* ──────────────────────────────────────────────────────────────
   Types for card JSON
─────────────────────────────────────────────────────────────── */
interface PokemonCard {
  tokenId: number;
  tcgId: string;
  name: string;
  smallImage: string;
  largeImage: string;
  type: string; // e.g. "Fire", "Water", "Lightning", "Darkness", "Colorless"
  hp: number;
  attacks: Array<{ name: string; damage: number; cost: string[] }>;
  weaknesses: Array<{ type: string; value: string }>;
  resistances: Array<{ type: string; value: string }>;
  rarity: string;
}

/* ──────────────────────────────────────────────────────────────
   Canonical element mapping from card data → our enum family
   (We’ll canonicalize to upper-case names we prefer, then adapt
   at runtime to the actual DB enum set via resolveElementValue)
─────────────────────────────────────────────────────────────── */
const CARD_ELEMENT_TO_CANON: Record<string, string> = {
  Fire: 'FIRE',
  Water: 'WATER',
  Grass: 'GRASS',
  Lightning: 'ELECTRIC', // may map to LIGHTNING at runtime
  Psychic: 'PSYCHIC',
  Fighting: 'FIGHTING',
  Darkness: 'DARK', // may map to DARKNESS at runtime
  Metal: 'METAL',
  Dragon: 'DRAGON',
  Fairy: 'FAIRY',
  Colorless: 'COLORLESS',
};

/* ──────────────────────────────────────────────────────────────
   Opponent templates
─────────────────────────────────────────────────────────────── */
const AI_OPPONENTS = {
  FIRE: {
    EASY: {
      name: 'Rookie Flametamer',
      intro: 'A beginner trainer with fiery spirits!',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/base1/4.png',
    },
    MEDIUM: {
      name: 'Blazing Veteran',
      intro: 'Experienced with fire-type strategies.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/base1/4.png',
    },
    HARD: {
      name: 'Inferno Master',
      intro: 'The ultimate fire-type specialist!',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/base1/4.png',
    },
  },
  WATER: {
    EASY: {
      name: 'Tide Pool Trainer',
      intro: 'Learning the ways of water Pokemon.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/base1/2.png',
    },
    MEDIUM: {
      name: 'Ocean Navigator',
      intro: 'Rides the waves with confidence.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/base1/2.png',
    },
    HARD: {
      name: 'Tsunami Lord',
      intro: 'Commands the fury of the seas!',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/base1/2.png',
    },
  },
  GRASS: {
    EASY: {
      name: 'Garden Apprentice',
      intro: 'Growing stronger with nature.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/base1/15.png',
    },
    MEDIUM: {
      name: 'Forest Guardian',
      intro: 'Protects the woodland realm.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/base1/15.png',
    },
    HARD: {
      name: "Nature's Wrath",
      intro: 'One with the ancient forest spirits.',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/base1/15.png',
    },
  },
  ELECTRIC: {
    EASY: {
      name: 'Spark Rookie',
      intro: 'Just learning to harness electricity.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/base1/58.png',
    },
    MEDIUM: {
      name: 'Thunder Striker',
      intro: 'Lightning fast and deadly accurate.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/base1/58.png',
    },
    HARD: {
      name: 'Storm Emperor',
      intro: 'Master of thunder and lightning!',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/base1/58.png',
    },
  },
  PSYCHIC: {
    EASY: {
      name: 'Mind Reader',
      intro: 'Developing psychic abilities.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/base1/10.png',
    },
    MEDIUM: {
      name: 'Telekinetic Sage',
      intro: 'Bends reality with mental power.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/base1/10.png',
    },
    HARD: {
      name: 'Psychic Overlord',
      intro: 'Transcended mortal limitations.',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/base1/10.png',
    },
  },
  FIGHTING: {
    EASY: {
      name: 'Dojo Student',
      intro: 'Training hard every day!',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/base1/7.png',
    },
    MEDIUM: {
      name: 'Martial Artist',
      intro: 'Disciplined in combat arts.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/base1/7.png',
    },
    HARD: {
      name: 'Fighting Legend',
      intro: 'Undefeated in countless battles!',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/base1/7.png',
    },
  },
  DARK: {
    EASY: {
      name: 'Shadow Novice',
      intro: 'Learning the dark arts.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/base4/8.png',
    },
    MEDIUM: {
      name: 'Night Stalker',
      intro: 'Strikes from the shadows.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/base4/8.png',
    },
    HARD: {
      name: 'Darkness Incarnate',
      intro: 'Embraced by eternal shadow.',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/base4/8.png',
    },
  },
  METAL: {
    EASY: {
      name: 'Steel Cadet',
      intro: 'Forging strength through metal.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/ex12/15.png',
    },
    MEDIUM: {
      name: 'Iron Commander',
      intro: 'Unbreakable will and armor.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/ex12/15.png',
    },
    HARD: {
      name: 'Titanium Warlord',
      intro: 'Forged in the heart of stars!',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/ex12/15.png',
    },
  },
  DRAGON: {
    EASY: {
      name: 'Dragon Tamer',
      intro: 'Young but brave dragon trainer.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/ex12/18.png',
    },
    MEDIUM: {
      name: 'Dragonlord',
      intro: 'Commands ancient dragon power.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/ex12/18.png',
    },
    HARD: {
      name: 'Elder Wyrm',
      intro: 'Ancient keeper of dragon secrets!',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/ex12/18.png',
    },
  },
  FAIRY: {
    EASY: {
      name: 'Fairy Friend',
      intro: 'Blessed by fairy magic.',
      rewardCoins: 50,
      portraitUrl: 'https://images.pokemontcg.io/xy1/140.png',
    },
    MEDIUM: {
      name: 'Enchanter',
      intro: 'Weaves spells of wonder.',
      rewardCoins: 75,
      portraitUrl: 'https://images.pokemontcg.io/xy1/140.png',
    },
    HARD: {
      name: 'Fairy Godmother',
      intro: 'Guardian of mystical realms!',
      rewardCoins: 100,
      portraitUrl: 'https://images.pokemontcg.io/xy1/140.png',
    },
  },
} as const;

/* ──────────────────────────────────────────────────────────────
   Load cards JSON
─────────────────────────────────────────────────────────────── */
async function loadPokemonData(): Promise<PokemonCard[]> {
  const jsonPath = path.join(
    process.cwd(),
    'src',
    'lib',
    'data',
    'pokemon-list.json'
  );
  const jsonData = await fs.readFile(jsonPath, 'utf-8');
  const pokemonData: PokemonCard[] = JSON.parse(jsonData);
  console.log(`📦 Loaded ${pokemonData.length} cards from pokemon-list.json`);
  return pokemonData;
}

/* ──────────────────────────────────────────────────────────────
   Data helpers
─────────────────────────────────────────────────────────────── */
function filterCardsByTypeAndDifficulty(
  cards: PokemonCard[],
  canonType: string, // e.g. 'FIRE', 'ELECTRIC', 'DARK'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
): PokemonCard[] {
  const typeCards = cards.filter(
    (card) => CARD_ELEMENT_TO_CANON[card.type] === canonType
  );

  const filtered = typeCards.filter((card) => {
    if (!card.hp || !card.attacks?.length) return false;
    const maxEnergyCost = Math.max(
      ...card.attacks.map((a) => a.cost?.length ?? 0)
    );
    switch (difficulty) {
      case 'EASY':
        return card.hp >= 60 && card.hp <= 100 && maxEnergyCost <= 2;
      case 'MEDIUM':
        return (
          card.hp >= 100 &&
          card.hp <= 150 &&
          maxEnergyCost >= 2 &&
          maxEnergyCost <= 3
        );
      case 'HARD':
        return card.hp >= 150 && maxEnergyCost >= 3;
      default:
        return false;
    }
  });

  console.log(
    `🔍 ${canonType} ${difficulty}: ${filtered.length} suitable cards`
  );
  return filtered;
}

function createBalancedDeck(cards: PokemonCard[], targetSize = 10): string[] {
  if (cards.length === 0) return [];
  if (cards.length <= targetSize) return cards.map((c) => String(c.tokenId));

  const rarityOrder: Record<string, number> = {
    Common: 1,
    Uncommon: 2,
    Rare: 3,
    'Rare Holo': 4,
  };
  const sorted = [...cards].sort((a, b) => {
    const ra = rarityOrder[a.rarity] ?? 1;
    const rb = rarityOrder[b.rarity] ?? 1;
    if (ra !== rb) return rb - ra;
    return b.hp - a.hp;
  });

  const selected: PokemonCard[] = [];
  // top ~30%
  selected.push(...sorted.slice(0, Math.floor(targetSize * 0.3)));
  // middle slice
  const midStart = Math.floor(sorted.length * 0.2);
  selected.push(
    ...sorted.slice(midStart, midStart + Math.floor(targetSize * 0.5))
  );
  // random rest
  const pool = sorted.filter(
    (c) => !selected.some((s) => s.tokenId === c.tokenId)
  );
  selected.push(
    ...pool
      .sort(() => Math.random() - 0.5)
      .slice(0, targetSize - selected.length)
  );

  return selected.map((c) => String(c.tokenId));
}

/* ──────────────────────────────────────────────────────────────
   ENUM ADAPTER: detect allowed enum values from MySQL
   and map ELECTRIC<->LIGHTNING, DARK<->DARKNESS automatically
─────────────────────────────────────────────────────────────── */
async function getAllowedEnumValues(
  table: string,
  column: string
): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<
    { COLUMN_TYPE: string }[]
  >`SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ${table} AND COLUMN_NAME = ${column}`;

  const raw = rows[0]?.COLUMN_TYPE ?? '';
  // raw looks like: enum('FIRE','WATER',...)
  const values = raw
    .replace(/^enum\(/i, '')
    .replace(/\)$/, '')
    .split(',')
    .map((s) => s.trim().replace(/^'(.*)'$/, '$1'))
    .filter(Boolean);

  return new Set(values);
}

function resolveElementValue(canon: string, allowed: Set<string>): string {
  // Prefer the canonical value
  if (allowed.has(canon)) return canon;

  // Fallbacks for schema variants
  if (canon === 'ELECTRIC' && allowed.has('LIGHTNING')) return 'LIGHTNING';
  if (canon === 'DARK' && allowed.has('DARKNESS')) return 'DARKNESS';

  // If neither is allowed, fail loudly with context
  throw new Error(
    `Element "${canon}" not allowed by DB enum. Allowed: ${[...allowed].join(
      ', '
    )}`
  );
}

/* ──────────────────────────────────────────────────────────────
   Main
─────────────────────────────────────────────────────────────── */
async function main() {
  console.log('🚀 Starting AI Deck & Opponent Seeder...\n');

  const pokemonCards = await loadPokemonData();

  // Detect the actual enum set in the database
  const allowedElements = await getAllowedEnumValues('ai_deck', 'element');
  console.log(
    '✅ Allowed ElementType values in DB:',
    [...allowedElements].join(', ')
  );

  console.log('🧹 Cleaning existing AI data...');
  await prisma.opponent.deleteMany();
  await prisma.aIDeck.deleteMany();
  console.log('✅ Cleared\n');

  const difficulties: Array<'EASY' | 'MEDIUM' | 'HARD'> = [
    'EASY',
    'MEDIUM',
    'HARD',
  ];
  const elements = Object.keys(AI_OPPONENTS) as Array<
    keyof typeof AI_OPPONENTS
  >; // FIRE, WATER, ELECTRIC, ...

  let deckCount = 0;
  let opponentCount = 0;

  for (const difficulty of difficulties) {
    console.log(`📋 Creating ${difficulty} difficulty decks...\n`);
    for (const canonElement of elements) {
      console.log(`  🎯 ${canonElement} ${difficulty}`);

      const available = filterCardsByTypeAndDifficulty(
        pokemonCards,
        canonElement,
        difficulty
      );
      if (available.length === 0) {
        console.warn(`    ⚠️ Skipped: no suitable cards`);
        continue;
      }

      const deckCards = createBalancedDeck(available, 10);
      if (deckCards.length === 0) {
        console.warn(`    ⚠️ Skipped: failed to build deck`);
        continue;
      }

      // Map canonical element to an actually-allowed enum value in DB
      const elementForDb = resolveElementValue(canonElement, allowedElements);
      // Difficulty is consistent across schemas ('EASY'|'MEDIUM'|'HARD'), so pass straight through

      const aiDeck = await prisma.aIDeck.create({
        data: {
          name: `${canonElement} ${difficulty} Deck`,
          difficulty, // 'EASY' | 'MEDIUM' | 'HARD'
          element: elementForDb as unknown as Prisma.ElementType, // runtime-safe
          cards: deckCards as unknown as Prisma.JsonArray,
        },
      });
      deckCount++;
      console.log(`    ✅ Deck: ${aiDeck.name} (${deckCards.length})`);

      const meta = AI_OPPONENTS[canonElement][difficulty];
      const opponent = await prisma.opponent.create({
        data: {
          name: meta.name,
          portraitUrl: meta.portraitUrl,
          intro: meta.intro,
          rewardCoins: meta.rewardCoins,
          difficulty,
          element: elementForDb as unknown as Prisma.ElementType,
          deckId: aiDeck.id,
          unlocked: true,
        },
      });
      opponentCount++;
      console.log(`    ✅ Opponent: ${opponent.name}\n`);
    }
  }

  console.log('🎉 Done!');
  console.log(`  Decks: ${deckCount}`);
  console.log(`  Opponents: ${opponentCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default main;
