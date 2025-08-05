// /app/lib/cardUtils.ts
import pokemonList from "@/app/lib/pokemon-list.json";

export function getCardMetadataById(tokenId: number) {
  const card = pokemonList.find((p) => Number(p.tokenId) === tokenId);

  if (!card) {
    throw new Error("Card not found");
  }

  return {
    tokenId: card.tokenId,
    name: card.name,
    imageUrl: card.largeImage,
    rarity: card.rarity ?? "Common",
    type: card.type ?? "Unknown",
    tcgId: card.tcgId,
  };
}
