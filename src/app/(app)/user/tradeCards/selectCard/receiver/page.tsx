'use client';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import nftAbi from '@/lib/data/pokemonCardABI.json';
import pokemonList from '@/lib/data/pokemon-list.json';

import { useSearchParams } from 'next/navigation';
import tradeAbi from '@/lib/tradeCardABI.json';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);

  const searchParams = useSearchParams();
  const friendWallet = searchParams.get('friendWallet');
  const tradeRequestId = searchParams.get('tradeRequestId');

  const nftAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
  const tradeContractAddress = process.env.NEXT_PUBLIC_TRADE_CONTRACT as string;

  const router = useRouter();

  const loadCollection = async (userAddress: string) => {
    setLoading(true);
    setCards([]);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contractAddress = process.env
        .NEXT_PUBLIC_CONTRACT_ADDRESS as string;
      if (!contractAddress) {
        throw new Error('Contract address not configured.');
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
              rarity: info.rarity ?? 'Common',
              type: info.type ?? 'Unknown',
            },
          ];
        }
        return [];
      });

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
    const accounts = await provider.send('eth_accounts', []);
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
    'All',
    ...Array.from(new Set(cards.map((c) => c.rarity).filter(Boolean))),
  ];

  const typeOptions = [
    'All',
    ...Array.from(new Set(cards.map((c) => c.type).filter(Boolean))),
  ];

  const filteredCards = cards.filter((c) => {
    const matchesRarity = rarityFilter === 'All' || c.rarity === rarityFilter;
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    return matchesRarity && matchesType;
  });

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 px-4 py-10 flex flex-col items-center text-white">
        {/* Header Section */}
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between mb-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in">
            {friendWallet ? 'Select Card to Trade' : 'Your Collection'}
          </h1>

          {/* Wallet Address Display */}
          {address && (
            <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-mono text-white text-sm">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Collection Content */}
        {!address ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">
                Wallet Not Connected
              </h3>
              <p className="text-slate-300 mb-6">
                Please connect your wallet to view your Pokémon card collection
              </p>
              <button
                onClick={() => checkConnection()}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Controls */}
            <div className="w-full max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
              <div className="flex flex-wrap items-center justify-center gap-4">
                {/* Rarity Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-medium">Rarity:</span>
                  <select
                    value={rarityFilter}
                    onChange={(e) => setRarityFilter(e.target.value)}
                    className="bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {rarityOptions.map((rarity) => (
                      <option key={rarity} value={rarity}>
                        {rarity}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400 font-medium">Type:</span>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-900 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => loadCollection(address)}
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold px-6 py-2 rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
              </div>
            )}

            {/* Empty State */}
            {!loading && cards.length === 0 && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                    Collection Empty
                  </h3>
                  <p className="text-slate-300 mb-6">
                    You haven't collected any Pokémon cards yet. Start your
                    journey today!
                  </p>
                  <button
                    onClick={() => router.push('/packs')}
                    className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                  >
                    Open Packs
                  </button>
                </div>
              </div>
            )}

            {/* No Filter Results */}
            {!loading && cards.length > 0 && filteredCards.length === 0 && (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                    No Cards Found
                  </h3>
                  <p className="text-slate-300 mb-6">
                    No cards match your current filters
                  </p>
                  <button
                    onClick={() => {
                      setRarityFilter('All');
                      setTypeFilter('All');
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Cards Grid */}
            {!loading && filteredCards.length > 0 && (
              <div className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-4">
                  {filteredCards.map((card) => (
                    <motion.div
                      key={`${card.tokenId}-${card.tcgId}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCard(card)}
                      className={`
                        relative cursor-pointer
                        rounded-2xl overflow-hidden
                        border-4 transition-all
                        ${
                          selectedCard?.tokenId === card.tokenId
                            ? 'border-yellow-400 ring-4 ring-yellow-300'
                            : card.rarity === 'Common'
                            ? 'border-gray-500 hover:border-gray-400'
                            : card.rarity === 'Uncommon'
                            ? 'border-green-500 hover:border-green-400'
                            : card.rarity === 'Rare'
                            ? 'border-blue-500 hover:border-blue-400'
                            : card.rarity === 'Ultra Rare'
                            ? 'border-purple-500 hover:border-purple-400'
                            : 'border-yellow-500 hover:border-yellow-400'
                        }
                        shadow-xl hover:shadow-2xl
                      `}
                    >
                      <div className="relative aspect-[3/4]">
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {parseInt(card.amount) > 1 && (
                          <div className="absolute top-2 right-2 bg-black/80 text-yellow-400 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            ×{card.amount}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Selection Confirmation */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
              {/* Close Button */}
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
              >
                ✕
              </button>

              {/* Modal Content */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  Confirm Selection
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
              </div>

              {/* Card Display */}
              <div className="relative mb-8">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-slate-800/50 rounded-2xl p-4">
                  <div className="relative aspect-[3/4]">
                    <img
                      src={selectedCard.imageUrl}
                      alt={selectedCard.name}
                      className="object-cover rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedCard || !tradeRequestId) return;

                    try {
                      const provider = new ethers.BrowserProvider(
                        window.ethereum
                      );
                      const signer = await provider.getSigner();

                      const nftContract = new ethers.Contract(
                        nftAddress,
                        nftAbi,
                        signer
                      );

                      if (!tradeContractAddress) {
                        console.error(
                          'Trade contract address is not defined in .env'
                        );
                        alert('Trade contract address is not configured.');
                        return;
                      }
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

                      // 2️⃣ Deposit your NFT into the trade contract using depositNFT
                      const depositTx = await tradeContract.depositNFT(
                        userAddress,
                        friendWallet,
                        selectedCard.tokenId,
                        false,
                        {
                          value: ethers.parseEther('0.0001'),
                          gasLimit: 6000000, // Increased to 6M gas
                        }
                      );

                      try {
                        const txReceipt = await depositTx.wait();
                        console.log(
                          'Transaction mined:',
                          txReceipt.transactionHash
                        );
                      } catch (error) {
                        console.error('Transaction failed:', error);
                        if (
                          typeof error === 'object' &&
                          error !== null &&
                          'receipt' in error
                        ) {
                          console.log(
                            'Transaction receipt:',
                            (error as any).receipt
                          );
                        }
                        if (
                          typeof error === 'object' &&
                          error !== null &&
                          'reason' in error
                        ) {
                          alert(`Transaction failed: ${(error as any).reason}`);
                        } else {
                          alert(
                            'Transaction failed (check console for details)'
                          );
                        }
                      }

                      await depositTx.wait();

                      // 3️⃣ Call your backend to update tradeRequest status & store receiver NFT data
                      const res = await fetch(
                        '/api/tradeRequest/receiverAcceptTrade',
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tradeRequestId,
                            receiverCardId: selectedCard.tokenId,
                          }),
                        }
                      );

                      const data = await res.json();

                      if (res.ok) {
                        alert('NFT deposited and trade status updated!');
                        setSelectedCard(null);
                      } else {
                        console.error('API error:', data.error);
                        alert('Failed to update trade');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Something went wrong');
                    }
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-black font-bold rounded-xl shadow-lg hover:shadow-yellow-500/30 transition-all"
                >
                  Confirm Trade
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
