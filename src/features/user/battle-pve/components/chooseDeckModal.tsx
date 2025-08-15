//src\components\pve\chooseDeckModal.tsx - FIXED: Proper 2-step flow
import React, { useState } from 'react';
import DeckSelectorModal from './deckSelectorModal'; // Updated import path
import { useRouter } from 'next/navigation';
import { createBattle } from '@/lib/battle-pve/api-utils'; // NEW: Import battle creation

interface Opponent {
  id: string;
  name: string;
  image: string;
  element: string;
  difficulty: string;
  intro: string;
  rewardCoins: number;
}

interface Deck {
  id: string;
  name: string;
  cards: any[];
}

interface ChooseDeckModalProps {
  opponent: Opponent;
  onClose: () => void;
}

const elementColorMap: Record<string, any> = {
  GRASS: {
    headerLight: 'from-green-300 via-emerald-300 to-green-400',
    headerDark: 'from-green-500 via-emerald-500 to-green-600',
    cardBg: 'bg-gradient-to-br from-emerald-50 to-green-100',
    text: 'text-green-700',
    btnFrom: 'from-green-400',
    btnTo: 'to-emerald-600',
    glow: 'shadow-green-300/50',
    accent: 'text-green-500',
    border: 'border-green-200',
    ring: 'ring-green-200',
  },
  FIRE: {
    headerLight: 'from-red-300 via-orange-300 to-red-400',
    headerDark: 'from-red-500 via-orange-500 to-red-600',
    cardBg: 'bg-gradient-to-br from-orange-50 to-red-100',
    text: 'text-red-700',
    btnFrom: 'from-red-400',
    btnTo: 'to-orange-600',
    glow: 'shadow-red-300/50',
    accent: 'text-red-500',
    border: 'border-red-200',
    ring: 'ring-red-200',
  },
  WATER: {
    headerLight: 'from-blue-300 via-sky-300 to-blue-400',
    headerDark: 'from-blue-500 via-sky-500 to-blue-600',
    cardBg: 'bg-gradient-to-br from-sky-50 to-blue-100',
    text: 'text-blue-700',
    btnFrom: 'from-blue-400',
    btnTo: 'to-sky-600',
    glow: 'shadow-blue-300/50',
    accent: 'text-blue-500',
    border: 'border-blue-200',
    ring: 'ring-blue-200',
  },
  ELECTRIC: {
    headerLight: 'from-yellow-200 via-yellow-300 to-amber-300',
    headerDark: 'from-yellow-400 via-yellow-500 to-amber-500',
    cardBg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    text: 'text-yellow-700',
    btnFrom: 'from-yellow-400',
    btnTo: 'to-amber-500',
    glow: 'shadow-yellow-300/50',
    accent: 'text-yellow-600',
    border: 'border-yellow-200',
    ring: 'ring-yellow-200',
  },
  PSYCHIC: {
    headerLight: 'from-purple-300 via-violet-300 to-purple-400',
    headerDark: 'from-purple-500 via-violet-500 to-purple-600',
    cardBg: 'bg-gradient-to-br from-purple-50 to-violet-100',
    text: 'text-purple-700',
    btnFrom: 'from-purple-400',
    btnTo: 'to-violet-600',
    glow: 'shadow-purple-300/50',
    accent: 'text-purple-500',
    border: 'border-purple-200',
    ring: 'ring-purple-200',
  },
  FIGHTING: {
    headerLight: 'from-orange-200 via-amber-300 to-orange-300',
    headerDark: 'from-orange-400 via-amber-500 to-orange-600',
    cardBg: 'bg-gradient-to-br from-orange-50 to-amber-100',
    text: 'text-orange-700',
    btnFrom: 'from-orange-400',
    btnTo: 'to-amber-600',
    glow: 'shadow-orange-300/50',
    accent: 'text-orange-500',
    border: 'border-orange-200',
    ring: 'ring-orange-200',
  },
  DARK: {
    headerLight: 'from-gray-600 via-gray-700 to-gray-800',
    headerDark: 'from-gray-800 via-gray-900 to-black',
    cardBg: 'bg-gradient-to-br from-gray-800 to-gray-900',
    text: 'text-gray-100',
    btnFrom: 'from-gray-700',
    btnTo: 'to-black',
    glow: 'shadow-gray-700/50',
    accent: 'text-gray-300',
    border: 'border-gray-600',
    ring: 'ring-gray-600',
  },
  METAL: {
    headerLight: 'from-gray-300 via-slate-300 to-gray-400',
    headerDark: 'from-gray-500 via-slate-500 to-gray-600',
    cardBg: 'bg-gradient-to-br from-gray-100 to-slate-200',
    text: 'text-gray-800',
    btnFrom: 'from-gray-400',
    btnTo: 'to-slate-600',
    glow: 'shadow-gray-300/50',
    accent: 'text-gray-600',
    border: 'border-gray-300',
    ring: 'ring-gray-300',
  },
  DRAGON: {
    headerLight: 'from-yellow-300 via-amber-300 to-orange-400',
    headerDark: 'from-yellow-500 via-amber-500 to-orange-600',
    cardBg: 'bg-gradient-to-br from-yellow-50 to-amber-100',
    text: 'text-yellow-800',
    btnFrom: 'from-yellow-500',
    btnTo: 'to-orange-600',
    glow: 'shadow-yellow-300/50',
    accent: 'text-yellow-600',
    border: 'border-yellow-300',
    ring: 'ring-yellow-300',
  },
  FAIRY: {
    headerLight: 'from-pink-200 via-rose-200 to-pink-300',
    headerDark: 'from-pink-400 via-rose-400 to-pink-500',
    cardBg: 'bg-gradient-to-br from-pink-50 to-rose-100',
    text: 'text-pink-700',
    btnFrom: 'from-pink-400',
    btnTo: 'to-rose-600',
    glow: 'shadow-pink-300/50',
    accent: 'text-pink-500',
    border: 'border-pink-200',
    ring: 'ring-pink-200',
  },
  Default: {
    headerLight: 'from-slate-300 via-gray-300 to-slate-400',
    headerDark: 'from-gray-500 via-slate-500 to-gray-600',
    cardBg: 'bg-gradient-to-br from-gray-50 to-slate-100',
    text: 'text-gray-700',
    btnFrom: 'from-gray-400',
    btnTo: 'to-slate-600',
    glow: 'shadow-gray-300/50',
    accent: 'text-gray-500',
    border: 'border-gray-300',
    ring: 'ring-gray-300',
  },
};

