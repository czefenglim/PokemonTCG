'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { GemSuccessNotification } from '@/components/GemSuccessNotification';

type GemPackage = {
  id: string;
  stripeId: string;
  amount: number;
  price: number;
  badge: string;
  color: string;
  glow: string;
  popular: boolean;
};

export default function BuyGemsPage() {
  const [gemPackages, setGemPackages] = useState<GemPackage[]>([]);
  const [userGems, setUserGems] = useState<number | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [hoveredPackage, setHoveredPackage] = useState<string | null>(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [purchasedAmount, setPurchasedAmount] = useState<number | null>(null);
  const searchParams = useSearchParams();

  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packagesRes, gemsRes] = await Promise.all([
          fetch('/api/gems'),
          fetch('/api/user/gems'),
        ]);

        const [packagesData, gemsData] = await Promise.all([
          packagesRes.json(),
          gemsRes.json(),
        ]);

        setGemPackages(packagesData);
        setUserGems(gemsData.gems);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  // Handle success notification
  useEffect(() => {
    if (searchParams.get('success')) {
      setShowSuccessNotification(true);

      // Try to get purchase amount from URL or localStorage
      const amountFromUrl = searchParams.get('amount');
      const amountFromStorage = localStorage.getItem('purchasedGemAmount');

      if (amountFromUrl) {
        setPurchasedAmount(parseInt(amountFromUrl));
      } else if (amountFromStorage) {
        setPurchasedAmount(parseInt(amountFromStorage));
        localStorage.removeItem('purchasedGemAmount'); // Clean up
      }
    }
  }, [searchParams]);

  // Handle buy gems
  const handleBuy = async (priceId: string) => {
    setLoading(priceId);

    // Find the package being purchased to get the amount
    const selectedPackage = gemPackages.find((pkg) => pkg.stripeId === priceId);
    if (selectedPackage) {
      setPurchasedAmount(selectedPackage.amount);
    }

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        gemAmount: selectedPackage?.amount || 0, // ✅ Send gem amount to backend
      }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(null);
      alert('Something went wrong.');
    }
  };

  // Handle close success notification
  const handleCloseSuccessNotification = () => {
    setShowSuccessNotification(false);
    setPurchasedAmount(null); // Reset purchased amount
    // Clean up localStorage
    localStorage.removeItem('purchasedGemAmount');
    // Optional: Clear the success parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('success');
    url.searchParams.delete('amount'); // Also remove amount if present
    window.history.replaceState(null, '', url.toString());
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background with floating elements */}
      <div className="absolute inset-0">
        {/* Floating gems animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                x: [0, Math.sin(i) * 50, 0],
                rotate: [0, 180, 360],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                delay: i * 1.5,
                ease: 'easeInOut',
              }}
              className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              💎
            </motion.div>
          ))}
        </div>
      </div>

      {/* Success Notification */}
      <GemSuccessNotification
        isVisible={showSuccessNotification}
        userGems={userGems}
        purchasedAmount={purchasedAmount}
        onClose={handleCloseSuccessNotification}
      />

      <main className="relative z-10 min-h-screen text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Fixed Hero Section - Perfectly Centered Title */}
          <section className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative mb-6 flex justify-center"
            >
              {/* Glowing background - positioned behind title */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>

              <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400 bg-clip-text text-transparent text-center"
              >
                {/* Gem emoji positioned absolutely to not affect centering */}
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -left-16 md:-left-20 top-1/2 transform -translate-y-1/2 text-4xl md:text-6xl"
                >
                  💎
                </motion.span>

                {/* Centered text */}
                <span className="block">Buy Gems</span>
              </motion.h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
            >
              Unlock premium packs, trade legendary cards, and dominate the
              battlefield. Your journey to become the ultimate trainer starts
              here.
            </motion.p>
          </section>

          {/* Enhanced Current Balance */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center mb-16"
          >
            <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.span
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="text-3xl"
                  >
                    💎
                  </motion.span>
                  <span className="text-lg font-medium">Your Balance:</span>
                </div>
                <div className="text-right">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.8 }}
                    className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
                  >
                    {userGems !== null ? userGems.toLocaleString() : '...'}
                  </motion.span>
                  <div className="text-sm text-white/60">Gems</div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Enhanced Notifications - Only Canceled */}
          <AnimatePresence>
            {searchParams.get('canceled') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                className="mb-8 max-w-md mx-auto bg-red-500/20 border border-red-500/30 backdrop-blur-md p-4 rounded-2xl text-center"
              >
                <div className="flex items-center justify-center gap-2 text-red-400 font-semibold">
                  <span className="text-2xl">❌</span>
                  Payment canceled.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fixed Packages Section - Better Grid Alignment */}
          <section className="mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
              {gemPackages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  onHoverStart={() => setHoveredPackage(pkg.id)}
                  onHoverEnd={() => setHoveredPackage(null)}
                  className={`relative group cursor-pointer w-full ${
                    pkg.popular ? 'order-first lg:order-none' : ''
                  }`}
                  style={{
                    // Center the popular package on medium screens
                    ...(pkg.popular && gemPackages.length === 3
                      ? {
                          gridColumn: 'md:1 / md:-1 lg:auto',
                          justifySelf: 'md:center lg:auto',
                          maxWidth: 'md:400px lg:none',
                        }
                      : {}),
                  }}
                >
                  {/* Popular badge */}
                  {pkg.popular && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.2 }}
                      className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                        🔥 Most Popular
                      </div>
                    </motion.div>
                  )}

                  {/* Card container */}
                  <div
                    className={`relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center transition-all duration-500 h-full flex flex-col ${
                      hoveredPackage === pkg.id
                        ? `shadow-2xl ${pkg.glow} border-white/40`
                        : 'shadow-xl'
                    } ${
                      pkg.popular
                        ? 'border-purple-400/50 shadow-purple-500/20'
                        : ''
                    }`}
                  >
                    {/* Gradient background overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${pkg.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}
                    ></div>

                    {/* Badge */}
                    <div
                      className={`inline-block bg-gradient-to-r ${pkg.color} text-white text-xs font-bold px-3 py-1 rounded-full mb-6 self-center`}
                    >
                      {pkg.badge}
                    </div>

                    {/* Animated gem */}
                    <motion.div
                      animate={
                        hoveredPackage === pkg.id
                          ? {
                              rotate: [0, 15, -15, 0],
                              scale: [1, 1.1, 1],
                            }
                          : {
                              rotate: [0, 5, -5, 0],
                            }
                      }
                      transition={{
                        duration: hoveredPackage === pkg.id ? 0.5 : 3,
                        repeat: Infinity,
                      }}
                      className="text-7xl mb-6 relative z-10"
                    >
                      💎
                    </motion.div>

                    {/* Amount */}
                    <motion.h2
                      className="text-3xl font-black mb-2 relative z-10"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span
                        className={`bg-gradient-to-r ${pkg.color} bg-clip-text text-transparent`}
                      >
                        {pkg.amount.toLocaleString()}
                      </span>
                      <span className="text-white/80 text-lg ml-2">Gems</span>
                    </motion.h2>

                    {/* Price */}
                    <p className="text-2xl font-bold text-white mb-6 relative z-10">
                      {pkg.price}
                    </p>

                    {/* Value indicator */}
                    <div className="text-sm text-white/60 mb-6 relative z-10 flex-grow">
                      <span
                        className={`bg-gradient-to-r ${pkg.color} bg-clip-text text-transparent font-semibold`}
                      >
                        $
                        {pkg.price && pkg.amount
                          ? (
                              (parseFloat(pkg.price.replace('$', '')) /
                                pkg.amount) *
                              1000
                            ).toFixed(2)
                          : 'N/A'}
                      </span>
                      <span className="ml-1">per 1000 gems</span>
                    </div>

                    {/* Enhanced Buy Button */}
                    <motion.button
                      onClick={() => handleBuy(pkg.stripeId)}
                      disabled={loading === pkg.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative w-full bg-gradient-to-r ${pkg.color} hover:shadow-2xl text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group mt-auto`}
                    >
                      {/* Button glow effect */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${pkg.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur`}
                      ></div>

                      <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading === pkg.id ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear',
                              }}
                              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            />
                            Redirecting...
                          </>
                        ) : (
                          <>
                            <span>Buy Now</span>
                            <motion.span
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              ✨
                            </motion.span>
                          </>
                        )}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Additional Features Section */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-20 text-center"
          >
            <h3 className="text-2xl font-bold mb-8 text-white/90">
              What You Can Do With Gems
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                {
                  icon: '📦',
                  title: 'Open Premium Packs',
                  desc: 'Unlock rare and legendary cards',
                },
                {
                  icon: '🔄',
                  title: 'Trade & Exchange',
                  desc: 'Trade with other collectors',
                },
                {
                  icon: '⚔️',
                  title: 'Battle Rewards',
                  desc: 'Enter premium tournaments',
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="font-bold mb-2">{feature.title}</h4>
                  <p className="text-white/70 text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
