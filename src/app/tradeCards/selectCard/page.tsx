"use client";
import { useState, useEffect } from "react";

// Example: load metadata mapping
import pokemonList from "@/app/lib/pokemon-list.json";
import { motion } from "framer-motion";
import { ethers } from "ethers";
// If you don't have this, I will help you create it
import abi from "@/app/lib/pokemonCardABI.json";
import { useRouter } from "next/navigation";

type OwnedCard = {
  id: number;
  name: string;
  imageUrl: string;
  amount: string;
};

export default function SelectCardPage() {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const router = useRouter();

  const loadInventory = async () => {
    setLoading(true);
    setCards([]);
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const userAddress = await signer.getAddress();
      setAddress(userAddress);

      const contract = new ethers.Contract(
        "0x5FbDB2315678afecb367f032d93F642f64180aa3", // your contract address
        abi,
        signer
      );

      const owned: OwnedCard[] = [];

      // Assuming Token IDs 1-151
      for (let id = 1; id <= 151; id++) {
        const b = await contract.balanceOf(userAddress, id);
        if (b > 0) {
          const info = pokemonList.find((p) => p.id === id);
          owned.push({
            id,
            name: info ? info.name : `Unknown #${id}`,
            imageUrl: info ? info.image : "",
            amount: b.toString(),
          });
        }
      }

      setCards(owned);
    } catch (err) {
      console.error(err);
      alert(`Error loading inventory: ${(err as any).message}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 flex flex-col items-center relative">
      <button
        className="absolute bottom-[50px] left-1/2 -translate-x-1/2 text-yellow-300 hover:text-yellow-400 transition-colors border border-yellow-300 px-16 py-4 rounded-lg"
        onClick={() => {
          const selectedCard = cards.find((c) => c.id === selectedCardId);
          if (!selectedCard) {
            alert("❌ Please select a card to trade.");
            return;
          }

          const selectedFriend = localStorage.getItem("selectedFriend"); // assuming you stored this in a previous step
          if (!selectedFriend) {
            alert("❌ No friend selected.");
            return;
          }

          const trade = {
            card: selectedCard,
            datetime: new Date().toISOString(),
            friend: selectedFriend,
          };

          localStorage.setItem("latestTrade", JSON.stringify(trade));

          alert("✅ Trade created!");
          router.push("/tradeCards");
        }}
      >
        OK
      </button>

      <h1 className="text-3xl font-bold text-yellow-300 mb-4">
        Select Card To Trade
      </h1>
      {address && <p className="text-yellow-100 mb-4">Wallet: {address}</p>}
      {loading && <p className="text-yellow-200">Loading...</p>}

      {cards.length === 0 && !loading && (
        <p className="text-yellow-200">You don’t own any cards yet.</p>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 w-full max-w-4xl">
          {cards.map((card, i) => {
            const isSelected = selectedCardId === card.id;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, rotateY: 90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedCardId(card.id)} // ← select on click
                className={`relative cursor-pointer bg-white/10 border rounded-xl p-2 transition ${
                  isSelected
                    ? "border-4 border-yellow-400 ring ring-yellow-300"
                    : "border-yellow-500"
                }`}
              >
                {/* Tick icon overlay if selected */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    ✅
                  </div>
                )}
                <div className={`${isSelected ? "blur-sm" : ""}`}>
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center text-yellow-200">
                      No Image
                    </div>
                  )}
                  <p className="text-yellow-200 text-center mt-1">
                    {card.name}
                  </p>
                  <p className="text-yellow-400 text-center text-sm">
                    Quantity: {card.amount}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}
