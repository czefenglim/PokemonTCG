"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import nftAbi from "@/app/lib/pokemonCardABI.json";
import pokemonList from "@/app/lib/pokemon-list.json";
import { useSearchParams } from "next/navigation";
import tradeAbi from "../../../lib/tradeCardABI.json";

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
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);

  const searchParams = useSearchParams();
  const friendWallet = searchParams.get("friendWallet");
  const tradeRequestId = searchParams.get("tradeRequestId");

  const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // useEffect(() => {
  //   if (friendWallet) {
  //     console.log("Trading with wallet:", friendWallet);
  //     // Save to state or use directly for transaction
  //   }
  // }, [friendWallet]);

  const loadCollection = async (userAddress: string) => {
    setLoading(true);
    setCards([]);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = process.env
        .NEXT_PUBLIC_CONTRACT_ADDRESS as string;
      if (!contractAddress) {
        throw new Error("Contract address not configured.");
      }

      const contract = new ethers.Contract(contractAddress, nftAbi, signer);

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
                  key={`${card.tokenId}-${card.tcgId}`}
                  onClick={() => setSelectedCard(card)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                  className={`
                    relative cursor-pointer
                    flex flex-col items-center
                    bg-gray-900
                    rounded-xl
                    border-4
                    overflow-hidden
                    shadow-lg
                    transition
                    ${
                      selectedCard?.tokenId === card.tokenId
                        ? "border-yellow-400 ring-4 ring-yellow-300"
                        : card.rarity === "Common"
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
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-48 object-contain bg-black"
                  />
                  <div className="p-2 text-center text-yellow-100">
                    <h3 className="text-md font-bold">{card.name}</h3>
                    <p className="text-sm text-yellow-300">{card.rarity}</p>
                    <p className="text-sm">Type: {card.type}</p>
                    <p className="text-sm">Qty: {card.amount}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
      {selectedCard && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <button
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-full shadow-xl transition"
            onClick={async () => {
              if (!selectedCard || !tradeRequestId) return;

              try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const nftContract = new ethers.Contract(
                  nftAddress,
                  nftAbi,
                  signer
                );

                const tradeContractAddress =
                  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // ✅ your deployed TradeCards.sol address

                const tradeContract = new ethers.Contract(
                  tradeContractAddress,
                  tradeAbi,
                  signer
                );

                const userAddress = await signer.getAddress();

                // 1️⃣ Approve tradeContract to transfer your NFT
                const approveTx = await nftContract.setApprovalForAll(
                  tradeContractAddress,
                  true
                );
                await approveTx.wait();

                console.log(
                  "Sending ETH value:",
                  ethers.parseEther("0.1").toString()
                );
                // 2️⃣ Deposit your NFT into the trade contract using depositNFT
                // Update your depositNFT call with these changes:
                const depositTx = await tradeContract.depositNFT(
                  userAddress,
                  friendWallet,
                  selectedCard.tokenId,
                  false,
                  {
                    value: ethers.parseEther("0.1"),
                    gasLimit: 6000000, // Increased to 6M gas
                  }
                );

                // Add error handling
                try {
                  const txReceipt = await depositTx.wait();
                  console.log("Transaction mined:", txReceipt.transactionHash);
                } catch (error) {
                  console.error("Transaction failed:", error);
                  if (
                    typeof error === "object" &&
                    error !== null &&
                    "receipt" in error
                  ) {
                    console.log("Transaction receipt:", (error as any).receipt);
                  }
                  if (
                    typeof error === "object" &&
                    error !== null &&
                    "reason" in error
                  ) {
                    alert(`Transaction failed: ${(error as any).reason}`);
                  } else {
                    alert("Transaction failed (check console for details)");
                  }
                }

                await depositTx.wait();

                // 3️⃣ Call your backend to update tradeRequest status & store receiver NFT data
                const res = await fetch(
                  "/api/tradeRequest/receiverAcceptTrade",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tradeRequestId,
                      receiverCardId: selectedCard.tokenId,
                    }),
                  }
                );

                const data = await res.json();

                if (res.ok) {
                  alert("NFT deposited and trade status updated!");
                } else {
                  console.error("API error:", data.error);
                  alert("Failed to update trade");
                }
              } catch (err) {
                console.error(err);
                alert("Something went wrong");
              }
            }}
          >
            OK
          </button>
        </div>
      )}
    </main>
  );
}
