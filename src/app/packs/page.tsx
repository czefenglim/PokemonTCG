// app/packs/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import abi from "@/app/lib/pokemonCardABI.json";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type Card = {
  id: string;
  name: string;
  images: { small: string };
};

export default function PacksPage() {
  const [nextPackAt, setNextPackAt] = useState<number | null>(null);
  const [gems, setGems] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const { isConnected } = useAccount();

  // Load pack status on mount
  useEffect(() => {
    fetch("/api/packs/status")
      .then((res) => res.json())
      .then((data) => {
        setNextPackAt(data.nextPackAt);
        setGems(data.gems);
      });
  }, []);

  const openPack = async () => {
    if (!isConnected || typeof window === "undefined" || !window.ethereum) {
      alert("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setStatus("Preparing transaction...");

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();

      const contract = new ethers.Contract(
        "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        abi,
        signer
      );

      setStatus("Fetching pack...");

      const res = await fetch("/api/packs/open", { method: "POST" });
      const data = await res.json();
      const cards = data.cards;

      const ids = cards.map((c) => c.id);
      const amounts = ids.map(() => 1);

      setStatus("Requesting wallet confirmation...");

      const tx = await contract.mintBatchCards(ids, amounts);
      console.log("Transaction sent:", tx.hash);

      setStatus("Minting on blockchain...");

      await tx.wait();
      console.log("Transaction confirmed!");

      setCards(cards);

      setNextPackAt(Date.now() + 24 * 60 * 60 * 1000);

      setStatus("✅ Minting successful!");
    } catch (err: any) {
      if (err?.code === "ACTION_REJECTED") {
        setStatus("❌ Transaction was rejected.");
      } else {
        alert(`Error minting: ${err?.message || "Unknown error"}`);
        setStatus(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const canOpen = !nextPackAt || nextPackAt < Date.now();

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 flex flex-col items-center">
      {/* Connect Wallet Button */}
      <div className="mb-4">
        <ConnectButton />
      </div>

      <h1 className="text-3xl font-bold text-yellow-300 mb-4">
        Open Your Pack
      </h1>

      {status && <p className="text-yellow-200 mb-4">{status}</p>}

      {cards.length === 0 ? (
        <>
          {canOpen ? (
            <button
              onClick={openPack}
              disabled={loading || !isConnected}
              className={`${
                !isConnected
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-yellow-400 hover:bg-yellow-500"
              } text-black font-semibold py-2 px-4 rounded mb-4`}
            >
              {!isConnected
                ? "Connect your wallet to open packs"
                : loading
                ? "Opening..."
                : "Open Pack"}
            </button>
          ) : (
            <>
              <p className="text-yellow-200 mb-2">
                Next free pack available at:{" "}
                {new Date(nextPackAt).toLocaleTimeString()}
              </p>
              <button
                onClick={async () => {
                  await fetch("/api/packs/skip", { method: "POST" });
                  setNextPackAt(Date.now());
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              >
                Spend Gems to Open Now ({gems} gems available)
              </button>
            </>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white/10 border border-yellow-500 rounded-xl p-2"
            >
              <img src={card.images.small} alt={card.name} className="w-full" />
              <p className="text-yellow-200 text-center mt-1">{card.name}</p>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