export default function ChooseDeckModal({
  opponent,
  onClose,
}: ChooseDeckModalProps) {
  const router = useRouter();
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [creatingBattle, setCreatingBattle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = elementColorMap[opponent.element] || elementColorMap.Default;

  // Handle deck selection from deckSelectorModal
  const handleDeckSelected = (deck: Deck) => {
    console.log('Deck selected from selector:', deck);
    setSelectedDeck(deck);
    setDeckModalOpen(false); // Close deck selector modal
    // Stay on chooseDeckModal to show selected deck and allow "Start Battle"
  };

  // Handle battle creation when "Start Battle" is clicked
  const handleStartBattle = async () => {
    if (!selectedDeck) {
      alert('Please select a deck first!');
      return;
    }

    // Validate deck has exactly 10 cards
    if (selectedDeck.cards.length !== 10) {
      alert('Your deck must have exactly 10 cards to battle!');
      return;
    }

    try {
      setCreatingBattle(true);
      setError(null);

      console.log('Creating battle with:', {
        opponentId: opponent.id,
        deckId: selectedDeck.id,
      });

      // Create battle via API
      const result = await createBattle(opponent.id, selectedDeck.id);

      console.log('Battle created successfully:', result);

      // Navigate to the new battle
      router.push(`/user/battle/pve/battle/${result.battleId}`);

      // Close modal
      onClose();
    } catch (error) {
      console.error('Failed to create battle:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create battle'
      );
    } finally {
      setCreatingBattle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-fadeIn">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r ${theme.headerLight} rounded-full opacity-20 animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="w-[90%] max-w-4xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 transform animate-slideUp">
        {/* Enhanced Header with glow effect */}
        <div className="relative overflow-hidden">
          <div
            className={`bg-gradient-to-r ${theme.headerLight} px-6 py-6 text-center relative`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white drop-shadow-lg tracking-wide">
                {opponent.name}
              </h2>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="w-2 h-2 rounded-full bg-white/80" />
                <span className="text-sm text-white/90 font-semibold">
                  {opponent.element} Type • {opponent.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced slanted background with gradient overlay */}
          <div className="relative h-24">
            <div
              className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${theme.headerDark}`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0% 100%)' }}
            />
            <div
              className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-black/10 to-transparent"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 40%, 0% 100%)' }}
            />
          </div>
        </div>

        {/* Enhanced Close Button */}
        <button
          onClick={onClose}
          disabled={creatingBattle}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full text-xl text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 z-20 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="font-bold">×</span>
        </button>

        {/* Battle creation loading overlay */}
        {creatingBattle && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-3xl flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Creating Battle...
              </h3>
              <p className="text-gray-600">
                Setting up your battle against {opponent.name}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced Content */}
        <div className="flex flex-col lg:flex-row items-center justify-between px-6 -mt-20 pb-8 z-10 relative gap-6">
          {/* Enhanced Pokemon Card */}
          <div className="relative group">
            <div
              className={`w-48 h-64 rounded-3xl ${theme.glow} bg-white/80 backdrop-blur-lg flex items-center justify-center p-3 transform group-hover:scale-105 transition-all duration-500 shadow-2xl border-2 ${theme.border}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
              <img
                src={opponent.image}
                alt={opponent.name}
                className="object-contain rounded-2xl w-full h-full relative z-10 filter drop-shadow-lg"
              />
            </div>
            {/* Floating glow effect */}
            <div
              className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${theme.headerLight} opacity-20 blur-xl scale-110 -z-10 group-hover:opacity-30 transition-opacity duration-500`}
            />
          </div>

          {/* Enhanced Info Cards */}
          <div className="flex-1 space-y-4 max-w-xl">
            {/* Opponent Info Card */}
            <div
              className={`${theme.cardBg} border-2 ${theme.border} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg shadow-lg">
                    👤
                  </div>
                  <h3 className={`text-xl font-bold ${theme.text}`}>
                    Opponent Info
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white/50 rounded-xl">
                    <span className="text-gray-600 font-medium text-sm">
                      Difficulty:
                    </span>
                    <span className="text-gray-700 font-bold text-sm">
                      {opponent.difficulty}
                    </span>
                  </div>
                  <div className="p-3 bg-white/50 rounded-xl">
                    <p className="text-gray-700 font-medium text-sm">
                      {opponent.intro}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rewards Card */}
            <div
              className={`${theme.cardBg} border-2 ${theme.border} rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm relative overflow-hidden`}
            >
              <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-br-full" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-lg shadow-lg">
                    🏆
                  </div>
                  <h3 className={`text-xl font-bold ${theme.text}`}>
                    Battle Rewards
                  </h3>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      💎
                    </div>
                    <span className="font-semibold text-gray-700 text-sm">
                      +{opponent.rewardCoins}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Deck Info */}
            {selectedDeck && (
              <div
                className={`${theme.cardBg} border-2 ${theme.border} rounded-3xl p-6 shadow-xl transition-all duration-300 backdrop-blur-sm relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-lg shadow-lg">
                      📁
                    </div>
                    <h3 className={`text-xl font-bold ${theme.text}`}>
                      Selected Deck
                    </h3>
                  </div>
                  <div className="p-3 bg-white/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">
                        {selectedDeck.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          selectedDeck.cards.length === 10
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {selectedDeck.cards.length}/10 cards
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-100 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col items-center gap-4 px-6 pb-8">
          {/* Choose Deck Button */}
          <button
            onClick={() => setDeckModalOpen(true)}
            disabled={creatingBattle}
            className={`w-full max-w-sm py-3 px-6 border-3 ${theme.border} rounded-2xl bg-white/90 backdrop-blur-sm ${theme.text} font-bold hover:bg-white hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-base relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="text-xl">📁</span>
            <span className="relative z-10">
              {selectedDeck ? selectedDeck.name : 'Choose Your Deck'}
            </span>
          </button>

          {/* Start Battle Button */}
          <button
            disabled={!selectedDeck || creatingBattle}
            onClick={handleStartBattle}
            className={`w-full max-w-sm py-3 px-6 rounded-2xl text-white text-lg font-black flex items-center justify-center gap-3 transition-all duration-300 transform relative overflow-hidden group ${
              selectedDeck && !creatingBattle
                ? `bg-gradient-to-r ${theme.btnFrom} ${theme.btnTo} hover:scale-105 shadow-xl hover:shadow-2xl ${theme.glow}`
                : 'bg-gray-300 cursor-not-allowed opacity-60'
            }`}
          >
            {selectedDeck && !creatingBattle && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            )}
            <span className="text-2xl">{creatingBattle ? '⚡' : '🚀'}</span>
            <span className="relative z-10 tracking-wide">
              {creatingBattle ? 'CREATING...' : 'START BATTLE'}
            </span>
          </button>
        </div>
      </div>

      {/* Deck Selector Modal - FIXED: No battle creation, just deck selection */}
      {deckModalOpen && (
        <DeckSelectorModal
          mode="battle_start" // Show card count indicators
          onSelect={handleDeckSelected} // Just select deck, don't create battle
          onClose={() => setDeckModalOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-10px) rotate(120deg);
          }
          66% {
            transform: translateY(5px) rotate(240deg);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-float {
          animation: float infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
