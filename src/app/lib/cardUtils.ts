// app/lib/cardUtils.ts
import { ethers } from "ethers";

// Valid Pokémon card rarities
export const VALID_RARITIES = [
  "common",
  "uncommon",
  "rare",
  "rare_holo",
  "rare_ultra",
  "promo",
  "rare_holo_gx",
  "rare_break",
  "rare_holo_ex",
  "rare_rainbow",
  "rare_shiny",
  "classic_collection",
  "rare_secret",
  "double_rare",
  "illustration_rare",
] as const;

export type PokemonCardRarity = (typeof VALID_RARITIES)[number];

// Map display rarities from collection to database rarities
const rarityMapping: { [key: string]: string } = {
  Common: "common",
  Uncommon: "uncommon",
  Rare: "rare",
  "Rare Holo": "rare_holo",
  "Rare Ultra": "rare_ultra",
  Promo: "promo",
  "Rare Holo GX": "rare_holo_gx",
  "Rare BREAK": "rare_break",
  "Rare Holo EX": "rare_holo_ex",
  "Rare Rainbow": "rare_rainbow",
  "Rare Shiny": "rare_shiny",
  "Classic Collection": "classic_collection",
  "Rare Secret": "rare_secret",
  "Double Rare": "double_rare",
  "Illustration Rare": "illustration_rare",
  "Ultra Rare": "rare_ultra", // Alternative mapping
};

type OwnedCard = {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  amount: string;
  rarity?: string;
  type?: string;
};

// Helper function to verify player has cards of specified rarity on blockchain
// This function should only be called from the frontend/client-side
export const verifyPlayerHasRarity = async (
  playerAddress: string,
  requiredRarity: string | null
): Promise<boolean> => {
  if (!requiredRarity) return true; // If no rarity specified, allow

  // Check if we're in a browser environment
  if (typeof window === "undefined" || !window.ethereum) {
    console.warn(
      "verifyPlayerHasRarity called in non-browser environment or no ethereum provider"
    );
    return false;
  }

  try {
    // Dynamically import the required modules
    const abi = await import("@/app/lib/pokemonCardABI.json");
    const pokemonList = await import("@/app/lib/pokemon-list.json");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractAddress =
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    if (!contractAddress) {
      throw new Error("Contract address not configured.");
    }

    const contract = new ethers.Contract(
      contractAddress,
      abi.default,
      provider
    );

    // Get all token IDs and create batch request
    const ids = pokemonList.default.map((p: any) => BigInt(p.tokenId));
    const addresses = ids.map(() => playerAddress);

    // Get balances for all cards
    const balances: bigint[] = await contract.balanceOfBatch(addresses, ids);

    // Check if player owns any cards of the required rarity
    const hasRequiredRarity = balances.some((balance, index) => {
      if (balance > 0n) {
        const cardInfo = pokemonList.default[index];
        if (cardInfo?.rarity) {
          // Map the display rarity to database rarity format
          const cardRarity =
            rarityMapping[cardInfo.rarity] ||
            cardInfo.rarity.toLowerCase().replace(/ /g, "_");
          return cardRarity === requiredRarity;
        }
      }
      return false;
    });

    return hasRequiredRarity;
  } catch (error) {
    console.error("Error verifying player cards on blockchain:", error);

    // For development, you might want to return true to bypass verification
    // For production, return false for security
    return false;
  }
};

