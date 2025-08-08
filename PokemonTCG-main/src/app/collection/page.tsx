// /collection/page.tsx

"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import abi from "@/app/lib/pokemonCardABI.json";
import pokemonList from "@/app/lib/pokemon-list.json";

type OwnedCard = {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  amount: string;
  rarity?: string;
  type?: string;
};

export default function CollectionPage() {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const loadCollection = async (userAddress: string) => {
    setLoading(true);
    setCards([]);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error("Contract address not configured.");
      }

      const contract = new ethers.Contract(contractAddress, abi, signer);

      const ids = pokemonList.map((p) => BigInt(p.tokenId));
      const addresses = ids.map(() => userAddress);

      const balances: bigint[] = await contract.balanceOfBatch(addresses, ids);

      const owned: OwnedCard[] = balances.flatMap((b, i) => {
        const info = pokemonList[i];

        if (b > 0n && info?.largeImage && info?.name) {
          return [
            {
              tokenId: info.tokenId,
              tcgId: info.tcgId,
              name: info.name,
              imageUrl: info.largeImage,
              amount: b.toString(),
              rarity: info.rarity ?? "Common",
              type: info.type ?? "Unknown",
            },
          ];
        }

        // Always return empty array for invalid entries
        return [];
      });

      // Optional: double check you're only storing valid objects
      const cleaned = owned.filter(
        (c) => !!c.imageUrl && !!c.name && !!c.tokenId
      );
      setCards(cleaned);
    } catch (err) {
      console.error(err);
      alert(`Error loading collection: ${(err as any).message}`);
    }
    setLoading(false);
  };

  const checkConnection = async () => {
    if (!window.ethereum) {
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_accounts", []);
    if (accounts.length > 0) {
      setAddress(accounts[0]);
      await loadCollection(accounts[0]);
    } else {
      setAddress(null);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const rarityOptions = [
    "All",
    ...Array.from(new Set(cards.map((c) => c.rarity).filter(Boolean))),
  ];

  const typeOptions = [
    "All",
    ...Array.from(new Set(cards.map((c) => c.type).filter(Boolean))),
  ];

  const filteredCards = cards.filter((c) => {
    const matchesRarity = rarityFilter === "All" || c.rarity === rarityFilter;
    const matchesType = typeFilter === "All" || c.type === typeFilter;
    return matchesRarity && matchesType;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 flex flex-col items-center">
      {/* ❌ No Wallet Connected */}
      {!address && (
        <p className="text-yellow-200 mt-6">
          Please connect your wallet using the sidebar to view your collection.
        </p>
      )}

      {/* ✅ Wallet Connected */}
      {address && (
        <>
          {/* 🎛️ Filter Controls + Refresh */}
          <div className="w-full max-w-5xl bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* 🔘 Rarity Filter */}
              <div className="flex items-center">
                <label className="mr-2 text-yellow-200">Rarity:</label>
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-yellow-100 rounded px-2 py-1"
                >
                  {rarityOptions.map((rarity) => (
                    <option key={rarity} value={rarity}>
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>

              {/* 🔘 Type Filter */}
              <div className="flex items-center">
                <label className="mr-2 text-yellow-200">Type:</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-gray-900 border border-gray-700 text-yellow-100 rounded px-2 py-1"
                >
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 🔄 Refresh Button */}
            <button
              onClick={() => loadCollection(address)}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-1 rounded transition"
            >
              Refresh
            </button>
          </div>

          {/* ⏳ Loading State */}
          {loading ? (
            <div className="flex items-center space-x-2 text-yellow-200">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Loading your collection...</span>
            </div>
          ) : cards.length === 0 ? (
            // 📭 No Cards Owned
            <div className="max-w-lg w-full bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700 rounded-2xl shadow-xl p-8 flex flex-col items-center text-yellow-200 text-center">
              {/* 📭 Icon */}
              <svg
                className="w-16 h-16 mb-4 text-yellow-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>

              {/* 📢 Main Message */}
              <h2 className="text-xl font-bold mb-2">
                Your Collection is Empty
              </h2>
              <p className="text-sm text-yellow-300 mb-6">
                You haven't collected any Pokémon cards yet. Start building your
                legendary collection today!
              </p>

              {/* 🚀 Call to Action */}
              <button
                onClick={() => (window.location.href = "/packs")} // or your routing handler
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition"
              >
                Open Packs
              </button>
            </div>
          ) : filteredCards.length === 0 ? (
            // 🚫 No Matches After Filtering
            <div className="text-yellow-200 text-center">
              No cards match your current filters.
            </div>
          ) : (
            // 🎴 Display Filtered Cards
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
              {filteredCards.map((card) => (
                <motion.div
                  key={`${card.tokenId}-${card.tcgId}`} // ✅ Fixed unique key
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                  className={`
                  relative
                  flex flex-col
                  bg-gray-900
                  rounded-xl
                  border-2
                  overflow-hidden
                  shadow-lg
                  transition
                  ${
                    card.rarity === "Common"
                      ? "border-gray-500"
                      : card.rarity === "Uncommon"
                      ? "border-green-500"
                      : card.rarity === "Rare"
                      ? "border-blue-500"
                      : card.rarity === "Ultra Rare"
                      ? "border-purple-500"
                      : "border-yellow-500"
                  }
                `}
                >
                  {/* 🖼️ Card Image */}
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] flex items-center justify-center text-yellow-200 bg-black/20">
                      No Image
                    </div>
                  )}

                  {/* 🔢 Quantity Badge */}
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    x{card.amount}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
