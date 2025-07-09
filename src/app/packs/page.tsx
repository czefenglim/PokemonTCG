// app/packs/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

type Card = {
  id: string;
  name: string;
  images: { small: string };
};

export default function PacksPage() {
  const [nextPackAt, setNextPackAt] = useState<number | null>(null);
  const [gems, setGems] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/packs/status')
      .then((res) => res.json())
      .then((data) => {
        setNextPackAt(data.nextPackAt);
        setGems(data.gems);
      });
  }, []);

  const openPack = async () => {
    setLoading(true);
    const res = await fetch('/api/packs/open', { method: 'POST' });
    const data = await res.json();
    setCards(data.cards);
    setLoading(false);
  };

  const canOpen = !nextPackAt || nextPackAt < Date.now();

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-yellow-300 mb-4">
        Open Your Pack
      </h1>

      {cards.length === 0 ? (
        <>
          {canOpen ? (
            <button
              onClick={openPack}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded mb-4"
            >
              {loading ? 'Opening...' : 'Open Pack'}
            </button>
          ) : (
            <>
              <p className="text-yellow-200 mb-2">
                Next free pack available at:{' '}
                {new Date(nextPackAt).toLocaleTimeString()}
              </p>
              <button
                onClick={async () => {
                  await fetch('/api/packs/skip', { method: 'POST' });
                  setNextPackAt(Date.now());
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded"
              >
                Spend Gems to Open Now ({gems} gems available)
              </button>
            </>
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ delay: i * 0.2 }}
              className="bg-white/10 border border-yellow-500 rounded-xl p-2"
            >
              <img src={card.images.small} alt={card.name} className="w-full" />
              <p className="text-yellow-200 text-center mt-1">{card.name}</p>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
