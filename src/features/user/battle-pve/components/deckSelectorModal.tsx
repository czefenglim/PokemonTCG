// /app/components/deckSelectorModal.tsx - FIXED: Only selects decks, no direct battle creation
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { ethers } from 'ethers';

interface Deck {
  id: string;
  name: string;
  cards: any[];
}

interface DeckSelectorModalProps {
  onSelect: (deck: Deck) => void;
  onClose: () => void;
  // Optional: Show additional info for battle mode, but don't create battles
  mode?: 'deck_management' | 'battle_start';
}

// Original gradients for visual variety - preserved
const originalGradients = [
  {
    gradient: 'from-red-400 via-orange-400 to-pink-400',
    shadowColor: 'shadow-red-500/20',
    glowColor: 'group-hover:shadow-red-500/40',
  },
  {
    gradient: 'from-sky-400 via-blue-400 to-blue-600',
    shadowColor: 'shadow-blue-500/20',
    glowColor: 'group-hover:shadow-blue-500/40',
  },
  {
    gradient: 'from-green-400 via-emerald-400 to-teal-500',
    shadowColor: 'shadow-green-500/20',
    glowColor: 'group-hover:shadow-green-500/40',
  },
  {
    gradient: 'from-purple-400 via-violet-400 to-purple-600',
    shadowColor: 'shadow-purple-500/20',
    glowColor: 'group-hover:shadow-purple-500/40',
  },
  {
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
    shadowColor: 'shadow-yellow-500/20',
    glowColor: 'group-hover:shadow-yellow-500/40',
  },
];

