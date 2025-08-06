// // app/marketplace/page.tsx
// 'use client';
// import { useState } from 'react';

// type Card = {
//   id: string;
//   name: string;
//   images: { small: string };
//   minted: boolean;
//   contractAddress?: string;
//   tokenId?: string;
// };

// export default function MarketplacePage() {
//   // Mock card data
//   const [cards] = useState<Card[]>([
//     {
//       id: 'xy1-1',
//       name: 'Venusaur EX',
//       images: { small: 'https://images.pokemontcg.io/xy1/1.png' },
//       minted: true,
//       contractAddress: '0xYourContractAddressHere',
//       tokenId: '1',
//     },
//     {
//       id: 'xy1-2',
//       name: 'Weedle',
//       images: { small: 'https://images.pokemontcg.io/xy1/2.png' },
//       minted: false,
//     },
//     {
//       id: 'xy1-3',
//       name: 'Caterpie',
//       images: { small: 'https://images.pokemontcg.io/xy1/3.png' },
//       minted: false,
//     },
//   ]);

//   return (
//     <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6">
//       <h1 className="text-3xl font-bold text-yellow-300 mb-6">
//         My Marketplace
//       </h1>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//         {cards.map((card) => (
//           <div
//             key={card.id}
//             className="bg-white/10 border border-yellow-400 rounded-xl p-4 flex flex-col items-center"
//           >
//             <img
//               src={card.images.small}
//               alt={card.name}
//               className="w-32 mb-2"
//             />
//             <h2 className="text-lg text-yellow-200 font-semibold">
//               {card.name}
//             </h2>
//             <p
//               className={`text-xs px-2 py-1 rounded mt-1 ${
//                 card.minted
//                   ? 'bg-green-600 text-white'
//                   : 'bg-yellow-600 text-white'
//               }`}
//             >
//               {card.minted ? 'Minted' : 'Not Minted'}
//             </p>
//             <div className="flex flex-col gap-2 mt-4 w-full">
//               {!card.minted && (
//                 <button
//                   disabled
//                   className="bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded cursor-not-allowed"
//                 >
//                   Mint NFT (Coming Soon)
//                 </button>
//               )}
//               {card.minted && (
//                 <button
//                   onClick={() =>
//                     window.open(
//                       `https://opensea.io/assets/${card.contractAddress}/${card.tokenId}`,
//                       '_blank'
//                     )
//                   }
//                   className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
//                 >
//                   View on OpenSea
//                 </button>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//     </main>
//   );
// }

// app/marketplace/page.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Rarible Testnet Marketplace URL
  const RARIBLE_TESTNET_URL = "https://testnet.rarible.com";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      checkWalletConnection();
      setLoading(false);
    }
  }, [status, router]);

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setWalletConnected(true);
          setWalletAddress(accounts[0]);
        }
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWalletConnected(true);
      setWalletAddress(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const redirectToRarible = () => {
    if (walletConnected) {
      // Redirect to Rarible with wallet address as query parameter
      window.open(`${RARIBLE_TESTNET_URL}`, "_blank");
    } else {
      // Redirect to generic Rarible marketplace
      window.open(RARIBLE_TESTNET_URL, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 text-center bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="relative mx-auto mb-6 w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-300 text-lg font-medium">
            Loading marketplace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 px-4 py-10">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in">
            NFT Marketplace
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Buy, sell and trade your Pokémon TCG NFTs on the Rarible testnet
            marketplace
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8">
          {/* Wallet Connection Status */}
          <div className="mb-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-700/50 rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    walletConnected ? "bg-green-500/20" : "bg-amber-500/20"
                  }`}
                >
                  {walletConnected ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <span className="text-2xl">⚠️</span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {walletConnected
                      ? "Wallet Connected"
                      : "Wallet Not Connected"}
                  </h3>
                  {walletConnected ? (
                    <p className="text-slate-300 font-mono">
                      {formatWalletAddress(walletAddress)}
                    </p>
                  ) : (
                    <p className="text-slate-400">
                      Connect your wallet to trade
                    </p>
                  )}
                </div>
              </div>
              {!walletConnected ? (
                <button
                  onClick={connectWallet}
                  className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="group-hover:animate-bounce">🔗</span>
                    Connect Wallet
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </button>
              ) : (
                <button
                  onClick={redirectToRarible}
                  className="relative overflow-hidden group bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="group-hover:animate-bounce">🚀</span>
                    Go to Marketplace
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></span>
                </button>
              )}
            </div>
          </div>

          {/* Marketplace Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Buy Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative h-full bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4">🛒</div>
                <h3 className="text-xl font-bold text-white mb-2">Buy Cards</h3>
                <p className="text-slate-300">
                  Browse and purchase rare Pokémon TCG NFTs from other
                  collectors
                </p>
              </div>
            </div>

            {/* Sell Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative h-full bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Sell Cards
                </h3>
                <p className="text-slate-300">
                  List your Pokémon cards for sale and earn from your collection
                </p>
              </div>
            </div>

            {/* Trade Card */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
              <div className="relative h-full bg-slate-700/50 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4">🔄</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Trade Cards
                </h3>
                <p className="text-slate-300">
                  Exchange cards with other trainers to complete your collection
                </p>
              </div>
            </div>
          </div>

          {/* Rarible Info */}
          <div className="bg-slate-700/30 rounded-xl p-6 border border-white/10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <Image
                  src="/images/Rarible.webp" // Make sure to add this image to your public folder
                  alt="Rarible Logo"
                  width={120}
                  height={120}
                  className="rounded-lg"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Powered by Rarible
                </h3>
                <p className="text-slate-300 mb-4">
                  Our marketplace is powered by Rarible, a leading multi-chain
                  NFT platform. You'll need to connect your wallet to interact
                  with the marketplace.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm">
                    Testnet
                  </span>
                  <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-sm">
                    Multi-chain
                  </span>
                  <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
                    Secure
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
