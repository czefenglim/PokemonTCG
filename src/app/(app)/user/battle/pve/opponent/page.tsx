// /app/pve/opponent/page.tsx - Phase 6: Added Completion Status Display
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { ethers } from 'ethers';
import ChooseDeckModal from '@/features/user/battle-pve/components/chooseDeckModal';

interface OpponentData {
  id: string;
  name: string;
  element: string;
  difficulty: string;
  portraitUrl: string;
  intro: string;
  rewardCoins: number;
  isUnlocked: boolean;
  isCompleted: boolean; // NEW: Track completion status
}

// Beautiful element styling
const elementIcons: Record<string, string> = {
  GRASS: '🌿',
  FIRE: '🔥',
  WATER: '💧',
  ELECTRIC: '⚡',
  PSYCHIC: '🔮',
  FIGHTING: '👊',
  DARK: '🌙',
  METAL: '⚙️',
  DRAGON: '🐉',
  FAIRY: '✨',
};

const elementColors: Record<string, any> = {
  GRASS: {
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-green-100',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-green-200',
    tag: 'bg-green-100 text-green-700 border-green-200',
  },
  FIRE: {
    gradient: 'from-red-400 via-orange-500 to-yellow-500',
    bgGradient: 'from-red-50 to-orange-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-200',
    tag: 'bg-red-100 text-red-700 border-red-200',
  },
  WATER: {
    gradient: 'from-blue-400 via-cyan-500 to-teal-500',
    bgGradient: 'from-blue-50 to-cyan-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    tag: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  ELECTRIC: {
    gradient: 'from-yellow-400 via-amber-500 to-orange-500',
    bgGradient: 'from-yellow-50 to-amber-100',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    border: 'border-yellow-200',
    tag: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  PSYCHIC: {
    gradient: 'from-purple-400 via-pink-500 to-indigo-500',
    bgGradient: 'from-purple-50 to-pink-100',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-200',
    tag: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  FIGHTING: {
    gradient: 'from-orange-500 via-red-600 to-pink-500',
    bgGradient: 'from-orange-50 to-red-100',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    border: 'border-orange-200',
    tag: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  DARK: {
    gradient: 'from-gray-600 via-slate-700 to-gray-800',
    bgGradient: 'from-gray-50 to-slate-100',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    border: 'border-gray-200',
    tag: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  METAL: {
    gradient: 'from-gray-400 via-slate-500 to-zinc-600',
    bgGradient: 'from-gray-50 to-slate-100',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    border: 'border-gray-200',
    tag: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  DRAGON: {
    gradient: 'from-indigo-500 via-purple-600 to-blue-600',
    bgGradient: 'from-indigo-50 to-purple-100',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-200',
    tag: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
  FAIRY: {
    gradient: 'from-pink-400 via-rose-500 to-purple-500',
    bgGradient: 'from-pink-50 to-rose-100',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    border: 'border-pink-200',
    tag: 'bg-pink-100 text-pink-700 border-pink-200',
  },
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'EASY':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'HARD':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// Map backend data to beautiful UI format
const mapOpponentData = (backendData: OpponentData[]) => {
  return backendData.map((opponent) => ({
    id: opponent.id,
    name: opponent.name,
    image: opponent.portraitUrl,
    element: opponent.element,
    difficulty: opponent.difficulty,
    intro: opponent.intro,
    rewardCoins: opponent.rewardCoins,
    isUnlocked: opponent.isUnlocked,
    isCompleted: opponent.isCompleted, // NEW: Track completion
    colors: elementColors[opponent.element] || elementColors.FIRE,
  }));
};

export default function SelectAIOpponent() {
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'Easy';
  const [aiOpponents, setAiOpponents] = useState<any[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchOpponents = async () => {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask is not installed');
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const session = await getSession();

        const headers: HeadersInit = {
          'X-Wallet-Address': address,
        };

        if (session?.accessToken) {
          headers.Authorization = `Bearer ${session.accessToken}`;
        }

        const backendDifficulty = difficulty.toUpperCase();

        const res = await fetch(
          `/api/battle-pve/opponents?difficulty=${backendDifficulty}`,
          {
            method: 'GET',
            headers,
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const backendData: OpponentData[] = await res.json();
        const uiData = mapOpponentData(backendData);
        setAiOpponents(uiData);
      } catch (err: any) {
        console.error('Failed to fetch opponents:', err);
        setError('Failed to load opponent data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOpponents();
  }, [difficulty]);

  const handleOpponentClick = (opponent: any) => {
    if (!opponent.isUnlocked) {
      alert('This opponent is locked! Complete previous battles to unlock.');
      return;
    }
    setSelectedOpponent(opponent);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚔️</div>
          <p className="text-white text-xl">Loading opponents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <p className="text-white text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-6 shadow-lg shadow-purple-500/25">
            <span className="text-3xl">⚔️</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
            {difficulty} AI Opponents
          </h1>
          <p className="text-xl text-slate-300 font-medium">
            Battle against {difficulty.toLowerCase()}-level AI-powered decks and
            earn rewards
          </p>
        </div>

        {/* Cards Grid with Completion Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiOpponents.map((opponent) => {
            const isHovered = hoveredCard === opponent.id;
            const isLocked = !opponent.isUnlocked;
            const isCompleted = opponent.isCompleted; // NEW: Completion status

            return (
              <div
                key={opponent.id}
                onClick={() => handleOpponentClick(opponent)}
                onMouseEnter={() => setHoveredCard(opponent.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative bg-white rounded-3xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl cursor-pointer ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : ''
                } ${isCompleted ? 'ring-4 ring-green-400/50' : ''}`}
              >
                {/* Element Icon - Top Left Corner */}
                <div className="absolute top-2 left-2 z-20">
                  <div
                    className={`w-12 h-12 ${opponent.colors.iconBg} rounded-full flex items-center justify-center ${opponent.colors.iconColor} text-xl shadow-lg border-2 border-white`}
                  >
                    {elementIcons[opponent.element] || '⭐'}
                  </div>
                </div>

                {/* NEW: Completion Badge - Top Right Corner */}
                {isCompleted && (
                  <div className="absolute top-2 right-2 z-20">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-pulse">
                      <span className="text-xl">✓</span>
                    </div>
                  </div>
                )}

                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 z-30 bg-black/60 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔒</div>
                      <p className="text-white font-bold text-lg">Locked</p>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="flex items-center p-6">
                  {/* Pokemon Card Image */}
                  <div className="flex-shrink-0 relative">
                    <div
                      className={`relative transition-all duration-300 ${
                        isHovered ? 'scale-105 rotate-1' : ''
                      }`}
                    >
                      <img
                        src={opponent.image}
                        alt={opponent.name}
                        className={`w-32 h-44 object-contain drop-shadow-xl transition-all duration-300 ${
                          isLocked ? 'grayscale' : 'group-hover:brightness-110'
                        } ${
                          isCompleted
                            ? 'border-4 border-green-400 rounded-lg'
                            : ''
                        }`}
                      />

                      {/* NEW: Completed overlay on image */}
                      {isCompleted && (
                        <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            DEFEATED
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 ml-6 space-y-4">
                    {/* Header */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
                        {opponent.name}
                        {/* NEW: Completed indicator in name */}
                        {isCompleted && (
                          <span className="ml-2 text-green-600 text-lg">✓</span>
                        )}
                      </h2>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold border ${opponent.colors.tag}`}
                        >
                          {opponent.element} Type
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(
                            opponent.difficulty
                          )}`}
                        >
                          {opponent.difficulty}
                        </span>
                        {/* NEW: Completion status tag */}
                        {isCompleted && (
                          <span className="px-2 py-1 rounded-full text-xs font-bold border bg-green-100 text-green-700 border-green-200">
                            COMPLETED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <div
                      className={`bg-gradient-to-r ${opponent.colors.bgGradient} rounded-lg p-3 ${opponent.colors.border} border`}
                    >
                      <p className="text-sm text-gray-700 font-medium">
                        {opponent.intro}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-600 uppercase tracking-wide">
                        Status
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isCompleted
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : opponent.isUnlocked
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {isCompleted
                          ? 'Defeated'
                          : opponent.isUnlocked
                          ? 'Available'
                          : 'Locked'}
                      </span>
                    </div>

                    {/* Battle Rewards */}
                    <div
                      className={`bg-gradient-to-r ${
                        isCompleted
                          ? 'from-green-50 to-emerald-50 border-green-200'
                          : 'from-yellow-50 to-orange-50 border-yellow-200'
                      } rounded-lg p-3 border`}
                    >
                      <h4
                        className={`text-xs font-bold mb-1 uppercase tracking-wide ${
                          isCompleted ? 'text-green-800' : 'text-yellow-800'
                        }`}
                      >
                        {isCompleted ? 'Battle Completed' : 'Battle Rewards'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {isCompleted ? '🏆' : '💎'}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            isCompleted ? 'text-green-700' : 'text-yellow-700'
                          }`}
                        >
                          {isCompleted
                            ? `${opponent.rewardCoins} Gems Earned`
                            : `${opponent.rewardCoins} Gems`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${opponent.colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-3xl`}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Summary Stats with Completion Info */}
        <div className="mt-16 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Battle Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-white mb-2">
                {aiOpponents.filter((op) => op.isCompleted).length}
              </div>
              <div className="text-slate-300 font-medium">Completed</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-white mb-2">
                {
                  aiOpponents.filter((op) => op.isUnlocked && !op.isCompleted)
                    .length
                }
              </div>
              <div className="text-slate-300 font-medium">Available</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-white mb-2">
                {aiOpponents.length}
              </div>
              <div className="text-slate-300 font-medium">
                Total {difficulty} Opponents
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="text-4xl font-bold text-white mb-2">
                {Math.round(
                  (aiOpponents.filter((op) => op.isCompleted).length /
                    aiOpponents.length) *
                    100
                )}
                %
              </div>
              <div className="text-slate-300 font-medium">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Choose Deck Modal */}
      {selectedOpponent && (
        <ChooseDeckModal
          opponent={selectedOpponent}
          onClose={() => setSelectedOpponent(null)}
        />
      )}
    </div>
  );
}

// // /app/pve/opponent/page.tsx - Fixed sizing + element icon in top left
// "use client";

// import React, { useState, useEffect } from "react";
// import { useSearchParams } from "next/navigation";
// import { getSession } from "next-auth/react";
// import { ethers } from "ethers";
// import ChooseDeckModal from "@/components/pve/chooseDeckModal";

// interface OpponentData {
//   id: string;
//   name: string;
//   element: string;
//   difficulty: string;
//   portraitUrl: string;
//   intro: string;
//   rewardCoins: number;
//   isUnlocked: boolean;
// }

// // Beautiful element styling
// const elementIcons: Record<string, string> = {
//   GRASS: "🌿",
//   FIRE: "🔥",
//   WATER: "💧",
//   ELECTRIC: "⚡",
//   PSYCHIC: "🔮",
//   FIGHTING: "👊",
//   DARK: "🌙",
//   METAL: "⚙️",
//   DRAGON: "🐉",
//   FAIRY: "✨",
// };

// const elementColors: Record<string, any> = {
//   GRASS: {
//     gradient: "from-emerald-400 via-green-500 to-teal-600",
//     bgGradient: "from-emerald-50 to-green-100",
//     iconBg: "bg-green-100",
//     iconColor: "text-green-600",
//     border: "border-green-200",
//     tag: "bg-green-100 text-green-700 border-green-200",
//   },
//   FIRE: {
//     gradient: "from-red-400 via-orange-500 to-yellow-500",
//     bgGradient: "from-red-50 to-orange-100",
//     iconBg: "bg-red-100",
//     iconColor: "text-red-600",
//     border: "border-red-200",
//     tag: "bg-red-100 text-red-700 border-red-200",
//   },
//   WATER: {
//     gradient: "from-blue-400 via-cyan-500 to-teal-500",
//     bgGradient: "from-blue-50 to-cyan-100",
//     iconBg: "bg-blue-100",
//     iconColor: "text-blue-600",
//     border: "border-blue-200",
//     tag: "bg-blue-100 text-blue-700 border-blue-200",
//   },
//   ELECTRIC: {
//     gradient: "from-yellow-400 via-amber-500 to-orange-500",
//     bgGradient: "from-yellow-50 to-amber-100",
//     iconBg: "bg-yellow-100",
//     iconColor: "text-yellow-600",
//     border: "border-yellow-200",
//     tag: "bg-yellow-100 text-yellow-700 border-yellow-200",
//   },
//   PSYCHIC: {
//     gradient: "from-purple-400 via-pink-500 to-indigo-500",
//     bgGradient: "from-purple-50 to-pink-100",
//     iconBg: "bg-purple-100",
//     iconColor: "text-purple-600",
//     border: "border-purple-200",
//     tag: "bg-purple-100 text-purple-700 border-purple-200",
//   },
//   FIGHTING: {
//     gradient: "from-orange-500 via-red-600 to-pink-500",
//     bgGradient: "from-orange-50 to-red-100",
//     iconBg: "bg-orange-100",
//     iconColor: "text-orange-600",
//     border: "border-orange-200",
//     tag: "bg-orange-100 text-orange-700 border-orange-200",
//   },
//   DARK: {
//     gradient: "from-gray-600 via-slate-700 to-gray-800",
//     bgGradient: "from-gray-50 to-slate-100",
//     iconBg: "bg-gray-100",
//     iconColor: "text-gray-600",
//     border: "border-gray-200",
//     tag: "bg-gray-100 text-gray-700 border-gray-200",
//   },
//   METAL: {
//     gradient: "from-gray-400 via-slate-500 to-zinc-600",
//     bgGradient: "from-gray-50 to-slate-100",
//     iconBg: "bg-gray-100",
//     iconColor: "text-gray-600",
//     border: "border-gray-200",
//     tag: "bg-gray-100 text-gray-700 border-gray-200",
//   },
//   DRAGON: {
//     gradient: "from-indigo-500 via-purple-600 to-blue-600",
//     bgGradient: "from-indigo-50 to-purple-100",
//     iconBg: "bg-indigo-100",
//     iconColor: "text-indigo-600",
//     border: "border-indigo-200",
//     tag: "bg-indigo-100 text-indigo-700 border-indigo-200",
//   },
//   FAIRY: {
//     gradient: "from-pink-400 via-rose-500 to-purple-500",
//     bgGradient: "from-pink-50 to-rose-100",
//     iconBg: "bg-pink-100",
//     iconColor: "text-pink-600",
//     border: "border-pink-200",
//     tag: "bg-pink-100 text-pink-700 border-pink-200",
//   },
// };

// const getDifficultyColor = (difficulty: string) => {
//   switch (difficulty) {
//     case "EASY":
//       return "bg-green-100 text-green-700 border-green-200";
//     case "MEDIUM":
//       return "bg-amber-100 text-amber-700 border-amber-200";
//     case "HARD":
//       return "bg-red-100 text-red-700 border-red-200";
//     default:
//       return "bg-gray-100 text-gray-700 border-gray-200";
//   }
// };

// // Map backend data to beautiful UI format
// const mapOpponentData = (backendData: OpponentData[]) => {
//   return backendData.map((opponent) => ({
//     id: opponent.id,
//     name: opponent.name,
//     image: opponent.portraitUrl,
//     element: opponent.element,
//     difficulty: opponent.difficulty,
//     intro: opponent.intro,
//     rewardCoins: opponent.rewardCoins,
//     isUnlocked: opponent.isUnlocked,
//     colors: elementColors[opponent.element] || elementColors.FIRE,
//   }));
// };

// export default function SelectAIOpponent() {
//   const searchParams = useSearchParams();
//   const difficulty = searchParams.get("difficulty") || "Easy";
//   const [aiOpponents, setAiOpponents] = useState<any[]>([]);
//   const [selectedOpponent, setSelectedOpponent] = useState<any>(null);
//   const [hoveredCard, setHoveredCard] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch real data from API
//   useEffect(() => {
//     const fetchOpponents = async () => {
//       try {
//         if (!window.ethereum) {
//           throw new Error("MetaMask is not installed");
//         }

//         const provider = new ethers.BrowserProvider(window.ethereum);
//         const signer = await provider.getSigner();
//         const address = await signer.getAddress();

//         const session = await getSession();

//         const headers: HeadersInit = {
//           "X-Wallet-Address": address,
//         };

//         if (session?.accessToken) {
//           headers.Authorization = `Bearer ${session.accessToken}`;
//         }

//         const backendDifficulty = difficulty.toUpperCase();

//         const res = await fetch(
//           `/api/pve/opponents?difficulty=${backendDifficulty}`,
//           {
//             method: "GET",
//             headers,
//           }
//         );

//         if (!res.ok) {
//           throw new Error(`HTTP error! Status: ${res.status}`);
//         }

//         const backendData: OpponentData[] = await res.json();
//         const uiData = mapOpponentData(backendData);
//         setAiOpponents(uiData);
//       } catch (err: any) {
//         console.error("Failed to fetch opponents:", err);
//         setError("Failed to load opponent data. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOpponents();
//   }, [difficulty]);

//   const handleOpponentClick = (opponent: any) => {
//     if (!opponent.isUnlocked) {
//       alert("This opponent is locked! Complete previous battles to unlock.");
//       return;
//     }
//     setSelectedOpponent(opponent);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-6xl mb-6">⚔️</div>
//           <p className="text-white text-xl">Loading opponents...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-6xl mb-6">⚠️</div>
//           <p className="text-white text-xl mb-4">{error}</p>
//           <button
//             onClick={() => window.location.reload()}
//             className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
//       {/* Background decorative elements */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
//       </div>

//       <div className="relative z-10 max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="text-center mb-12">
//           <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-6 shadow-lg shadow-purple-500/25">
//             <span className="text-3xl">⚔️</span>
//           </div>
//           <h1 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent">
//             {difficulty} AI Opponents
//           </h1>
//           <p className="text-xl text-slate-300 font-medium">
//             Battle against {difficulty.toLowerCase()}-level AI-powered decks and
//             earn rewards
//           </p>
//         </div>

//         {/* Original Sized Cards Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {aiOpponents.map((opponent) => {
//             const isHovered = hoveredCard === opponent.id;
//             const isLocked = !opponent.isUnlocked;

//             return (
//               <div
//                 key={opponent.id}
//                 onClick={() => handleOpponentClick(opponent)}
//                 onMouseEnter={() => setHoveredCard(opponent.id)}
//                 onMouseLeave={() => setHoveredCard(null)}
//                 className={`group relative bg-white rounded-3xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl cursor-pointer ${
//                   isLocked ? "opacity-60 cursor-not-allowed" : ""
//                 }`}
//               >
//                 {/* Element Icon - Top Left Corner */}
//                 <div className="absolute top-2 left-2 z-20">
//                   <div
//                     className={`w-12 h-12 ${opponent.colors.iconBg} rounded-full flex items-center justify-center ${opponent.colors.iconColor} text-xl shadow-lg border-2 border-white`}
//                   >
//                     {elementIcons[opponent.element] || "⭐"}
//                   </div>
//                 </div>

//                 {/* Lock overlay */}
//                 {isLocked && (
//                   <div className="absolute inset-0 z-30 bg-black/60 rounded-3xl flex items-center justify-center backdrop-blur-sm">
//                     <div className="text-center">
//                       <div className="text-4xl mb-2">🔒</div>
//                       <p className="text-white font-bold text-lg">Locked</p>
//                     </div>
//                   </div>
//                 )}

//                 {/* Card Content - Original Size */}
//                 <div className="flex items-center p-6">
//                   {/* Pokemon Card Image - Original Size */}
//                   <div className="flex-shrink-0 relative">
//                     <div
//                       className={`relative transition-all duration-300 ${
//                         isHovered ? "scale-105 rotate-1" : ""
//                       }`}
//                     >
//                       <img
//                         src={opponent.image}
//                         alt={opponent.name}
//                         className={`w-32 h-44 object-contain drop-shadow-xl transition-all duration-300 ${
//                           isLocked ? "grayscale" : "group-hover:brightness-110"
//                         }`}
//                       />
//                     </div>
//                   </div>

//                   {/* Content Section - Compact */}
//                   <div className="flex-1 ml-6 space-y-4">
//                     {/* Header */}
//                     <div>
//                       <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-gray-900 transition-colors">
//                         {opponent.name}
//                       </h2>
//                       <div className="flex items-center gap-2 mb-3">
//                         <span
//                           className={`px-2 py-1 rounded-full text-xs font-bold border ${opponent.colors.tag}`}
//                         >
//                           {opponent.element} Type
//                         </span>
//                         <span
//                           className={`px-2 py-1 rounded-full text-xs font-bold border ${getDifficultyColor(
//                             opponent.difficulty
//                           )}`}
//                         >
//                           {opponent.difficulty}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Description */}
//                     <div
//                       className={`bg-gradient-to-r ${opponent.colors.bgGradient} rounded-lg p-3 ${opponent.colors.border} border`}
//                     >
//                       <p className="text-sm text-gray-700 font-medium">
//                         {opponent.intro}
//                       </p>
//                     </div>

//                     {/* Status */}
//                     <div className="flex items-center justify-between text-sm">
//                       <span className="font-semibold text-gray-600 uppercase tracking-wide">
//                         Status
//                       </span>
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-bold ${
//                           opponent.isUnlocked
//                             ? "bg-green-100 text-green-700 border border-green-200"
//                             : "bg-gray-100 text-gray-700 border border-gray-200"
//                         }`}
//                       >
//                         {opponent.isUnlocked ? "Available" : "Locked"}
//                       </span>
//                     </div>

//                     {/* Battle Rewards */}
//                     <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3 border border-yellow-200">
//                       <h4 className="text-xs font-bold text-yellow-800 mb-1 uppercase tracking-wide">
//                         Battle Rewards
//                       </h4>
//                       <div className="flex items-center gap-2">
//                         <span className="text-lg">💎</span>
//                         <span className="text-sm font-bold text-yellow-700">
//                           {opponent.rewardCoins} Gems
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Hover gradient overlay */}
//                 <div
//                   className={`absolute inset-0 bg-gradient-to-r ${opponent.colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none rounded-3xl`}
//                 ></div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Enhanced Summary Stats */}
//         <div className="mt-16 bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
//           <h3 className="text-2xl font-bold text-white text-center mb-8">
//             Battle Statistics
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
//             <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
//               <div className="text-4xl font-bold text-white mb-2">
//                 {aiOpponents.filter((op) => op.isUnlocked).length}
//               </div>
//               <div className="text-slate-300 font-medium">
//                 Unlocked Opponents
//               </div>
//             </div>
//             <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
//               <div className="text-4xl font-bold text-white mb-2">
//                 {aiOpponents.length}
//               </div>
//               <div className="text-slate-300 font-medium">
//                 Total {difficulty} Opponents
//               </div>
//             </div>
//             <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
//               <div className="text-4xl font-bold text-white mb-2">
//                 {aiOpponents.length -
//                   aiOpponents.filter((op) => op.isUnlocked).length}
//               </div>
//               <div className="text-slate-300 font-medium">
//                 Remaining Challenges
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Choose Deck Modal */}
//       {selectedOpponent && (
//         <ChooseDeckModal
//           opponent={selectedOpponent}
//           onClose={() => setSelectedOpponent(null)}
//         />
//       )}
//     </div>
//   );
// }