const DeckSelectorModal: React.FC<DeckSelectorModalProps> = ({
  onSelect,
  onClose,
  mode = 'deck_management',
}) => {
  const router = useRouter();
  const [playerDecks, setPlayerDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real deck data
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        console.log('=== DEBUG: Fetching user decks for deck selector ===');

        // Get wallet address from MetaMask
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Try to get session (for JWT token)
        const session = await getSession();

        // Prepare headers
        const headers: HeadersInit = {
          'X-Wallet-Address': address,
        };

        if (session?.accessToken) {
          headers.Authorization = `Bearer ${session.accessToken}`;
        }

        const res = await fetch('/api/decks/show-deck', {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        const decksData = Array.isArray(data) ? data : data.decks;

        if (!Array.isArray(decksData)) {
          throw new Error(
            'Invalid response format: expected an array of decks'
          );
        }

        // Filter decks with exactly 10 cards for battle mode (but still just select, don't create battle)
        const validDecks =
          mode === 'battle_start'
            ? decksData.filter((deck) => deck.cards && deck.cards.length === 10)
            : decksData;

        // Map real data to original UI format with styling
        const decksWithStyling = validDecks.map((deck: Deck, index: number) => {
          const styling = originalGradients[index % originalGradients.length];

          return {
            id: deck.id,
            name: deck.name,
            number: String(index + 1).padStart(2, '0'),
            mainCard:
              deck.cards?.[0]?.imageUrl ||
              'https://images.pokemontcg.io/base1/1.png',
            subCards: deck.cards?.slice(1, 3).map((card) => card.imageUrl) || [
              'https://images.pokemontcg.io/base1/2.png',
              'https://images.pokemontcg.io/base1/3.png',
            ],
            ...styling,
            // Keep original deck data for selection
            originalDeck: deck,
            cardCount: deck.cards?.length || 0,
          };
        });

        setPlayerDecks(decksWithStyling);
      } catch (err: any) {
        console.error('Failed to fetch decks:', err);
        setError('Failed to load your decks. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [mode]);

  const handleDeckSelect = (deck: any) => {
    console.log('Selected deck:', deck.originalDeck);

    // ALWAYS just select the deck and close modal
    // No matter what mode, we don't create battles here
    onSelect(deck.originalDeck);
    onClose();
  };

  const handleCreateNewDeck = () => {
    onClose();
    router.push('/deck/new-deck');
  };

  // Original beautiful UI - completely preserved
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xl flex justify-center items-center px-4 animate-in fade-in duration-150">
      {/* Original animated background pattern - preserved */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 w-full max-w-4xl relative shadow-2xl shadow-black/20 flex flex-col gap-6 border border-white/20 animate-in slide-in-from-bottom-8 duration-200">
        {/* Original enhanced close button - preserved */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100/80 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-150 flex items-center justify-center text-lg font-bold shadow-lg hover:shadow-xl hover:scale-110 backdrop-blur-sm border border-gray-200/50"
        >
          ×
        </button>

        {/* Updated title based on mode */}
        <div className="text-center mt-1">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-gray-700 to-gray-900 tracking-tight mb-2">
            {mode === 'battle_start'
              ? 'Choose Your Battle Deck'
              : 'Select a Deck'}
          </h2>
          <div className="w-20 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>

          {/* Battle mode subtitle */}
          {mode === 'battle_start' && (
            <p className="text-gray-600 text-sm mt-2">
              Select a deck with exactly 10 cards to battle
            </p>
          )}
        </div>

        {/* Original enhanced middle card section - preserved */}
        <div className="bg-gradient-to-br from-gray-50/80 to-gray-100/60 rounded-2xl shadow-inner px-6 py-6 backdrop-blur-sm border border-white/40">
          {/* Loading state with original styling */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎴</div>
              <p className="text-gray-600 text-lg font-medium">
                Loading your decks...
              </p>
            </div>
          )}

          {/* Error state with original styling */}
          {error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-600 mb-4 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state with original styling */}
          {!loading && !error && playerDecks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎴</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {mode === 'battle_start'
                  ? 'No Valid Battle Decks'
                  : 'No Decks Found'}
              </h3>
              <p className="text-gray-500 mb-6">
                {mode === 'battle_start'
                  ? 'You need a deck with exactly 10 cards to battle. Create one first!'
                  : "You haven't created any decks yet."}
              </p>
              <button
                onClick={handleCreateNewDeck}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Your First Deck
              </button>
            </div>
          )}

          {/* Original deck grid - preserved with battle mode enhancements */}
          {!loading && !error && playerDecks.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {playerDecks.map((deck, index) => (
                  <div
                    key={deck.id}
                    onClick={() => handleDeckSelect(deck)}
                    className={`group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl ${
                      deck.shadowColor
                    } cursor-pointer hover:scale-105 hover:-translate-y-2 transition-all duration-150 overflow-hidden relative border border-white/50 ${
                      deck.glowColor
                    } hover:shadow-2xl animate-in slide-in-from-bottom-4 delay-${
                      index * 100
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Card count indicator for battle mode */}
                    {mode === 'battle_start' && (
                      <div
                        className={`absolute top-2 right-2 z-30 px-2 py-1 rounded-full text-xs font-bold ${
                          deck.cardCount === 10
                            ? 'bg-green-500 text-white'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {deck.cardCount}/10
                      </div>
                    )}

                    {/* Original enhanced slanted gradient top section - preserved */}
                    <div className="relative w-full h-[80px] overflow-hidden">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${deck.gradient} text-white px-4 pt-3 rounded-t-2xl transform group-hover:scale-105 transition-transform duration-150`}
                        style={{
                          clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0% 100%)',
                        }}
                      >
                        <span className="text-3xl font-black drop-shadow-lg tracking-wider">
                          {deck.number}
                        </span>
                        {/* Original subtle pattern overlay - preserved */}
                        <div
                          className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle at 25% 25%, white 2px, transparent 2px)',
                            backgroundSize: '20px 20px',
                          }}
                        ></div>
                      </div>
                      {/* Original glow effect - preserved */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${deck.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-100`}
                      ></div>
                    </div>

                    {/* Original enhanced card display - preserved */}
                    <div className="relative px-4 pt-4 pb-6 flex flex-col items-center justify-start">
                      {/* Original enhanced sub cards - preserved */}
                      <div className="absolute bottom-2 right-3 flex space-x-1 z-20 bg-white/70 backdrop-blur-md p-1.5 rounded-lg shadow-xl border border-white/60 group-hover:scale-105 transition-transform duration-100">
                        {deck.subCards.map((url: string, cardIndex: number) => (
                          <div key={cardIndex} className="relative">
                            <img
                              src={url}
                              alt={`sub-${cardIndex}`}
                              className="w-12 h-16 object-contain rounded border border-white shadow-md hover:scale-110 transition-transform duration-50"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded opacity-0 group-hover:opacity-100 transition-opacity duration-100"></div>
                          </div>
                        ))}
                      </div>

                      {/* Original enhanced main card - preserved */}
                      <div className="relative">
                        <img
                          src={deck.mainCard}
                          alt="main"
                          className="w-28 h-40 object-contain z-10 -mt-16 drop-shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-all duration-200 filter group-hover:brightness-110"
                        />
                        {/* Original card glow effect - preserved */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-transparent via-white/20 to-transparent blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-100"></div>
                      </div>
                    </div>

                    {/* Original enhanced deck name - preserved */}
                    <div className="text-center pb-4 px-3">
                      <p className="font-bold text-lg text-gray-800 tracking-wide group-hover:text-gray-900 transition-colors duration-100">
                        {deck.name}
                      </p>
                      <div
                        className={`w-0 group-hover:w-12 h-0.5 bg-gradient-to-r ${deck.gradient} mx-auto rounded-full transition-all duration-200 delay-50 mt-1`}
                      ></div>
                    </div>

                    {/* Original hover overlay effect - preserved */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-2xl"></div>
                  </div>
                ))}
              </div>

              {/* Original enhanced footer button - preserved */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleCreateNewDeck}
                  className="bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 hover:from-gray-300 hover:via-gray-400 hover:to-gray-300 text-gray-800 font-bold px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-150 border border-gray-300/50 backdrop-blur-sm hover:scale-105 hover:-translate-y-1"
                >
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    Create New Deck
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckSelectorModal;
