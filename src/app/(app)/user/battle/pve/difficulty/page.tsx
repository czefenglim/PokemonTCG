// /app/pve/difficulty/page.tsx - Enhanced with beautiful animations + improved UI
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { ethers } from 'ethers';

interface DifficultyData {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  unlocked: boolean;
  totalOpponents: number;
  clearedOpponents: number;
}

// Enhanced difficulty configuration with beautiful styling
const originalDifficulties = [
  {
    level: 'Easy',
    difficultyLabel: 'Beginner challenge',
    icon: '✨',
    image: 'https://img.pokemondb.net/artwork/large/pikachu.jpg',
    bgGradient: 'from-yellow-400/20 via-orange-400/20 to-yellow-500/20',
    progressColor: 'bg-green-500',
    badgeColor: 'bg-green-500',
    iconColor: 'text-yellow-500',
    glowColor: 'shadow-yellow-400/50',
    particleColor: 'bg-yellow-400/30',
  },
  {
    level: 'Medium',
    difficultyLabel: 'Intermediate challenge',
    icon: '🔥',
    image: 'https://img.pokemondb.net/artwork/large/charizard.jpg',
    bgGradient: 'from-orange-400/20 via-red-400/20 to-pink-500/20',
    progressColor: 'bg-green-500',
    badgeColor: 'bg-orange-500',
    iconColor: 'text-orange-500',
    glowColor: 'shadow-orange-400/50',
    particleColor: 'bg-orange-400/30',
  },
  {
    level: 'Hard',
    difficultyLabel: 'Advanced challenge',
    icon: '⚡',
    image: 'https://img.pokemondb.net/artwork/large/mewtwo.jpg',
    bgGradient: 'from-purple-400/20 via-indigo-400/20 to-blue-500/20',
    progressColor: 'bg-gray-400',
    badgeColor: 'bg-purple-500',
    iconColor: 'text-purple-500',
    glowColor: 'shadow-purple-400/50',
    particleColor: 'bg-purple-400/30',
  },
];

