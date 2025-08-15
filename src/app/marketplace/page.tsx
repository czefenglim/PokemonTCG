// app/marketplace/page.tsx
'use client';
import { useState } from 'react';

type Card = {
  id: string;
  name: string;
  images: { small: string };
  minted: boolean;
  contractAddress?: string;
  tokenId?: string;
};

export default function MarketplacePage() {
  // Mock card data
  const [cards] = useState<Card[]>([
    {
      id: 'xy1-1',
      name: 'Venusaur EX',
      images: { small: 'https://images.pokemontcg.io/xy1/1.png' },
      minted: true,
      contractAddress: '0xYourContractAddressHere',
      tokenId: '1',
    },
    {
      id: 'xy1-2',
      name: 'Weedle',
      images: { small: 'https://images.pokemontcg.io/xy1/2.png' },
      minted: false,
    },
    {
      id: 'xy1-3',
      name: 'Caterpie',
      images: { small: 'https://images.pokemontcg.io/xy1/3.png' },
      minted: false,
    },
  ]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 p-6">
      <h1 className="text-3xl font-bold text-yellow-300 mb-6">
        My Marketplace
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.id}
            className="bg-white/10 border border-yellow-400 rounded-xl p-4 flex flex-col items-center"
          >
            <img
              src={card.images.small}
              alt={card.name}
              className="w-32 mb-2"
            />
            <h2 className="text-lg text-yellow-200 font-semibold">
              {card.name}
            </h2>
            <p
              className={`text-xs px-2 py-1 rounded mt-1 ${
                card.minted
                  ? 'bg-green-600 text-white'
                  : 'bg-yellow-600 text-white'
              }`}
            >
              {card.minted ? 'Minted' : 'Not Minted'}
            </p>
            <div className="flex flex-col gap-2 mt-4 w-full">
              {!card.minted && (
                <button
                  disabled
                  className="bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded cursor-not-allowed"
                >
                  Mint NFT (Coming Soon)
                </button>
              )}
              {card.minted && (
                <button
                  onClick={() =>
                    window.open(
                      `https://opensea.io/assets/${card.contractAddress}/${card.tokenId}`,
                      '_blank'
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                >
                  View on OpenSea
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
