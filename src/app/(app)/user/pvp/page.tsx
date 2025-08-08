'use client';
import { useState } from 'react';

type Card = {
  id: string;
  name: string;
  image: string;
};

export default function PvPPage() {
  // Mock player's hand
  const initialHand: Card[] = [
    {
      id: 'xy1-1',
      name: 'Venusaur EX',
      image: 'https://images.pokemontcg.io/xy1/1.png',
    },
    {
      id: 'xy1-2',
      name: 'Weedle',
      image: 'https://images.pokemontcg.io/xy1/2.png',
    },
    {
      id: 'xy1-3',
      name: 'Caterpie',
      image: 'https://images.pokemontcg.io/xy1/3.png',
    },
  ];

  const [hand, setHand] = useState<Card[]>(initialHand);
  const [board, setBoard] = useState<Card[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [turn, setTurn] = useState<'player' | 'opponent'>('player');

  // Simulate playing a card
  const playCard = (card: Card) => {
    setBoard([...board, card]);
    setHand(hand.filter((c) => c.id !== card.id));
    setLog([...log, `You played ${card.name}`]);
    setTurn('opponent');
    // Simulate opponent move
    setTimeout(() => {
      setLog((prev) => [...prev, 'Opponent played a card']);
      setTurn('player');
    }, 1000);
  };

  // Simulate ending turn
  const endTurn = () => {
    setLog([...log, 'You ended your turn']);
    setTurn('opponent');
    setTimeout(() => {
      setLog((prev) => [...prev, 'Opponent played a card']);
      setTurn('player');
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6 text-white flex flex-col">
      <h1 className="text-2xl font-bold text-yellow-300 mb-4">
        PvP Battle (Mock UI)
      </h1>

      {/* Opponent Area */}
      <div className="mb-6 border border-yellow-500 rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Opponent's Board</h2>
        <div className="flex gap-2">
          <div className="w-16 h-24 bg-gray-700 rounded"></div>
          <div className="w-16 h-24 bg-gray-700 rounded"></div>
          <div className="w-16 h-24 bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Player's Board */}
      <div className="mb-6 border border-yellow-500 rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Your Board</h2>
        <div className="flex gap-2">
          {board.map((card) => (
            <img
              key={card.id}
              src={card.image}
              alt={card.name}
              className="w-16 rounded shadow"
            />
          ))}
        </div>
      </div>

      {/* Player Hand */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Your Hand</h2>
        <div className="flex gap-4">
          {hand.map((card) => (
            <button
              key={card.id}
              onClick={() => playCard(card)}
              disabled={turn !== 'player'}
              className="flex flex-col items-center hover:scale-105 transition"
            >
              <img src={card.image} alt={card.name} className="w-24 rounded" />
              <span className="text-sm mt-1">{card.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={endTurn}
          disabled={turn !== 'player'}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded disabled:opacity-50"
        >
          End Turn
        </button>
      </div>

      {/* Battle Log */}
      <div className="border border-yellow-500 rounded p-4 h-40 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Battle Log</h2>
        {log.map((entry, i) => (
          <p key={i} className="text-sm">
            {entry}
          </p>
        ))}
      </div>
    </main>
  );
}
