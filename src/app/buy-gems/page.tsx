'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

const gemPackages = [
  {
    id: 'price_1Rl6oAPfc29YoTXpIGtUmF9e',
    amount: 100,
    price: '$1.00',
  },
  {
    id: 'price_1RyFiEPfc29YoTXp5EB8VgLQ',
    amount: 500,
    price: '$4.00',
  },
  {
    id: 'price_1RyFiWPfc29YoTXphm9cw0zw',
    amount: 1000,
    price: '$7.00',
  },
];

export default function BuyGemsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleBuy = async (priceId: string) => {
    setLoading(priceId);
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(null);
      alert('Something went wrong.');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold mb-4 flex items-center justify-center gap-2"
          >
            <span>💎</span> Buy Gems
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Use gems to unlock packs, trade rare cards, and challenge trainers.
          </motion.p>
        </section>

        {/* Current Balance */}
        <section className="flex justify-center mb-10">
          <div className="w-full md:w-2/3 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💎</span>
              <span>Your Gem Balance:</span>
            </div>
            <span className="text-yellow-400 font-bold text-xl">500</span>
          </div>
        </section>

        {/* Notifications */}
        {searchParams.get('success') && (
          <p className="mb-6 text-green-500 text-center">
            ✅ Payment successful! Gems have been added to your account.
          </p>
        )}
        {searchParams.get('canceled') && (
          <p className="mb-6 text-red-500 text-center">❌ Payment canceled.</p>
        )}

        {/* Packages */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gemPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
              className="relative group border border-white/10 bg-gradient-to-br from-gray-800 to-black p-6 rounded-2xl text-center hover:border-yellow-400 hover:shadow-xl transition"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="text-5xl mb-4"
              >
                💎
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">{pkg.amount} Gems</h2>
              <p className="text-yellow-400 text-lg font-semibold mb-4">
                {pkg.price}
              </p>
              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={loading === pkg.id}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading === pkg.id ? 'Redirecting...' : 'Buy Now'}
              </button>
            </motion.div>
          ))}
        </section>
      </div>
    </main>
  );
}
