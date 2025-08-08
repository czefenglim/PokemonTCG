'use client';
import { useEffect, useState } from 'react';

// ✅ Define a TypeScript type for a card
type Card = {
  id: string;
  name: string;
  hp: string;
  rarity: string;
  images: {
    small: string;
    large: string;
  };
};

export default function Home() {
  // ✅ Explicitly tell TypeScript this is an array of Card
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch('/api/cards');
        const json = await res.json();
        setCards(json.data);
      } catch (error) {
        console.error('Failed to fetch cards:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, []);

  if (loading) {
    return (
      <main className="p-4 text-center">
        <p className="text-lg">Loading cards...</p>
      </main>
    );
  }

  return (
    <main className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.id} className="bg-white rounded shadow p-2">
          <img
            src={card.images.small}
            alt={card.name}
            className="w-full mb-2"
          />
          <h2 className="text-lg font-bold">{card.name}</h2>
          <p className="text-sm text-gray-600">HP: {card.hp}</p>
          <p className="text-sm">{card.rarity}</p>
        </div>
      ))}
    </main>
  );
}
