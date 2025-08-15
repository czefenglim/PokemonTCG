// src/components/fight/CoinFlip.tsx
import { useState, useEffect } from 'react';

interface CoinFlipProps {
  starter: 'player' | 'opponent'; // Who starts first
  onStart: () => void; // Called after clicking button
  onMusicStart: () => void; // NEW: Callback to start music in parent
}

export default function CoinFlip({
  starter,
  onStart,
  onMusicStart,
}: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const handleCoinFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    // Simulate coin flip duration
    setTimeout(() => {
      setIsFlipping(false);
      setShowResult(true);
    }, 2000);
  };

  // Auto-start coin flip when component mounts
  useEffect(() => {
    handleCoinFlip();
  }, []);

  const handleStartBattle = () => {
    // Call parent's music start function
    onMusicStart();
    setHasStarted(true);

    // Small delay for dramatic effect
    setTimeout(() => {
      onStart();
    }, 1000);
  };

  if (hasStarted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="mt-4 text-yellow-400 text-lg animate-bounce">
            Prepare for Battle!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center max-w-md mx-4">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-yellow-400 mb-2">
            ⚔️ Battle Begins! ⚔️
          </h2>
        </div>

        {/* Coin Container */}
        <div className="relative mb-8">
          <div className="flex justify-center">
            {!showResult ? (
              <div
                className={`relative ${isFlipping ? 'animate-coin-flip' : ''}`}
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 border-4 border-yellow-300 shadow-2xl flex items-center justify-center">
                  <div className="text-4xl font-bold text-yellow-900">
                    {isFlipping ? '🪙' : '?'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative animate-bounce-in">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl scale-110 animate-pulse" />
                <img
                  src={
                    starter === 'player'
                      ? '/images/battle-pvp/player.png'
                      : '/images/battle-pvp/opponent.png'
                  }
                  alt={
                    starter === 'player' ? 'Player starts' : 'Opponent starts'
                  }
                  className="relative w-32 h-32 rounded-full border-4 border-yellow-400 shadow-2xl object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Result Text */}
        {showResult && (
          <div className="mb-6 animate-fade-in">
            <div className="text-2xl font-bold text-white mb-2">
              {starter === 'player'
                ? '⚡ You Go First! ⚡'
                : '⚡ Opponent Goes First! ⚡'}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-3">
          {!showResult ? (
            <div className="w-full px-6 py-3 rounded-lg font-bold text-lg bg-gray-600 text-gray-400 cursor-not-allowed">
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Flipping Coin...
              </span>
            </div>
          ) : (
            <button
              onClick={handleStartBattle}
              className="w-full px-6 py-3 rounded-lg font-bold text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-400/25 hover:scale-105 transition-all duration-300"
            >
              Enter Battle
            </button>
          )}
        </div>

        {!showResult && isFlipping && (
          <div className="mt-4 text-gray-400 text-xs">
            Determining turn order...
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes coin-flip {
          0% {
            transform: rotateY(0deg) rotateX(0deg);
          }
          25% {
            transform: rotateY(180deg) rotateX(90deg) scale(1.1);
          }
          50% {
            transform: rotateY(360deg) rotateX(180deg) scale(0.9);
          }
          75% {
            transform: rotateY(540deg) rotateX(270deg) scale(1.1);
          }
          100% {
            transform: rotateY(720deg) rotateX(360deg) scale(1);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-50px);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0px);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        .animate-coin-flip {
          animation: coin-flip 2s ease-in-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
