"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import abi from "@/app/lib/pokemonCardABI.json";
import pokemonList from "@/app/lib/pokemon-list.json";
import { motion, AnimatePresence } from "framer-motion";
import EmptyDeckSlot from "@/components/deck/EmptyDeckSlot";
import DeckCard from "@/components/deck/CardDeck";
import PokemonCard from "@/components/deck/PokemonCard";
import { useRouter } from "next/navigation";
import CardFilter from "@/components/deck/CardFilter";
import { useSession } from "next-auth/react";

const MAX_DECK_SIZE = 10;

export default function NewDeckPage() {
  const { data: session } = useSession();
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCards, setSelectedCards] = useState<any[]>([]);
  const [deckName, setDeckName] = useState("");
  const [userId, setUserId] = useState<string | undefined>();
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredDeckCard, setHoveredDeckCard] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState("");
  const [selectedRarity, setSelectedRarity] = useState("");

  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      if (!window.ethereum) {
        setIsLoading(false);
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const userId = session?.user?.id;
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        setUserId(userId);
        setUserAddress(address);

        if (!contractAddress) {
          throw new Error("Contract address not configured.");
        }

        const contract = new ethers.Contract(contractAddress, abi, signer);

        const ids = pokemonList.map((p) => BigInt(p.tokenId));
        const addresses = ids.map(() => address);
        const balances: bigint[] = await contract.balanceOfBatch(
          addresses,
          ids
        );

        const owned = balances.flatMap((b, i) => {
          const info = pokemonList[i];
          const isValid =
            b > 0n &&
            info &&
            typeof info.largeImage === "string" &&
            info.largeImage.trim() !== "" &&
            typeof info.name === "string" &&
            info.name.trim() !== "" &&
            typeof info.rarity === "string" &&
            info.rarity.trim() !== "" &&
            typeof info.type === "string" &&
            info.type.trim() !== "";

          if (isValid) {
            return [
              {
                tokenId: String(info.tokenId),
                name: info.name,
                imageUrl: info.largeImage,
                amount: b.toString(),
                rarity: info.rarity,
                type: info.type,
              },
            ];
          }

          return [];
        });

        setCards(owned);
      } catch (error) {
        console.error("Error loading cards:", error);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [session]);

  const toggleCardSelection = (card: any) => {
    const isSelected = selectedCards.find((c) => c.tokenId === card.tokenId);
    if (isSelected) {
      setSelectedCards((prev) =>
        prev.filter((c) => c.tokenId !== card.tokenId)
      );
    } else if (selectedCards.length < MAX_DECK_SIZE) {
      setSelectedCards((prev) => [...prev, card]);
    }
  };

  const removeFromDeck = (tokenId: string) => {
    setSelectedCards((prev) => prev.filter((c) => c.tokenId !== tokenId));
  };

  const saveDeck = async () => {
    if (!deckName || selectedCards.length !== MAX_DECK_SIZE) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/decks/save-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deckName,
          userId: userId,
          userAddress: userAddress,
          cards: selectedCards.map((c) => ({
            tokenId: c.tokenId,
            name: c.name,
            imageUrl: c.imageUrl,
            rarity: c.rarity,
            type: c.type,
          })),
        }),
      });

      if (res.ok) {
        router.push("/deck");
      } else {
        throw new Error("Failed to save deck");
      }
    } catch (error) {
      alert("Failed to save deck. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeColor = (type: string | undefined) => {
    if (!type) return "bg-gray-500";

    switch (type.toLowerCase()) {
      case "fire":
        return "bg-red-500";
      case "water":
        return "bg-blue-500";
      case "grass":
        return "bg-green-500";
      case "electric":
        return "bg-yellow-400";
      case "psychic":
        return "bg-purple-500";
      case "fighting":
        return "bg-red-700";
      case "dark":
        return "bg-gray-800";
      case "fairy":
        return "bg-pink-400";
      case "dragon":
        return "bg-indigo-600";
      default:
        return "bg-gray-500";
    }
  };

  const allTypes = [...new Set(cards.map((c) => c.type))].filter(Boolean);
  const allRarities = [...new Set(cards.map((c) => c.rarity))].filter(Boolean);

  const filteredCards = cards.filter((card) => {
    const typeMatch = selectedType ? card.type === selectedType : true;
    const rarityMatch = selectedRarity ? card.rarity === selectedRarity : true;
    return typeMatch && rarityMatch;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.push("/deck")}
            className="group mb-8 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-purple-400/50 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Decks
            </span>
          </motion.button>

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 mb-4">
              ⚡ Build Your Deck
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
              Choose {MAX_DECK_SIZE} powerful Pokémon cards to create the
              ultimate deck.
              <br /> Strategy meets collection in this epic journey.
            </p>

            {/* Deck Name Input & Save Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <div className="relative flex-1 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Enter your deck name..."
                  className="w-full px-6 py-4 text-white placeholder-gray-400 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all shadow-lg"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                />
              </div>
              <button
                disabled={
                  selectedCards.length !== MAX_DECK_SIZE ||
                  !deckName ||
                  isSaving
                }
                onClick={saveDeck}
                className={`group relative px-8 py-4 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${
                  selectedCards.length === MAX_DECK_SIZE &&
                  deckName &&
                  !isSaving
                    ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white hover:shadow-2xl hover:shadow-green-500/25"
                    : "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Save Deck</span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Selected Cards Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  Your Deck Composition
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300 font-medium">
                      {selectedCards.length}/{MAX_DECK_SIZE} cards selected
                    </span>
                  </div>
                  {selectedCards.length === MAX_DECK_SIZE && (
                    <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium border border-green-500/30">
                      Deck Complete! ✨
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <AnimatePresence>
                  {selectedCards.map((card, index) => (
                    <motion.div
                      key={card.tokenId}
                      initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <DeckCard
                        card={card}
                        onRemove={removeFromDeck}
                        hovered={hoveredDeckCard === card.tokenId}
                        onHoverStart={() => setHoveredDeckCard(card.tokenId)}
                        onHoverEnd={() => setHoveredDeckCard(null)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {Array(MAX_DECK_SIZE - selectedCards.length)
                  .fill(0)
                  .map((_, i) => (
                    <motion.div
                      key={`empty-${i}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (selectedCards.length + i) * 0.1 }}
                    >
                      <EmptyDeckSlot />
                    </motion.div>
                  ))}
              </div>
            </div>
          </motion.div>

          {/* Filter Component */}
          <CardFilter
            types={allTypes}
            rarities={allRarities}
            selectedType={selectedType}
            selectedRarity={selectedRarity}
            onTypeChange={setSelectedType}
            onRarityChange={setSelectedRarity}
          />

          {/* Available Cards Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-2">
                Available Pokémon Cards
              </h2>
              <p className="text-gray-400">
                {filteredCards.length} cards available • Click to add to your
                deck
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-purple-200/20 rounded-full animate-spin">
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin"></div>
                  </div>
                </div>
                <p className="text-gray-400 text-lg">
                  Loading your collection...
                </p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-16 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No cards found
                </h3>
                <p className="text-gray-400">
                  Try adjusting your filters or check your collection
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.02 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
              >
                {filteredCards
                  .filter(
                    (card) =>
                      card &&
                      card.tokenId &&
                      typeof card.imageUrl === "string" &&
                      card.imageUrl.trim() !== ""
                  )
                  .map((card, index) => {
                    const isSelected = selectedCards.find(
                      (c) => c.tokenId === card.tokenId
                    );
                    const key = card.tokenId ?? `card-${index}`;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <PokemonCard
                          card={card}
                          isSelected={!!isSelected}
                          onClick={() => toggleCardSelection(card)}
                          onHoverStart={() => setHoveredCard(card.tokenId)}
                          onHoverEnd={() => setHoveredCard(null)}
                          hovered={hoveredCard === card.tokenId}
                          getTypeColor={getTypeColor}
                        />
                      </motion.div>
                    );
                  })}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