// Helper function to get player's cards of a specific rarity from blockchain
export const getPlayerCardsByRarity = async (
  playerAddress: string,
  requiredRarity: string
): Promise<OwnedCard[]> => {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("getPlayerCardsByRarity called in non-browser environment");
  }

  try {
    const abi = await import("@/app/lib/pokemonCardABI.json");
    const pokemonList = await import("@/app/lib/pokemon-list.json");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractAddress =
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
      "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    const contract = new ethers.Contract(
      contractAddress,
      abi.default,
      provider
    );

    const ids = pokemonList.default.map((p: any) => BigInt(p.tokenId));
    const addresses = ids.map(() => playerAddress);

    const balances: bigint[] = await contract.balanceOfBatch(addresses, ids);

    // Filter cards by rarity and ownership
    const cardsOfRarity: OwnedCard[] = balances
      .map((balance, index) => {
        if (balance > 0n) {
          const cardInfo = pokemonList.default[index];
          if (cardInfo?.rarity && cardInfo?.largeImage && cardInfo?.name) {
            const cardRarity =
              rarityMapping[cardInfo.rarity] ||
              cardInfo.rarity.toLowerCase().replace(/ /g, "_");

            if (cardRarity === requiredRarity) {
              return {
                tokenId: cardInfo.tokenId,
                tcgId: cardInfo.tcgId,
                name: cardInfo.name,
                imageUrl: cardInfo.largeImage,
                amount: balance.toString(),
                rarity: cardInfo.rarity,
                type: cardInfo.type ?? "Unknown",
              };
            }
          }
        }
        return null;
      })
      .filter((card): card is OwnedCard => card !== null);

    return cardsOfRarity;
  } catch (error) {
    console.error("Error getting player cards by rarity:", error);
    throw error;
  }
};

// Helper function to get random card by rarity for battle end
export const getRandomCardByRarity = async (
  playerAddress: string,
  requiredRarity: string
): Promise<OwnedCard> => {
  try {
    const cardsOfRarity = await getPlayerCardsByRarity(
      playerAddress,
      requiredRarity
    );

    if (cardsOfRarity.length === 0) {
      throw new Error(`Player has no ${requiredRarity} cards to wager`);
    }

    // Create array with cards weighted by their amounts
    const weightedCards: OwnedCard[] = [];
    cardsOfRarity.forEach((card) => {
      const amount = parseInt(card.amount);
      for (let i = 0; i < amount; i++) {
        weightedCards.push(card);
      }
    });

    // Return random card from weighted array
    const randomIndex = Math.floor(Math.random() * weightedCards.length);
    return weightedCards[randomIndex];
  } catch (error) {
    console.error("Error getting random card by rarity:", error);
    throw error;
  }
};

// Helper function to validate rarity
export const isValidRarity = (rarity: string): rarity is PokemonCardRarity => {
  return VALID_RARITIES.includes(rarity as PokemonCardRarity);
};

// Helper function to format rarity name for display
export const formatRarityName = (rarity: string): string => {
  // Convert database format back to display format
  const reverseMapping: { [key: string]: string } = {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    rare_holo: "Rare Holo",
    rare_ultra: "Rare Ultra",
    promo: "Promo",
    rare_holo_gx: "Rare Holo GX",
    rare_break: "Rare BREAK",
    rare_holo_ex: "Rare Holo EX",
    rare_rainbow: "Rare Rainbow",
    rare_shiny: "Rare Shiny",
    classic_collection: "Classic Collection",
    rare_secret: "Rare Secret",
    double_rare: "Double Rare",
    illustration_rare: "Illustration Rare",
  };

  return (
    reverseMapping[rarity] ||
    rarity.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

// Helper function for battle end - transfer NFT ownership
export const simulateBattleEnd = async (
  winnerAddress: string,
  loserAddress: string,
  wagerRarity: string
): Promise<{ winnerCard: OwnedCard | null; loserCard: OwnedCard | null }> => {
  try {
    // Get random cards from both players
    const winnerCard = await getRandomCardByRarity(winnerAddress, wagerRarity);
    const loserCard = await getRandomCardByRarity(loserAddress, wagerRarity);

    // Note: Actual NFT transfer would require smart contract interaction
    // This is a simulation for now - you'll need to implement the actual transfer logic
    console.log(
      `Battle End: ${winnerAddress} wins ${loserCard.name} from ${loserAddress}`
    );

    return { winnerCard, loserCard };
  } catch (error) {
    console.error("Error in battle end simulation:", error);
    return { winnerCard: null, loserCard: null };
  }
};
