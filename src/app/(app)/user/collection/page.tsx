'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import abi from '@/lib/pokemonCardABI.json';

type OwnedCard = {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  amount: string;
  rarity?: string;
  type?: string;
  strikePower?: number;
  battleRating?: number;
  description?: string;
  weakness?: string;
  resistance?: string;
};

export default function CollectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // UI STATE
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Refs to prevent duplicate calls and track state
  const loadingRef = useRef(false);
  const lastAddressRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ROBUST COLLECTION LOADING FUNCTION
  const loadCollection = useCallback(async (userAddress: string) => {
    console.log('🚀 loadCollection called for address:', userAddress);

    // Prevent duplicate calls
    if (loadingRef.current) {
      console.log('⚠️ Load already in progress, skipping');
      return;
    }

    // More lenient mounted check - allow a brief delay for React StrictMode
    if (!mountedRef.current) {
      console.log('⚠️ Component unmounted, waiting 100ms and retrying once...');
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!mountedRef.current) {
        console.log('❌ Component still unmounted after retry, skipping load');
        return;
      }
    }

    // Abort any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    loadingRef.current = true;
    setLoading(true);
    setCards([]);

    try {
      if (!window.ethereum) {
        throw new Error('No ethereum wallet found');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        abi,
        signer
      );

      // Check if request was aborted
      if (signal.aborted || !mountedRef.current) {
        console.log('⚠️ Request aborted or component unmounted');
        return;
      }

      console.log('📊 Getting user balances...');

      // ✅ Step 1: For ERC1155 contracts, we need to check which tokens exist
      // Your contract generates random IDs from 1-1000, so we check that range
      // But first, let's try to be smarter about it

      console.log('🔍 Checking which tokens have been minted...');

      // ✅ NEW - Dynamic Pokemon count detection
      let maxTokenId;
      try {
        const contractMaxId = await contract.maxPokemonId();
        maxTokenId = Number(contractMaxId); // Convert BigInt to number
        console.log('✅ Got maxPokemonId from contract:', Number(maxTokenId));
      } catch (error) {
        // Fallback to API
        const pokemonListResponse = await fetch('/api/pokemon-list');
        if (pokemonListResponse.ok) {
          const pokemonList = await pokemonListResponse.json();
          maxTokenId = pokemonList.length;
          console.log('✅ Got maxPokemonId from Pokemon list API:', maxTokenId);
        }
      }

      let existingTokenIds: number[] = [];

      try {
        // Method 1: Try to get all existing tokens by checking totalSupply mapping
        // We'll check in batches to avoid overwhelming the RPC
        const batchSize = 100;
        const batches = Math.ceil(maxTokenId / batchSize);

        for (let batch = 0; batch < batches; batch++) {
          const startId = batch * batchSize + 1;
          const endId = Math.min((batch + 1) * batchSize, maxTokenId);
          const batchTokenIds = Array.from(
            { length: endId - startId + 1 },
            (_, i) => startId + i
          );

          console.log(
            `📦 Checking batch ${
              batch + 1
            }/${batches}: tokens ${startId}-${endId}`
          );

          // Check if tokens exist (have been minted)
          const existencePromises = batchTokenIds.map(async (tokenId) => {
            try {
              const exists = await contract.exists(tokenId);
              return exists ? tokenId : null;
            } catch {
              // If exists() fails, check totalSupply directly
              try {
                const supply = await contract.totalSupply(tokenId);
                return Number(supply) > 0 ? tokenId : null;
              } catch {
                return null;
              }
            }
          });

          const batchResults = await Promise.all(existencePromises);
          const batchExisting = batchResults.filter(
            (id): id is number => id !== null
          );
          existingTokenIds.push(...batchExisting);

          // Small delay between batches to be nice to RPC
          if (batch < batches - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        console.log(
          `📊 Found ${existingTokenIds.length} existing tokens:`,
          existingTokenIds.slice(0, 10),
          existingTokenIds.length > 10 ? '...' : ''
        );
      } catch (err) {
        console.warn(
          '⚠️ Could not check token existence efficiently, using full range:',
          err
        );
        // Fallback: check all possible IDs (less efficient)
        existingTokenIds = Array.from({ length: maxTokenId }, (_, i) => i + 1);
      }

      if (existingTokenIds.length === 0) {
        console.log('📭 No tokens have been minted yet');
        setLoading(false);
        loadingRef.current = false;
        return;
      }

      // ✅ Step 2: Check user balances only for existing tokens
      const tokenIds = existingTokenIds;

      // ✅ Step 3: Get balances in one batch for existing tokens only
      let balances: bigint[] = [];
      try {
        console.log(
          `⚖️ Checking balances for ${tokenIds.length} existing tokens...`
        );
        balances = await contract.getUserBalances(userAddress, tokenIds);
        console.log('✅ Batch balance fetch successful');
      } catch (err) {
        console.warn(
          '⚠️ getUserBalances failed, falling back to individual calls',
          err
        );

        // Fallback with abort signal check
        const balancePromises = tokenIds.map(async (id) => {
          if (signal.aborted) return 0n;
          try {
            return await contract.balanceOf(userAddress, id);
          } catch {
            return 0n;
          }
        });

        balances = await Promise.all(balancePromises);
      }

      // Check if request was aborted
      if (signal.aborted || !mountedRef.current) {
        console.log('⚠️ Request aborted after balance fetch');
        return;
      }

      // ✅ Step 4: Filter unique owned token IDs from existing tokens
      const ownedTokenIds = [
        ...new Set(tokenIds.filter((_, idx) => Number(balances[idx]) > 0)),
      ];

      console.log('🎯 Unique owned token IDs:', ownedTokenIds);

      if (!ownedTokenIds.length) {
        console.log('📭 No owned cards found');
        if (mountedRef.current) {
          setLoading(false);
        }
        loadingRef.current = false;
        return;
      }

      // ✅ Step 5: Fetch all metadata in parallel with abort signal
      console.log('📡 Fetching metadata for', ownedTokenIds.length, 'cards...');

      const ownedResults = await Promise.all(
        ownedTokenIds.map(async (tokenId) => {
          if (signal.aborted) return null;

          try {
            const balance = balances[tokenIds.indexOf(tokenId)];

            // Add abort signal to fetch
            const res = await fetch(`/api/pokemon/${tokenId}`, { signal });

            if (!res.ok) {
              throw new Error(`Metadata fetch failed for ${tokenId}`);
            }

            const metadata = await res.json();

            return {
              tokenId,
              tcgId: metadata.gameData?.tcgId || `token-${tokenId}`,
              name: metadata.name,
              imageUrl: metadata.image,
              amount: balance.toString(),
              rarity: metadata.gameData?.rarity || 'Common',
              type: metadata.gameData?.type || 'Unknown',
              strikePower: metadata.gameData?.strikePower,
              battleRating: metadata.gameData?.battleRating,
              description: metadata.description,
              weakness: metadata.gameData?.weakness,
              resistance: metadata.gameData?.resistance,
            } as OwnedCard;
          } catch (e) {
            if (signal.aborted) return null;
            console.warn(`❌ Failed to get metadata for token ${tokenId}`, e);
            return null;
          }
        })
      );

      // Final abort check before setting state
      if (signal.aborted || !mountedRef.current) {
        console.log('⚠️ Request aborted before setting results');
        return;
      }

      // ✅ Step 6: Save to state (filter out failed fetches)
      const validCards = ownedResults.filter((c): c is OwnedCard => c !== null);
      console.log('✅ Successfully loaded', validCards.length, 'cards');

      setCards(validCards);
    } catch (err) {
      if (!signal.aborted && mountedRef.current) {
        console.error('[Collection] Error loading collection:', err);
        setCards([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, []);

  // CONNECTION CHECK FUNCTION
  const checkConnection = useCallback(async () => {
    console.log('🔍 Checking wallet connection...');

    if (!window.ethereum) {
      console.log('❌ No ethereum wallet detected');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);

      if (accounts.length > 0) {
        const currentAddress = accounts[0];
        console.log('👛 Wallet connected:', currentAddress);

        // Only update if address actually changed
        if (currentAddress !== lastAddressRef.current) {
          console.log('🔄 Address changed, updating...');
          lastAddressRef.current = currentAddress;
          setAddress(currentAddress);

          // Load collection for new address
          await loadCollection(currentAddress);
        } else {
          console.log('✅ Same address, no action needed');
        }
      } else {
        console.log('👋 No wallet connected');
        lastAddressRef.current = null;
        setAddress(null);
        setCards([]);
      }
    } catch (error) {
      console.error('❌ Error checking connection:', error);
      setAddress(null);
      setCards([]);
    }
  }, [loadCollection]);

  // INITIAL CONNECTION CHECK - ONLY ONCE
  useEffect(() => {
    console.log('🏁 Component mounted, checking initial connection');
    mountedRef.current = true; // Set mounted to true on mount
    checkConnection();

    // Cleanup function
    return () => {
      console.log('🏁 Component cleanup');
      mountedRef.current = false;
    };
  }, []); // Empty dependency array - NEVER change this!

  // METAMASK EVENT LISTENERS
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔄 MetaMask accounts changed:', accounts);

      if (accounts.length > 0) {
        const newAddress = accounts[0];
        if (newAddress !== lastAddressRef.current) {
          console.log('🆕 New address from MetaMask:', newAddress);
          lastAddressRef.current = newAddress;
          setAddress(newAddress);
          loadCollection(newAddress);
        }
      } else {
        console.log('👋 MetaMask disconnected');
        lastAddressRef.current = null;
        setAddress(null);
        setCards([]);
      }
    };

    const handleChainChanged = () => {
      console.log('⛓️ Chain changed, reloading...');
      window.location.reload();
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up MetaMask listeners');
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [loadCollection]);

  // UI HELPER FUNCTIONS
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'from-gray-400 to-gray-600';
      case 'Uncommon':
        return 'from-green-400 to-green-600';
      case 'Rare':
        return 'from-blue-400 to-blue-600';
      case 'Rare Holo':
        return 'from-purple-400 to-purple-600';
      case 'Ultra Rare':
        return 'from-pink-400 to-red-500';
      case 'Secret Rare':
        return 'from-yellow-400 to-orange-500';
      default:
        return 'from-yellow-400 to-yellow-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Fire':
        return 'bg-red-500';
      case 'Water':
        return 'bg-blue-500';
      case 'Grass':
        return 'bg-green-500';
      case 'Electric':
        return 'bg-yellow-500';
      case 'Psychic':
        return 'bg-purple-500';
      case 'Fighting':
        return 'bg-orange-500';
      case 'Dark':
        return 'bg-gray-800';
      case 'Steel':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle trade navigation
  const handleTradeCard = useCallback(
    (card: OwnedCard) => {
      localStorage.setItem(
        'selectedCardForTrade',
        JSON.stringify({
          tokenId: card.tokenId,
          tcgId: card.tcgId,
          name: card.name,
          imageUrl: card.imageUrl,
          rarity: card.rarity,
          type: card.type,
          amount: card.amount,
          strikePower: card.strikePower,
          battleRating: card.battleRating,
          description: card.description,
        })
      );

      router.push('/user/marketplace');
    },
    [router]
  );

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh requested');
    if (address && !loadingRef.current) {
      loadCollection(address);
    } else {
      console.log('⚠️ Cannot refresh: no address or already loading');
    }
  }, [address, loadCollection]);

  // FILTER LOGIC
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
    const matchesSearch = c.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesRarity && matchesType && matchesSearch;
  });

  // STATS
  const totalCards = cards.reduce(
    (sum, card) => sum + parseInt(card.amount),
    0
  );
  const uniqueCards = cards.length;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-blue-500/20 blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-40 right-20 w-40 h-40 rounded-full bg-purple-500/20 blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <main className="relative z-10 p-6 flex flex-col items-center mt-10">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-7xl mb-8"
        >
          <div className="text-center mb-6">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Your Collection
            </h1>
            <p className="text-white/80 text-lg">
              Discover and manage your legendary Pokémon cards
            </p>
          </div>

          {address && cards.length > 0 && (
            <div className="flex justify-center gap-8 mb-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
                <div className="text-white/60 text-sm">Total Cards</div>
                <div className="text-2xl font-bold text-white">
                  {totalCards}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
                <div className="text-white/60 text-sm">Unique Cards</div>
                <div className="text-2xl font-bold text-white">
                  {uniqueCards}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* No Wallet State */}
        {!address && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Connect Your Wallet
              </h3>
              <p className="text-white/70 mb-6">
                Please connect your wallet using the sidebar to view your
                collection.
              </p>
            </div>
          </motion.div>
        )}

        {/* Wallet Connected Section */}
        {address && (
          <>
            {/* Search and Filters */}
            {!loading && cards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-7xl mb-8"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                    </div>

                    {/* Filters and Controls */}
                    <div className="flex flex-wrap gap-4 items-center">
                      <select
                        value={rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value)}
                        className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        {rarityOptions.map((rarity) => (
                          <option
                            key={rarity}
                            value={rarity}
                            className="bg-gray-800"
                          >
                            {rarity === 'All' ? 'All Rarities' : rarity}
                          </option>
                        ))}
                      </select>

                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        {typeOptions.map((type) => (
                          <option
                            key={type}
                            value={type}
                            className="bg-gray-800"
                          >
                            {type === 'All' ? 'All Types' : type}
                          </option>
                        ))}
                      </select>

                      {/* View Mode Toggle */}
                      <div className="flex bg-white/10 rounded-xl p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg transition-all ${
                            viewMode === 'grid'
                              ? 'bg-purple-500 text-white'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg transition-all ${
                            viewMode === 'list'
                              ? 'bg-purple-500 text-white'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 6h16M4 10h16M4 14h16M4 18h16"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Refresh Button */}
                      <button
                        onClick={handleRefresh}
                        disabled={loading || loadingRef.current}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none"
                      >
                        {loading ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center py-20"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-300 rounded-full animate-spin border-t-transparent"></div>
                  <div
                    className="absolute inset-0 w-16 h-16 border-4 border-pink-300 rounded-full animate-spin border-t-transparent"
                    style={{ animationDelay: '0.5s' }}
                  ></div>
                </div>
                <span className="ml-4 text-white text-lg">
                  Loading your collection...
                </span>
              </motion.div>
            )}

            {/* Empty Collection */}
            {!loading && cards.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg mx-auto"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Your Collection is Empty
                  </h3>
                  <p className="text-white/70 mb-6">
                    You haven't collected any Pokémon cards yet. Start building
                    your legendary collection today!
                  </p>
                  <button
                    onClick={() => router.push('/user/packs')}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
                  >
                    Open Packs
                  </button>
                </div>
              </motion.div>
            )}

            {/* No Filtered Results */}
            {!loading && cards.length > 0 && filteredCards.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md mx-auto">
                  <div className="text-white/60 text-lg mb-4">
                    No cards match your current filters.
                  </div>
                  <button
                    onClick={() => {
                      setRarityFilter('All');
                      setTypeFilter('All');
                      setSearchTerm('');
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2 rounded-xl transition-all duration-300"
                  >
                    Clear all filters
                  </button>
                </div>
              </motion.div>
            )}

            {/* Cards Display - Grid View */}
            {!loading && filteredCards.length > 0 && viewMode === 'grid' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-7xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  <AnimatePresence>
                    {filteredCards.map((card, index) => (
                      <motion.div
                        key={`${card.tokenId}-${card.tcgId}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        onClick={() => setSelectedCard(card)}
                        className="group cursor-pointer"
                      >
                        <div className="relative bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300">
                          {/* Rarity Glow */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(
                              card.rarity || 'Common'
                            )} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                          ></div>

                          {/* Card Image */}
                          <div className="aspect-[3/4] relative overflow-hidden">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={card.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/60 bg-black/20">
                                No Image
                              </div>
                            )}

                            {/* Quantity Badge */}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                              ×{card.amount}
                            </div>

                            {/* Type Badge */}
                            {card.type && (
                              <div
                                className={`absolute top-2 left-2 ${getTypeColor(
                                  card.type
                                )} text-white text-xs font-bold px-2 py-1 rounded-full`}
                              >
                                {card.type}
                              </div>
                            )}

                            {/* Strike Power Badge (API only) */}
                            {card.strikePower && (
                              <div className="absolute bottom-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                ⚡{card.strikePower}
                              </div>
                            )}
                          </div>

                          {/* Card Info */}
                          <div className="p-4">
                            <h3 className="text-white font-bold text-lg mb-2 truncate">
                              {card.name}
                            </h3>
                            <div className="flex justify-between items-center">
                              <div
                                className={`inline-block bg-gradient-to-r ${getRarityColor(
                                  card.rarity || 'Common'
                                )} text-white text-xs font-bold px-3 py-1 rounded-full`}
                              >
                                {card.rarity}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Cards Display - List View */}
            {!loading && filteredCards.length > 0 && viewMode === 'list' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-7xl"
              >
                <div className="space-y-4">
                  <AnimatePresence>
                    {filteredCards.map((card, index) => (
                      <motion.div
                        key={`${card.tokenId}-${card.tcgId}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => setSelectedCard(card)}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:border-white/40 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          {card.imageUrl ? (
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="w-16 h-20 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-20 flex items-center justify-center text-white/60 bg-black/20 rounded-lg">
                              No Image
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg">
                              {card.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              {card.type && (
                                <span
                                  className={`${getTypeColor(
                                    card.type
                                  )} text-white text-xs font-bold px-2 py-1 rounded`}
                                >
                                  {card.type}
                                </span>
                              )}
                              <span
                                className={`bg-gradient-to-r ${getRarityColor(
                                  card.rarity || 'Common'
                                )} text-white text-xs font-bold px-2 py-1 rounded`}
                              >
                                {card.rarity}
                              </span>
                              {card.strikePower && (
                                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                  ⚡{card.strikePower}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-bold text-xl">
                              ×{card.amount}
                            </div>
                            <div className="text-white/60 text-sm">Owned</div>
                            {card.battleRating && (
                              <div className="text-yellow-400 text-sm font-bold">
                                🏆{card.battleRating}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Enhanced Card Detail Modal */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedCard(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  {selectedCard.imageUrl ? (
                    <img
                      src={selectedCard.imageUrl}
                      alt={selectedCard.name}
                      className="w-full max-w-xs mx-auto rounded-2xl mb-4"
                    />
                  ) : (
                    <div className="w-full max-w-xs mx-auto aspect-[3/4] flex items-center justify-center text-white/60 bg-black/20 rounded-2xl mb-4">
                      No Image
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedCard.name}
                  </h2>
                  <div className="flex justify-center gap-2 mb-4">
                    {selectedCard.type && (
                      <span
                        className={`${getTypeColor(
                          selectedCard.type
                        )} text-white text-sm font-bold px-3 py-1 rounded-full`}
                      >
                        {selectedCard.type}
                      </span>
                    )}
                    <span
                      className={`bg-gradient-to-r ${getRarityColor(
                        selectedCard.rarity || 'Common'
                      )} text-white text-sm font-bold px-3 py-1 rounded-full`}
                    >
                      {selectedCard.rarity}
                    </span>
                  </div>
                  <div className="text-white/80 mb-6">
                    You own{' '}
                    <span className="font-bold text-yellow-400">
                      ×{selectedCard.amount}
                    </span>{' '}
                    of this card
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setSelectedCard(null)}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium py-2 px-6 rounded-full transition-all duration-300 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Close
                    </button>

                    <button
                      onClick={() => handleTradeCard(selectedCard)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-2 px-6 rounded-full transition-all duration-300 flex items-center gap-2 transform hover:scale-105"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
                      </svg>
                      Trade Card
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
