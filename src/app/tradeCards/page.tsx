"use client";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// import TradeCardImage from "/public/tradeCard.svg"; // Adjust the path as necessary

export default function TradeCardsPage() {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [address, setAddress] = useState<string | null>(null);

  const router = useRouter();

  const handleTradeClick = () => {
    router.push("/tradeCards/selectFriend"); // ✅ Navigates correctly
  };

  const loadTradeCards = async () => {
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

      // Fetch user's tradeable cards from the blockchain or API
      // This is a placeholder; replace with actual logic to fetch cards
      const fetchedCards = []; // Replace with actual fetch logic

      setCards(fetchedCards);
    } catch (error) {
      console.error("Error loading trade cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTradeCards();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-10 px-4 flex flex-col items-center text-white">
      <h1 className="text-4xl font-bold text-yellow-300 mb-8 drop-shadow-md">
        Trade Cards
      </h1>

      {/* Address Info */}
      {address && (
        <p className="text-sm text-gray-300 mb-4">
          Connected Wallet: <span className="text-yellow-400">{address}</span>
        </p>
      )}

      {/* Trade Card Image */}
      <Image
        src="/tradeCard.svg" // Ensure this path is correct}
        alt="Trade Card"
        width={200}
        height={200}
        className="mb-6"
      />

      {/* Trade Button */}
      <button
        className="bg-yellow-300 text-black text-lg font-bold px-8 py-3 rounded-full shadow-lg hover:bg-yellow-400 transition-all hover:scale-105"
        onClick={handleTradeClick}
      >
        Start Trading
      </button>
    </main>
  );
}