const DifficultySelectPage = () => {
  const router = useRouter();
  const [difficulties, setDifficulties] = useState(originalDifficulties);
  const [progresses, setProgresses] = useState<number[]>([0, 0, 0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch real data from API
  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        console.log('=== DEBUG: Fetching difficulties ===');

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

        const res = await fetch('/api/battle-pve/difficulties', {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const backendData: DifficultyData[] = await res.json();

        // Merge real data with enhanced styling
        const updatedDifficulties = originalDifficulties.map(
          (origDiff, index) => {
            const backendDiff = backendData.find((bd) => {
              const levelMapping = {
                Easy: 'EASY',
                Medium: 'MEDIUM',
                Hard: 'HARD',
              };
              return (
                bd.difficulty ===
                levelMapping[origDiff.level as keyof typeof levelMapping]
              );
            });

            const completed =
              (backendDiff?.clearedOpponents || 0) ===
                (backendDiff?.totalOpponents || 0) &&
              (backendDiff?.totalOpponents || 0) > 0;

            return {
              ...origDiff,
              battlesCompleted: backendDiff?.clearedOpponents || 0,
              totalBattles: backendDiff?.totalOpponents || 0,
              completed,
              unlocked: backendDiff?.unlocked ?? index === 0,
              progressColor: completed
                ? 'bg-green-500'
                : (backendDiff?.clearedOpponents || 0) > 0
                ? 'bg-green-500'
                : 'bg-gray-400',
            };
          }
        );

        setDifficulties(updatedDifficulties);
      } catch (err: any) {
        console.error('Failed to fetch difficulties:', err);
        setError('Failed to load difficulty data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDifficulties();
  }, []);

  // Animate progress bars
  useEffect(() => {
    if (difficulties.length === 0) return;

    const interval = setInterval(() => {
      setProgresses((prev) =>
        prev.map((val, i) => {
          const target = Math.floor(
            (difficulties[i].battlesCompleted /
              Math.max(difficulties[i].totalBattles, 1)) *
              100
          );
          return val < target ? val + 2 : val;
        })
      );
    }, 30);

    return () => clearInterval(interval);
  }, [difficulties]);

  const handleSelect = (level: string, unlocked: boolean) => {
    if (!unlocked) {
      alert(
        'This difficulty is locked. Complete previous difficulties to unlock!'
      );
      return;
    }
    router.push(`/user/battle/pve/opponent?difficulty=${level}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated loading background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="text-6xl mb-6 animate-bounce">🎮</div>
          <p className="text-white text-xl">Loading difficulties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6 animate-pulse">⚠️</div>
          <p className="text-white text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>

        {/* Medium moving orbs */}
        <div
          className="absolute top-1/3 right-1/3 w-64 h-64 bg-pink-500/15 rounded-full blur-2xl animate-bounce"
          style={{ animationDuration: '6s' }}
        ></div>
        <div
          className="absolute bottom-1/3 left-1/5 w-48 h-48 bg-teal-500/15 rounded-full blur-2xl animate-bounce delay-2000"
          style={{ animationDuration: '8s' }}
        ></div>

        {/* Interactive cursor glow */}
        <div
          className="absolute w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: mousePosition.x - 64,
            top: mousePosition.y - 64,
          }}
        ></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-bounce opacity-60"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Larger floating elements */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-ping opacity-40"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6 px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
            <span className="text-4xl animate-pulse">🎮</span>
            <h1 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent drop-shadow-2xl">
              PvE Difficulty Selection
            </h1>
          </div>
          <p className="text-xl text-white/70 font-medium animate-fade-in">
            Choose your battle difficulty and start your Pokémon journey
          </p>
        </div>

        {/* Enhanced Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {difficulties.map((diff, index) => {
            const progress = progresses[index] || 0;
            const isLocked = !diff.unlocked;

            return (
              <div
                key={diff.level}
                onClick={() => handleSelect(diff.level, diff.unlocked)}
                className={`group relative bg-white/95 backdrop-blur-sm rounded-3xl overflow-hidden transition-all duration-500 transform hover:scale-105 hover:shadow-2xl cursor-pointer border-2 border-white/20 hover:border-white/40 ${
                  isLocked ? 'opacity-60 cursor-not-allowed' : ''
                } ${diff.glowColor} hover:shadow-2xl`}
                style={{
                  animationDelay: `${index * 200}ms`,
                }}
              >
                {/* Lock overlay with enhanced styling */}
                {isLocked && (
                  <div className="absolute inset-0 z-30 bg-black/60 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-5xl mb-3 animate-pulse">🔒</div>
                      <p className="text-white font-bold text-lg">Locked</p>
                      <p className="text-white/70 text-sm mt-1">
                        Complete previous level
                      </p>
                    </div>
                  </div>
                )}

                {/* Enhanced Background Image Section */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={diff.image}
                    alt={diff.level}
                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
                      isLocked ? 'grayscale' : ''
                    }`}
                  />

                  {/* Enhanced gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${diff.bgGradient} group-hover:opacity-80 transition-opacity duration-300`}
                  ></div>

                  {/* Animated progress badge */}
                  <div className="absolute top-4 right-4 transform group-hover:scale-110 transition-transform duration-300">
                    <div
                      className={`px-4 py-2 rounded-xl text-white font-bold text-sm ${diff.badgeColor} shadow-lg animate-pulse`}
                    >
                      {progress}%
                    </div>
                  </div>

                  {/* Enhanced completion check */}
                  {diff.completed && (
                    <div className="absolute top-4 left-4 transform group-hover:scale-110 transition-transform duration-300">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <span className="text-white font-bold text-lg">✓</span>
                      </div>
                    </div>
                  )}

                  {/* Sparkle effects for unlocked cards */}
                  {!isLocked && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                          style={{
                            top: `${20 + Math.random() * 60}%`,
                            left: `${20 + Math.random() * 60}%`,
                            animationDelay: `${i * 200}ms`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Enhanced Content Section */}
                <div className="p-6 bg-white">
                  {/* Enhanced Icon and Title */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`text-3xl ${diff.iconColor} transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300`}
                    >
                      {diff.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">
                        {diff.level} Mode
                      </h3>
                      <p className="text-sm text-gray-600">
                        {diff.difficultyLabel}
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${diff.progressColor} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                        style={{ width: `${progress}%` }}
                      >
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Status and Battle Count */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {diff.completed ? (
                        <span className="text-green-600 font-bold flex items-center gap-2">
                          <span className="animate-bounce">✅</span>
                          Completed
                        </span>
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {diff.battlesCompleted}/{diff.totalBattles} battles
                        </span>
                      )}
                    </div>

                    <button className="text-yellow-600 font-bold text-sm hover:text-yellow-700 transition-all duration-300 transform hover:scale-105 group-hover:animate-pulse">
                      TAP TO START →
                    </button>
                  </div>
                </div>

                {/* Enhanced hover effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 via-transparent to-blue-500/5 rounded-3xl"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Bottom decoration */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-xl hover:bg-white/15 transition-all duration-300">
            <span
              className="text-yellow-400 text-xl animate-spin"
              style={{ animationDuration: '3s' }}
            >
              ⭐
            </span>
            <span className="text-white/70 text-sm font-medium">
              Complete battles to unlock higher difficulties
            </span>
            <span
              className="text-yellow-400 text-xl animate-spin"
              style={{ animationDuration: '3s', animationDirection: 'reverse' }}
            >
              ⭐
            </span>
          </div>
        </div>
      </div>

      {/* CSS for custom animations */}
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
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
};

export default DifficultySelectPage;
