'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { useAccount } from 'wagmi';
import abi from '@/lib/pokemonCardABI.json';
import { useSession } from 'next-auth/react';

const SUPPORTED_NETWORKS = [
  {
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://etherscan.io'],
  },
  {
    chainId: 5,
    chainName: 'Goerli Testnet',
    rpcUrls: ['https://goerli.infura.io/v3/YOUR_INFURA_KEY'],
    nativeCurrency: { name: 'Goerli ETH', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: ['https://goerli.etherscan.io'],
  },
  {
    chainId: 80001,
    chainName: 'Polygon Mumbai',
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
  },
  {
    chainId: 31337,
    chainName: 'Hardhat Local',
    rpcUrls: ['http://127.0.0.1:8545'],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrls: null,
  },
];

const networkUtils = {
  isCorrectNetwork: (chainId, targetId) => chainId === targetId,

  switchToNetwork: async (network) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${network.chainId.toString(16)}` }],
      });
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
      } else if (error.code === 4001) {
        throw new Error('User rejected network switch');
      } else {
        throw new Error('Failed to switch network');
      }
    }
  },

  getNetworkName: (chainId) => {
    const found = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
    return found ? found.chainName : `Unknown Network (${chainId})`;
  },

  getSupportedNetworks: () => SUPPORTED_NETWORKS,
};

const rarityColors = {
  Common: 'from-gray-400 to-gray-600',
  Uncommon: 'from-green-400 to-green-600',
  Rare: 'from-blue-400 to-blue-600',
  'Rare Holo': 'from-purple-400 to-purple-600',
  'Rare Holo EX': 'from-yellow-400 to-orange-500',
  'Ultra Rare': 'from-pink-400 to-red-500',
};

// Enhanced Network Switch Modal Component
function NetworkSwitchModal({
  isOpen,
  onClose,
  onConfirm,
  onContinue,
  currentNetwork,
  selectedNetwork,
  setSelectedNetwork,
}) {
  const [hasChangedNetwork, setHasChangedNetwork] = useState(false);
  const [localSelectedNetwork, setLocalSelectedNetwork] = useState(null);

  // Reset the change tracking when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasChangedNetwork(false);
      setLocalSelectedNetwork(null); // Reset to no selection
    }
  }, [isOpen]);

  const handleNetworkChange = (networkChainId) => {
    if (networkChainId === '') {
      // User selected the default "Choose network" option
      setLocalSelectedNetwork(null);
      setHasChangedNetwork(false);
      return;
    }

    const newNetwork = SUPPORTED_NETWORKS.find(
      (net) => net.chainId === parseInt(networkChainId)
    );
    setLocalSelectedNetwork(newNetwork);
    setSelectedNetwork(newNetwork);

    // Check if user changed from the current network
    const currentChainId = SUPPORTED_NETWORKS.find(
      (net) => net.chainName === currentNetwork
    )?.chainId;

    setHasChangedNetwork(currentChainId !== parseInt(networkChainId));
  };

  const handleConfirm = () => {
    if (hasChangedNetwork && localSelectedNetwork) {
      // User selected a different network, proceed with switch
      onConfirm();
    } else {
      // User kept current network or made no selection, proceed with pack opening
      onContinue();
    }
  };

  const getButtonText = () => {
    if (hasChangedNetwork && localSelectedNetwork) {
      return `Switch to ${localSelectedNetwork.chainName}`;
    }
    return `Continue with ${currentNetwork}`;
  };

  const getButtonStyle = () => {
    if (hasChangedNetwork && localSelectedNetwork) {
      return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 relative overflow-hidden';
    }
    return 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-green-500/25 relative overflow-hidden';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-2xl">🔗</span>
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Network Selection
              </h3>

              <p className="text-gray-300 text-sm">
                Choose your preferred network before opening the pack
              </p>
            </div>

            {/* Current Network Display */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-white font-medium text-sm">
                    Currently Connected:
                  </p>
                  <p className="text-blue-300 text-sm font-semibold">
                    {currentNetwork || 'Unknown Network'}
                  </p>
                </div>
              </div>
            </div>

            {/* Network Selection */}
            <div className="mb-6">
              <label className="text-sm text-white block mb-3 font-medium">
                Select Network (Optional):
              </label>
              <select
                value={localSelectedNetwork ? localSelectedNetwork.chainId : ''}
                onChange={(e) => handleNetworkChange(e.target.value)}
                className="bg-slate-800 text-white border border-white/20 rounded-lg px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-white/30"
              >
                <option value="" className="text-gray-400">
                  Choose a network (or continue with current)
                </option>
                {SUPPORTED_NETWORKS.map((net) => (
                  <option key={net.chainId} value={net.chainId}>
                    {net.chainName}
                    {net.chainName === currentNetwork ? ' (Current)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Change Indicator */}
            <AnimatePresence>
              {hasChangedNetwork && localSelectedNetwork && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-orange-400 text-sm mt-0.5">🔄</span>
                    <div>
                      <p className="text-orange-300 text-sm font-medium mb-1">
                        Network Change Detected
                      </p>
                      <p className="text-orange-200/80 text-xs">
                        You've selected{' '}
                        <strong>{localSelectedNetwork.chainName}</strong>. Your
                        wallet will prompt you to switch networks before opening
                        the pack.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Box */}
            {(!hasChangedNetwork || !localSelectedNetwork) && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 text-sm mt-0.5">✅</span>
                  <div>
                    <p className="text-green-300 text-sm font-medium mb-1">
                      Ready to Continue
                    </p>
                    <p className="text-green-200/80 text-xs">
                      You'll continue on your current network. You can always
                      switch later if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-gray-600"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                className={`flex-1 ${getButtonStyle()}`}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {hasChangedNetwork && localSelectedNetwork ? (
                    <>
                      <span className="text-sm">🔄</span>
                      {getButtonText()}
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🚀</span>
                      {getButtonText()}
                    </>
                  )}
                </span>
              </motion.button>
            </div>

            {/* Help Text */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                💡 Network switching is optional and based on your preference
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Gem Spending Confirmation Modal Component
function GemSpendingModal({ isOpen, onClose, onConfirm, gems, timeRemaining }) {
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-2xl">💎</span>
              </motion.div>

              <h3 className="text-2xl font-bold text-white mb-2">
                Skip Wait Time?
              </h3>
              <p className="text-gray-300 text-sm">
                Your next free pack isn't ready yet
              </p>
            </div>

            {/* Time Remaining Display */}
            <div className="bg-black/30 rounded-xl p-4 mb-6 border border-white/10">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-2">Time remaining:</p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {String(hours).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">:</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {String(minutes).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400">Minutes</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gem Cost Info */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-6 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium">Skip wait time:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <span className="text-xl font-bold text-purple-300">500</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Your balance:</span>
                <div className="flex items-center gap-1">
                  <span className="text-lg">💎</span>
                  <span
                    className={`font-semibold ${
                      gems >= 500 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {gems.toLocaleString()}
                  </span>
                </div>
              </div>

              {gems < 500 && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm font-medium">
                    ⚠️ Insufficient gems! You need {500 - gems} more gems.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 border border-gray-600"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: gems >= 500 ? 1.02 : 1 }}
                whileTap={{ scale: gems >= 500 ? 0.98 : 1 }}
                onClick={onConfirm}
                disabled={gems < 500}
                className={`flex-1 font-semibold py-3 px-4 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  gems >= 500
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {gems >= 500 && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-lg">💎</span>
                  {gems >= 500 ? 'Spend 500 Gems' : 'Not Enough Gems'}
                </span>
              </motion.button>
            </div>

            {/* Benefits of skipping */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">
                ✨ Skip the wait and get your cards instantly!
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function PacksPage() {
  const [selectedNetwork, setSelectedNetwork] = useState(SUPPORTED_NETWORKS[0]);
  const [nextPackAt, setNextPackAt] = useState<number | null>(null);
  const [gems, setGems] = useState(0);
  const [cards, setCards] = useState<any[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [resetCount, setResetCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showGemModal, setShowGemModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [connectedChainId, setConnectedChainId] = useState<number | null>(null);
  const [pendingPackOpen, setPendingPackOpen] = useState(false);

  const { isConnected, chain } = useAccount();
  const { data: session, status: sessionStatus } = useSession();

  // Helper to get current Malaysia time (add 8 hours to UTC)
  const getCurrentMalaysiaTime = () => {
    const utcNow = new Date();
    return new Date(utcNow.getTime() + 8 * 60 * 60 * 1000);
  };

  useEffect(() => {
    const getChainId = async () => {
      if (window.ethereum?.request) {
        try {
          const id = await window.ethereum.request({ method: 'eth_chainId' });
          setConnectedChainId(parseInt(id, 16));
        } catch (err) {
          console.error('Failed to get chain ID:', err);
        }
      }
    };

    getChainId();
  }, []);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;

    fetch('/api/packs/status')
      .then((res) => res.json())
      .then((data) => {
        setNextPackAt(data.nextPackAt);
        setGems(data.gems);
        setInitialLoading(false);

        const currentMalaysiaTime = getCurrentMalaysiaTime();
        const nextPackTime = data.nextPackAt;

        console.log('🇲🇾 Frontend Comparison Debug:');
        console.log(
          'Current Malaysia Time:',
          currentMalaysiaTime.toLocaleString('en-US', {
            timeZone: 'Asia/Kuala_Lumpur',
          })
        );
        console.log(
          'Next Pack Time (from DB):',
          new Date(nextPackTime).toLocaleString('en-US', {
            timeZone: 'Asia/Kuala_Lumpur',
          })
        );
        console.log('Current timestamp:', currentMalaysiaTime.getTime());
        console.log('Next pack timestamp:', nextPackTime);
        console.log(
          '⏰ Can Open Pack:',
          nextPackTime <= currentMalaysiaTime.getTime()
        );
        console.log(
          '⏳ Time Difference (hours):',
          (nextPackTime - currentMalaysiaTime.getTime()) / (1000 * 60 * 60)
        );
      })
      .catch((error) => {
        console.error('Failed to fetch pack status:', error);
        setInitialLoading(false);
      });
  }, [sessionStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      const malaysiaTime = getCurrentMalaysiaTime();
      setCurrentTime(malaysiaTime.getTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Function to actually open the pack (after network confirmation)
  const executePackOpen = async (forceOpen = false) => {
    if (!isConnected || typeof window === 'undefined' || !window.ethereum) {
      alert('Please connect your wallet to open a pack.');
      return;
    }

    setLoading(true);
    setStatus('🎴 Preparing your pack...');
    setShowGemModal(false);
    setShowNetworkModal(false);
    setPendingPackOpen(false);

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        abi,
        signer
      );

      // Get random IDs from contract
      let randomIds = null;
      try {
        const contractRandomIds = await contract.getRandomPokemonIds(
          5,
          Date.now()
        );
        randomIds = contractRandomIds.map((id: any) => Number(id));
        console.log('✅ Contract generated IDs:', randomIds);
      } catch (contractError) {
        console.log('Using API fallback generation');
      }

      // Get cards from API
      const res = await fetch('/api/packs/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force: forceOpen,
          email: session?.user?.email,
          userAddress: userAddress,
          tokenIds: randomIds,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.cards) {
        throw new Error(data.error || 'Failed to fetch cards');
      }

      const fetchedCards = data.cards;
      const ids = fetchedCards.map((c: any) => BigInt(c.tokenId));
      const amounts = ids.map(() => BigInt(1));

      // ADD DEBUGGING HERE
      console.log('🔍 Debug Info:');
      console.log('Fetched cards:', fetchedCards);
      console.log(
        'Token IDs to mint:',
        ids.map((id) => Number(id))
      );
      console.log(
        'Amounts to mint:',
        amounts.map((amt) => Number(amt))
      );
      console.log('Arrays length match:', ids.length === amounts.length);
      console.log('Arrays not empty:', ids.length > 0);
      console.log('Max cards check:', ids.length <= 10);

      setStatus('⛓️ Waiting for wallet confirmation...');

      try {
        // Updated function call - removed userAddress parameter
        const tx = await contract.mintCardsForPack(
          ids, // Token IDs as BigInt array
          amounts // Amounts as BigInt array
        );
        setStatus('⛓️ Minting cards on blockchain...');
        await tx.wait();
      } catch (contractError) {
        console.log('Transaction interaction:', {
          code: contractError.code,
          message: contractError.message,
          reason: contractError.reason,
        });

        if (
          contractError.code === 'ACTION_REJECTED' ||
          contractError.code === 4001 ||
          contractError.reason === 'rejected' ||
          contractError.message?.toLowerCase().includes('user rejected') ||
          contractError.message?.toLowerCase().includes('user denied') ||
          contractError.message
            ?.toLowerCase()
            .includes('user denied transaction')
        ) {
          setStatus(
            '🚫 Transaction cancelled - No worries! You can try again anytime.'
          );
          setLoading(false);
          setTimeout(() => setStatus(null), 3000);
          return;
        }

        if (
          contractError.message?.toLowerCase().includes('insufficient funds')
        ) {
          setStatus(
            '💰 Insufficient funds for gas fees - Please add some ETH to your wallet'
          );
          setLoading(false);
          setTimeout(() => setStatus(null), 5000);
          return;
        }

        if (contractError.message?.toLowerCase().includes('network')) {
          setStatus(
            '🌐 Network issue detected - Please check your connection and try again'
          );
          setLoading(false);
          setTimeout(() => setStatus(null), 5000);
          return;
        }

        setStatus('⚠️ Something went wrong - Please try again in a moment');
        setLoading(false);
        setTimeout(() => setStatus(null), 5000);
        return;
      }

      setCards(fetchedCards);
      setRevealed([]);

      // Refresh user status
      const refreshed = await fetch('/api/packs/status');
      const updated = await refreshed.json();
      setNextPackAt(updated.nextPackAt);
      setGems(updated.gems);

      // Update sidebar gems
      if (typeof window !== 'undefined') {
        localStorage.setItem('userGems', updated.gems.toString());
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'userGems',
            newValue: updated.gems.toString(),
            storageArea: localStorage,
          })
        );
        window.dispatchEvent(
          new CustomEvent('gemsUpdated', {
            detail: { gems: updated.gems },
          })
        );
      }

      setLoading(false);
      setStatus('✅ Pack opened successfully!');
      setShowCelebration(true);

      // Auto-clear celebration after 3 seconds
      setTimeout(() => {
        setShowCelebration(false);
        setStatus(null);
      }, 3000);
    } catch (err: any) {
      console.log('Pack opening process:', {
        code: err.code,
        message: err.message,
        reason: err.reason,
        type: 'pack_opening_error',
      });

      if (
        err.code === 'ACTION_REJECTED' ||
        err.code === 4001 ||
        err.reason === 'rejected' ||
        err.message?.toLowerCase().includes('user rejected') ||
        err.message?.toLowerCase().includes('user denied') ||
        err.message?.toLowerCase().includes('user denied transaction')
      ) {
        setStatus(
          "🚫 Transaction cancelled - Feel free to try again whenever you're ready!"
        );
      } else if (err.message?.toLowerCase().includes('insufficient funds')) {
        setStatus(
          '💰 Insufficient funds - Please add some ETH to your wallet for gas fees'
        );
      } else if (err.message?.toLowerCase().includes('network')) {
        setStatus(
          '🌐 Network connection issue - Please check your internet and try again'
        );
      } else if (err.message?.toLowerCase().includes('failed to fetch')) {
        setStatus(
          '📡 Connection timeout - Please check your network and try again'
        );
      } else {
        setStatus(
          '⚠️ Oops! Something unexpected happened - Please try again in a moment'
        );
      }

      setLoading(false);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  // Main openPack function - shows network modal first
  const openPack = async (forceOpen = false) => {
    if (!isConnected || typeof window === 'undefined' || !window.ethereum) {
      alert('Please connect your wallet to open a pack.');
      return;
    }

    const currentMalaysiaTime = getCurrentMalaysiaTime().getTime();
    const isPending = nextPackAt && nextPackAt > currentMalaysiaTime;

    // If pack is still cooling down and not forced, show gem modal
    if (isPending && !forceOpen) {
      setShowGemModal(true);
      return;
    }

    // Store the forceOpen state for later use
    setPendingPackOpen(forceOpen);

    // Always show network modal before opening pack
    setShowNetworkModal(true);
  };

  // Enhanced network switch handler
  const handleNetworkSwitch = async () => {
    try {
      setStatus('🔗 Switching network...');
      await networkUtils.switchToNetwork(selectedNetwork);
      setShowNetworkModal(false);
      setStatus('✅ Network switched successfully!');

      // Auto-proceed with pack opening after successful network switch
      setTimeout(() => {
        executePackOpen(pendingPackOpen);
      }, 1000);
    } catch (error) {
      console.error('Network switch failed:', error);
      setShowNetworkModal(false);
      if (error.message === 'User rejected network switch') {
        setStatus('❌ Network switch cancelled');
      } else {
        setStatus(`❌ ${error.message}`);
      }
    }
  };

  // Handle when user chooses to continue without switching network
  const handleContinueWithCurrentNetwork = () => {
    setShowNetworkModal(false);
    // Proceed with pack opening on current network
    executePackOpen(pendingPackOpen);
  };

  const handleGemSpending = () => {
    if (gems >= 500) {
      openPack(true);
    }
  };

  // Use Malaysia time for comparison
  const currentMalaysiaTime = getCurrentMalaysiaTime().getTime();
  const canOpen =
    !initialLoading && (!nextPackAt || nextPackAt <= currentMalaysiaTime);
  const timeRemaining =
    nextPackAt && !initialLoading
      ? Math.max(0, nextPackAt - currentMalaysiaTime)
      : 0;
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  // Show loading screen while fetching initial data
  if (sessionStatus === 'loading' || initialLoading) {
    return (
      <main className="min-h-screen text-white px-4 py-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          {/* Animated Pokéball */}
          <div className="flex justify-center">
            <motion.div
              className="relative w-20 h-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-gray-800 relative overflow-hidden">
                <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-gray-100 to-white"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 rounded-full border-2 border-gray-200">
                  <div className="w-full h-full bg-white rounded-full m-0.5"></div>
                </div>
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800"></div>
              </div>
            </motion.div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Loading Pack Status...
            </h2>
            <p className="text-gray-300">Checking your pack availability</p>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-white px-4 py-8 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Gem Spending Modal */}
      <GemSpendingModal
        isOpen={showGemModal}
        onClose={() => setShowGemModal(false)}
        onConfirm={handleGemSpending}
        gems={gems}
        timeRemaining={timeRemaining}
      />

      {/* Enhanced Network Switch Modal */}
      <NetworkSwitchModal
        isOpen={showNetworkModal}
        onClose={() => {
          setShowNetworkModal(false);
          setPendingPackOpen(false);
        }}
        onConfirm={handleNetworkSwitch}
        onContinue={handleContinueWithCurrentNetwork}
        currentNetwork={networkUtils.getNetworkName(connectedChainId)}
        selectedNetwork={selectedNetwork}
        setSelectedNetwork={setSelectedNetwork}
      />

      {/* Enhanced animated background */}
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
        <motion.div
          className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-pink-500/20 blur-2xl"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-yellow-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 100],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 1,
                  repeat: 2,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Loading Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-md p-8 bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-purple-900/90 rounded-2xl shadow-2xl text-center space-y-6 border border-purple-500/30"
            >
              {/* Animated Pokéball */}
              <div className="flex justify-center">
                <motion.div
                  className="relative w-20 h-20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-b from-red-500 to-red-600 border-4 border-gray-800 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-gray-100 to-white"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-800 rounded-full border-2 border-gray-200">
                      <div className="w-full h-full bg-white rounded-full m-0.5"></div>
                    </div>
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800"></div>
                  </div>
                </motion.div>
              </div>

              <div className="space-y-2">
                <motion.h2
                  className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Opening Pack...
                </motion.h2>
                <p className="text-gray-300">{status}</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 3, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        {cards.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 mt-8"
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              Pokémon Card Packs
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Open packs to collect rare Pokémon cards and build your ultimate
              deck!
            </p>
          </motion.div>
        )}

        {/* Status Message */}
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center"
            >
              <div
                className={`border rounded-xl px-6 py-4 backdrop-blur-sm ${
                  status.includes('🚫') || status.includes('⚠️')
                    ? 'bg-gradient-to-r from-orange-600/20 to-yellow-600/20 border-orange-500/30'
                    : status.includes('💰') ||
                      status.includes('🌐') ||
                      status.includes('📡')
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30'
                    : 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30'
                }`}
              >
                <p
                  className={`font-medium ${
                    status.includes('🚫') || status.includes('⚠️')
                      ? 'text-orange-200'
                      : status.includes('💰') ||
                        status.includes('🌐') ||
                        status.includes('📡')
                      ? 'text-blue-200'
                      : 'text-green-200'
                  }`}
                >
                  {status}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {cards.length === 0 ? (
          canOpen ? (
            // Enhanced Pokéball Section
            <motion.section
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="min-h-screen flex flex-col items-center justify-center px-4 py-8 space-y-8"
            >
              <div className="relative group">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openPack()}
                  className="w-80 h-80 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-700 border-8 border-gray-800 cursor-pointer relative overflow-hidden shadow-2xl"
                >
                  {/* Pokéball design */}
                  <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-gray-100 to-white"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-800 rounded-full border-4 border-gray-200 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white rounded-full border-2 border-gray-300"></div>
                  </div>
                  <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-800"></div>

                  {/* Hover effect */}
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Shine effect */}
                  <motion.div
                    className="absolute top-8 left-8 w-16 h-16 bg-white/30 rounded-full blur-xl"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>

                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      y: [-10, -30, -10],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.3,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center space-y-4"
              >
                <h2 className="text-3xl font-bold text-white">
                  Ready to Open!
                </h2>
                <p className="text-gray-300 text-lg">
                  Click the Pokéball to open your pack
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    5 Cards per pack
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Guaranteed rare
                  </span>
                </div>
              </motion.div>
            </motion.section>
          ) : (
            // Enhanced Countdown
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center min-h-[60vh]"
            >
              <div className="bg-gradient-to-br from-gray-900/80 to-purple-900/80 border border-purple-500/30 p-12 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto backdrop-blur-xl text-center space-y-8">
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold text-white">
                    Next Free Pack
                  </h3>
                  <p className="text-gray-300">
                    Your next pack will be ready soon!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: hours, label: 'HOURS' },
                    { value: minutes, label: 'MINUTES' },
                    { value: seconds, label: 'SECONDS' },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-600/50 rounded-xl p-4 min-w-[80px]"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 1,
                        delay: index * 0.1,
                        repeat: Infinity,
                      }}
                    >
                      <div className="text-3xl font-bold text-yellow-400 mb-1">
                        {String(item.value).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        {item.label}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openPack()}
                  disabled={gems < 500}
                  className={`relative overflow-hidden group ${
                    gems >= 500
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                      : 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed'
                  } text-white px-8 py-4 rounded-xl shadow-xl font-bold w-full text-lg transition-all duration-300`}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-2xl">💎</span>
                    {gems >= 500
                      ? 'Spend 500 Gems to Open Now'
                      : `Need ${500 - gems} more gems`}
                  </span>
                  {gems >= 500 && (
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </motion.button>
              </div>
            </motion.section>
          )
        ) : (
          // Enhanced Card Grid
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4">
              <motion.h2
                className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎉 Your New Cards! 🎉
              </motion.h2>
              <p className="text-gray-300">Click any card to reveal it</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 justify-center">
              {cards.map((card, index) => {
                const isRevealed = revealed.includes(card.tokenId);
                const rarity = card.rarity || 'Common';

                return (
                  <motion.div
                    key={card.tokenId}
                    initial={{ opacity: 0, y: 50, rotateY: 180 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="relative group"
                  >
                    <motion.div
                      className="relative w-48 h-64 rounded-xl overflow-hidden cursor-pointer"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        !isRevealed &&
                        setRevealed((prev) => [...prev, card.tokenId])
                      }
                    >
                      {!isRevealed ? (
                        // Card Back
                        <div className="w-full h-full bg-gradient-to-br from-blue-800 to-purple-900 border-2 border-gray-600 flex flex-col relative p-6">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_30%,_rgba(59,130,246,0.3)_70%)]"></div>

                          {/* Large Pokéball that fills most of the card height */}
                          <div className="flex-1 flex items-center justify-center">
                            <motion.div
                              className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-6 border-white shadow-lg flex items-center justify-center z-10"
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {/* Pokéball bottom half */}
                              <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-gray-100 to-white rounded-b-full"></div>
                              {/* Center button */}
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border-4 border-white flex items-center justify-center z-10">
                                <div className="w-6 h-6 bg-white rounded-full border-2 border-gray-300"></div>
                              </div>
                              {/* Center line */}
                              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-800 z-5"></div>
                            </motion.div>
                          </div>

                          {/* Text at bottom */}
                          <div className="text-center z-10">
                            <p className="text-white font-bold text-xl mb-1">
                              Pokémon
                            </p>
                            <p className="text-gray-300 text-base">
                              Click to reveal
                            </p>
                          </div>

                          {/* Sparkle effects */}
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute w-2 h-2 bg-white rounded-full"
                              style={{
                                top: `${20 + Math.random() * 60}%`,
                                left: `${20 + Math.random() * 60}%`,
                              }}
                              animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1, 0],
                              }}
                              transition={{
                                duration: 1.5,
                                delay: i * 0.5,
                                repeat: Infinity,
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        // Revealed Card
                        <motion.div
                          initial={{ rotateY: 180 }}
                          animate={{ rotateY: 0 }}
                          transition={{ duration: 0.6 }}
                          className="w-full h-full relative"
                        >
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              e.currentTarget.src =
                                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDIwMCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjgwIiBmaWxsPSIjMzc0MTUxIiByeD0iMTIiLz4KPHN2ZyB4PSI3MCIgeT0iMTEwIiB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzZCNzI4MCI+CjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01aDNWOGg0djRoM2wtNSA1eiIvPgo8L3N2Zz4KPHR2ZXh0IHg9IjEwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5Q0E0QUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNhcmQgSW1hZ2U8L3RleHQ+Cjx0ZXh0IHg9IjEwMCIgeT0iMjIwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPk5vdCBGb3VuZDwvdGV4dD4KPC9zdmc+';
                            }}
                          />

                          {/* Card overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl">
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h3 className="text-white font-bold text-sm mb-2">
                                {card.name}
                              </h3>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-yellow-300 font-semibold">
                                  #{card.tokenId}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${
                                    rarityColors[
                                      rarity as keyof typeof rarityColors
                                    ] || rarityColors.Common
                                  } text-white font-medium shadow-lg`}
                                >
                                  {rarity}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Rarity glow effect */}
                          <div
                            className={`absolute inset-0 rounded-xl bg-gradient-to-r ${
                              rarityColors[
                                rarity as keyof typeof rarityColors
                              ] || rarityColors.Common
                            } opacity-20 blur-sm`}
                          ></div>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Card number indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-lg">
                      {index + 1}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-4 mt-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCards([]);
                  setRevealed([]);
                  setResetCount((prev) => prev + 1);
                  setStatus(null);
                  setShowCelebration(false);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl shadow-lg font-medium border border-purple-400/30 transition-all duration-300 flex items-center gap-2"
              >
                <span className="text-lg">🎴</span>
                Open Another Pack
              </motion.button>

              <a
                href="/user/collection"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-3 rounded-xl shadow-lg font-medium border border-blue-400/30 transition-all duration-300 flex items-center gap-2 transform hover:scale-105 active:scale-95"
              >
                <span className="text-lg">👀</span>
                View Collection
              </a>
            </div>
          </motion.section>
        )}
      </div>
    </main>
  );
}
