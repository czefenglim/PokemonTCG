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
  transactionHash?: string;
  networkName?: string;
  blockchainVerified?: boolean;
};

// Network utility functions (simplified from your pack opening)
const networkUtils = {
  getNetworkName: (chainId: number) => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      80001: 'Polygon Mumbai',
      31337: 'Hardhat Local',
    };
    return networks[chainId] || `Unknown Network (${chainId})`;
  },
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
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);

  const { isConnected, address, chain } = useAccount();
  const router = useRouter();

  // Get connected chain ID
  useEffect(() => {
    if (!window.ethereum) return;

    const updateChainId = (chainIdHex: string) => {
      setConnectedChainId(parseInt(chainIdHex, 16));
    };

    window.ethereum
      .request({ method: 'eth_chainId' })
      .then(updateChainId)
      .catch((err: any) => console.error('Failed to get chain ID:', err));

    window.ethereum.on('chainChanged', updateChainId);

    return () => {
      window.ethereum.removeListener('chainChanged', updateChainId);
    };
  }, []);

  const openReward = async () => {
    if (!isConnected || typeof window === 'undefined' || !window.ethereum) {
      setError('Please connect your wallet first.');
      return;
    }

    if (!address) {
      setError('Wallet address not found.');
      return;
    }

    setLoading(true);
    setStage('summoning');
    setShowParticles(true);
    setError(null);

    try {
      // STEP 1: Get random card ID from smart contract (same as pack opening)
      setStatus('🎁 Generating your reward card...');

      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        abi,
        signer
      );

      // Get 1 random Pokemon ID from the contract
      let randomTokenId: number;
      try {
        const contractRandomIds = await contract.getRandomPokemonIds(
          1,
          Date.now()
        );
        randomTokenId = Number(contractRandomIds[0]);
        console.log('✅ Contract random ID:', randomTokenId);
      } catch (contractError) {
        console.warn('⚠️ Contract getRandomPokemonIds failed, using fallback');
        // Fallback to random ID between 1-150 (adjust based on your max Pokemon ID)
        randomTokenId = Math.floor(Math.random() * 150) + 1;
      }

      // STEP 2: Fetch card metadata using your existing API
      setStatus('📡 Loading card metadata...');

      const fetchCardViaApi = async (tokenId: number) => {
        const metaRes = await fetch(`/api/pokemon/${tokenId}`, {
          headers: { Accept: 'application/json' },
        });
        if (!metaRes.ok) {
          throw new Error(`Metadata API failed for token ${tokenId}`);
        }
        return await metaRes.json();
      };

      const meta = await fetchCardViaApi(randomTokenId);

      // Extract rarity from attributes (following your pack pattern)
      const rarityFromMeta = (meta?.attributes || []).find(
        (a: any) => a.trait_type === 'Rarity'
      )?.value;

      const rewardCard: Card = {
        tokenId: randomTokenId,
        tcgId: meta?.tcgId || `reward-${randomTokenId}`,
        name: meta?.name || `Pokemon #${randomTokenId}`,
        imageUrl: meta?.image || '',
        rarity: rarityFromMeta || 'Common',
      };

      console.log('✅ Reward card metadata loaded:', rewardCard);

      // STEP 3: Mint on blockchain
      setStatus('⛓️ Waiting for wallet confirmation...');

      // Mint the reward card
      const ids = [BigInt(rewardCard.tokenId)];
      const amounts = [BigInt(1)];

      console.log('🔗 Calling mintCardsForPack with:', { ids, amounts });

      const tx = await contract.mintCardsForPack(ids, amounts);

      setStatus('⛓️ Minting reward card on blockchain...');
      console.log('Transaction sent:', tx.hash);

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // STEP 4: Create final card object with transaction info
      const finalCard: Card = {
        ...rewardCard,
        transactionHash: tx.hash,
        networkName: networkUtils.getNetworkName(connectedChainId || 0),
        blockchainVerified: true,
      };

      // STEP 5: Show card and proceed to revealing stage
      setCard(finalCard);
      setStage('revealing');
      setStatus('✅ Reward card minted successfully!');

      // Auto reveal after animation
      setTimeout(() => {
        setStage('revealed');
        setStatus('');
      }, 1500);
    } catch (err: any) {
      console.error('Reward minting error:', err);

      // Enhanced error handling (following your pack pattern)
      let errorMessage = 'Failed to mint reward card';

      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        errorMessage = 'Transaction was rejected by user';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees';
      } else if (err.message?.includes('Token ID exceeds maximum')) {
        errorMessage = 'Invalid token ID';
      } else if (err.message?.includes('API request failed')) {
        errorMessage = 'Failed to generate reward card - please try again';
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setStage('claim');
      setStatus('');
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

      {/* Status message */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="bg-black/50 backdrop-blur-lg border border-white/20 rounded-lg px-6 py-3">
              <p className="text-white font-medium">{status}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200 text-center backdrop-blur-lg"
        >
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-xs"
          >
            Dismiss
          </button>
        </motion.div>
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
            {!isConnected && (
              <p className="mb-4 text-red-300 text-sm">
                Please connect your wallet to claim your reward.
              </p>
            )}
            <motion.button
              onClick={openReward}
              disabled={loading || !isConnected}
              whileHover={{ scale: isConnected && !loading ? 1.05 : 1 }}
              whileTap={{ scale: isConnected && !loading ? 0.95 : 1 }}
              className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300 ${
                isConnected && !loading
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading
                ? 'Summoning...'
                : !isConnected
                ? 'Connect Wallet'
                : 'Claim Your Reward'}
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
            <p className="text-gray-300 text-sm mt-2">
              Please confirm the transaction in your wallet
            </p>
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
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjMzc0MTUxIiByeD0iMTIiLz4KPHN2ZyB4PSI3MCIgeT0iMTEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01aDNWOGg0djRoM2wtNSA1eiIvPgo8L3N2Zz4KPHR2ZXh0IHg9IjEwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNhcmQgSW1hZ2U8L3RleHQ+Cjx0ZXh0IHg9IjEwMCIgeT0iMjIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+';
                      }}
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
                  {card.transactionHash && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p>✅ Minted on {card.networkName}</p>
                      <p className="font-mono">
                        Tx: {card.transactionHash.slice(0, 10)}...
                      </p>
                    </div>
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
