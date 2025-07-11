"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";

type Card = {
  id: string;
  quantity: number;
  pokemon: {
    name: string;
    imageUri: string;
    type: string;
    rarity: string;
  };
};

const rarityOptions = ["Common", "Rare", "Legendary"];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);

  useEffect(() => {
    const fetchInventory = async () => {
      const res = await fetch("/api/inventory", {
        credentials: "include",
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to fetch inventory:", res.status, errorText);
        return;
      }
      const data = await res.json();
      setInventory(data);
      setFilteredCards(data); // Default to full list
    };

    fetchInventory();
  }, []);

  // Calculate total card count
  const calculateCardCount = () => {
    return inventory.reduce((count, card) => count + card.quantity, 0);
  };

  // Apply search and rarity filters
  const handleApplyFilters = () => {
    const filtered = inventory.filter((card) => {
      const matchesName = card.pokemon.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRarity =
        selectedRarity === null || card.pokemon.rarity === selectedRarity;
      return matchesName && matchesRarity;
    });
    setFilteredCards(filtered);
    setShowSearch(false);
  };

  // Clear filters and reset to full inventory
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedRarity(null);
    setFilteredCards(inventory);
  };

  const toggleRarity = (rarity: string) => {
    setSelectedRarity((prev) => (prev === rarity ? null : rarity));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-10 px-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-yellow-300 mb-6">Inventory</h1>
      <p className="text-yellow-200 mb-4">Your collection of Pokémon cards.</p>

      {/* Header Bar */}
      <div className="flex w-full max-w-5xl px-10 py-4 justify-between items-center bg-yellow-300 rounded-lg mb-6">
        <div
          className="rounded-lg p-4 flex justify-between items-center gap-4"
          style={{ boxShadow: "-4px -4px 10px rgba(0, 0, 0, 0.2)" }}
        >
          <img
            src="\football-card.png"
            alt="Card Image"
            className="w-[24px] h-auto"
          />
          <p className="text-3xl font-bold">{calculateCardCount()}</p>
        </div>
        <MagnifyingGlassIcon
          className="h-auto w-[36px] text-black cursor-pointer"
          onClick={() => setShowSearch(true)}
        />
      </div>

      {/* Card Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredCards.length === 0 ? (
          <div className="col-span-full text-center text-yellow-200">
            No cards found. Try adjusting your search or filters.
          </div>
        ) : (
          filteredCards.map((card) => (
            <div
              key={card.id}
              className="bg-gray-800 rounded-lg p-4 shadow-md text-white"
            >
              <img
                src={card.pokemon.imageUri}
                alt={card.pokemon.name}
                className="mb-2 rounded-md"
              />
              <h2 className="text-lg font-bold">{card.pokemon.name}</h2>
              <p>Type: {card.pokemon.type}</p>
              <p>Rarity: {card.pokemon.rarity}</p>
              <p>Quantity: {card.quantity}</p>
            </div>
          ))
        )}
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="flex flex-col items-center justify-between bg-gradient-to-br from-black via-gray-900 to-gray-800 w-full max-w-3xl p-6 rounded-xl shadow-xl relative">
            {/* Close Button */}
            <button
              onClick={() => setShowSearch(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-yellow-300 border border-gray-300 rounded-lg p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />

            {/* Rarity Filter */}
            <div className="w-full text-yellow-300 flex flex-col items-start gap-5">
              <h2 className="text-3xl font-bold">Rarity</h2>
              <div className="flex justify-start w-full items-center gap-5">
                {rarityOptions.map((rarity) => (
                  <button
                    key={rarity}
                    onClick={() => toggleRarity(rarity)}
                    className={`border text-center rounded-lg px-4 py-2 transition-colors ${
                      selectedRarity === rarity
                        ? "bg-yellow-500 text-black border-yellow-500"
                        : "border-gray-300 text-yellow-300 hover:bg-yellow-500 hover:text-black"
                    }`}
                  >
                    {rarity}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full text-black flex justify-center items-center gap-5 mt-6">
              <button
                onClick={handleApplyFilters}
                className="bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={() => setShowSearch(false)}
                className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleClearFilters}
                className="bg-black text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
