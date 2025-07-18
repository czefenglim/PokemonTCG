"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import abi from "@/app/lib/pokemonCardABI.json";

// Example: load metadata mapping
import pokemonList from "@/app/lib/pokemon-list.json";
// If you don't have this, I will help you create it

type OwnedCard = {
  id: number;
  name: string;
  imageUrl: string;
  amount: string;
};

export default function InventoryPage() {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [address, setAddress] = useState<string | null>(null);

  //console.log(cards);
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
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-yellow-300 mb-4">My Collection</h1>
      {address && <p className="text-yellow-100 mb-4">Wallet: {address}</p>}
      {loading && <p className="text-yellow-200">Loading...</p>}

      {cards.length === 0 && !loading && (
        <p className="text-yellow-200">You don’t own any cards yet.</p>
      )}

      {cards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 w-full max-w-4xl">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/10 border border-yellow-500 rounded-xl p-2"
            >
              {card.imageUrl ? (
                <img src={card.imageUrl} alt={card.name} className="w-full" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-yellow-200">
                  No Image
                </div>
              )}
              <p className="text-yellow-200 text-center mt-1">{card.name}</p>
              <p className="text-yellow-400 text-center text-sm">
                Quantity: {card.amount}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
