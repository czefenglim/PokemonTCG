'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import abi from '@/lib/data/pokemonCardABI.json';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';

type Card = {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  rarity?: string;
};

// Particle component for magical effects
const Particle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-yellow-400 rounded-full"
    initial={{
      opacity: 0,
      scale: 0,
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200,
    }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      x: Math.random() * 600 - 300,
      y: Math.random() * 600 - 300,
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 3,
    }}
  />
);

// Star burst effect
const StarBurst = () => (
  <motion.div
    className="absolute inset-0 pointer-events-none"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-yellow-300"
        style={{
          left: '50%',
          top: '50%',
          clipPath:
            'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        }}
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1, 0],
          rotate: 360,
          x: Math.cos((i * 18 * Math.PI) / 180) * 200,
          y: Math.sin((i * 18 * Math.PI) / 180) * 200,
        }}
        transition={{
          duration: 1.5,
          delay: i * 0.1,
          ease: 'easeOut',
        }}
      />
    ))}
  </motion.div>
);

export default function WinnerReward() {
  const [card, setCard] = useState<Card | null>(null);
  const [stage, setStage] = useState<
    'claim' | 'summoning' | 'revealing' | 'revealed'
  >('claim');
  const [loading, setLoading] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const { isConnected } = useAccount();
  const router = useRouter();

  const openReward = async () => {
    if (!isConnected || typeof window === 'undefined' || !window.ethereum) {
      alert('Please connect your wallet first.');
      return;
    }

    setLoading(true);
    setStage('summoning');
    setShowParticles(true);

    try {
      // 1️⃣ Get one random card from API
      const res = await fetch('/api/packs/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 }),
      });
      const data = await res.json();
      const rewardCard: Card = data.cards[0];

      // 2️⃣ Prepare mint
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        abi,
        signer
      );

      // 3️⃣ Mint 1 copy of this card
      const tx = await contract.mintCard(rewardCard.tokenId, 1);
      await tx.wait();

      // 4️⃣ Show card and proceed to revealing stage
      setCard(rewardCard);
      setStage('revealing');

      // Auto reveal after animation
      setTimeout(() => {
        setStage('revealed');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to mint reward card');
      setStage('claim');
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    router.push('/user/battle/pvp');
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-black flex flex-col items-center justify-center overflow-hidden z-50">
      {/* Background particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <Particle key={i} delay={i * 0.1} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {stage === 'claim' && (
          <motion.div
            key="claim"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 p-8 rounded-2xl text-center border-2 border-yellow-400/50 backdrop-blur-lg shadow-2xl"
          >
            <motion.h2
              className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-6"
              animate={{
                textShadow: [
                  '0 0 10px rgba(255,215,0,0.5)',
                  '0 0 20px rgba(255,215,0,0.8)',
                  '0 0 10px rgba(255,215,0,0.5)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉 Victory Reward! 🎉
            </motion.h2>
            <p className="mb-6 text-gray-200 text-lg">
              Congratulations, trainer! You've earned a special card.
            </p>
            <motion.button
              onClick={openReward}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg shadow-lg transition-all duration-300"
            >
              {loading ? 'Summoning...' : 'Claim Your Reward'}
            </motion.button>
          </motion.div>
        )}

        {stage === 'summoning' && (
          <motion.div
            key="summoning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 20px rgba(255,215,0,0.5)',
                  '0 0 40px rgba(255,215,0,1)',
                  '0 0 20px rgba(255,215,0,0.5)',
                ],
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                scale: { duration: 1, repeat: Infinity },
                boxShadow: { duration: 1.5, repeat: Infinity },
              }}
            />
            <motion.h3
              className="text-2xl text-yellow-300 font-bold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Minting your card...
            </motion.h3>
          </motion.div>
        )}

        {(stage === 'revealing' || stage === 'revealed') && card && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            {/* Star burst effect on reveal */}
            {stage === 'revealing' && <StarBurst />}

            {/* Card container */}
            <motion.div
              className="relative w-80 aspect-[3/4] perspective-1000"
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: stage === 'revealing' ? [0, 360, 720] : 0,
                scale: stage === 'revealed' ? [1, 1.1, 1] : 1,
              }}
              transition={{
                rotateY: { duration: 1.5, ease: 'easeInOut' },
                scale: { duration: 0.5, delay: 1.5 },
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Card back (Pokemon Ball) */}
              <motion.div
                className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="w-full h-full relative">
                  <img
                    src="/images/pokemon-ball.jpeg"
                    alt="Pokemon Ball Card Back"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-4 border-4 border-white/30 rounded-lg">
                    <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-white/20 rounded flex items-center justify-center">
                      <motion.div
                        className="text-6xl"
                        animate={{
                          rotate: [0, 360],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      >
                        ⚡
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card front */}
              <motion.div
                className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl"
                style={{ backfaceVisibility: 'hidden' }}
                animate={
                  stage === 'revealed'
                    ? {
                        boxShadow: [
                          '0 0 20px rgba(255,215,0,0.3)',
                          '0 0 40px rgba(255,215,0,0.6)',
                          '0 0 20px rgba(255,215,0,0.3)',
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 relative">
                  {/* Card border with rarity glow */}
                  <div
                    className={`absolute inset-2 rounded-lg border-4 ${
                      card.rarity === 'Rare'
                        ? 'border-yellow-400'
                        : card.rarity === 'Uncommon'
                        ? 'border-gray-400'
                        : 'border-amber-600'
                    }`}
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="w-full h-full object-contain rounded"
                    />
                  </div>

                  {/* Holographic effect overlay */}
                  {card.rarity === 'Rare' && (
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-20"
                      animate={{
                        x: [-100, 400],
                        rotate: [0, 45, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                      style={{
                        background:
                          'linear-gradient(45deg, transparent 30%, rgba(255,0,255,0.1) 50%, rgba(0,255,255,0.1) 70%, transparent 100%)',
                      }}
                    />
                  )}

                  {/* Card name */}
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <h3 className="text-xl font-bold text-gray-800 bg-white/80 rounded px-2 py-1">
                      {card.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating text effects */}
            {stage === 'revealed' && (
              <motion.div
                className="absolute -top-16 left-1/2 transform -translate-x-1/2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
              >
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-yellow-300 mb-2">
                    {card.name}
                  </h3>
                  {card.rarity && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        card.rarity === 'Rare'
                          ? 'bg-yellow-500 text-black'
                          : card.rarity === 'Uncommon'
                          ? 'bg-gray-400 text-black'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {card.rarity}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back to lobby button */}
      {stage === 'revealed' && (
        <motion.button
          onClick={onClose}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-300"
        >
          🚀 Return to Battle Lobby
        </motion.button>
      )}
    </div>
  );
}
