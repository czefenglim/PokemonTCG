'use client';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function FeatureSection() {
  const router = useRouter();

  const features = [
    {
      title: 'Open Packs',
      desc: 'Get new cards instantly.',
      href: '/packs',
      image:
        'https://erp-image.sgliteasset.com/_next/image?url=https%3A%2F%2Fcdn1.sgliteasset.com%2Ftcglah%2Fimages%2Fproduct%2Fproduct-6196361%2Fa2Mujs1367c8634da923c_1741185869.jpg&w=3840&q=100',
      emoji: '🎁',
      stats: '2 packs available',
    },
    {
      title: 'Marketplace',
      desc: 'Trade and buy rare cards.',
      href: '/marketplace',
      image: 'https://static.opensea.io/og-images/Metadata-Image.png',
      emoji: '🛒',
      stats: '14 active listings',
    },
    {
      title: 'My Inventory',
      desc: 'See your collection.',
      href: '/collection',
      image:
        'https://static1.srcdn.com/wordpress/wp-content/uploads/2024/10/poke-mon-tcg-pocket-cards.jpg',
      emoji: '📂',
      stats: '23 cards owned',
    },
    {
      title: 'PvP Battles',
      desc: 'Challenge trainers.',
      href: '/pvp',
      image:
        'https://orig00.deviantart.net/883e/f/2010/357/1/0/how_bw_should_have_been_by_kymotonian-d35ier8.gif',
      emoji: '⚔️',
      stats: '3 challenges waiting',
    },
    {
      title: 'Gem Shop',
      desc: 'Top up your balance.',
      href: '/buy-gems',
      image:
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSR9IIRrUXclUrLZmVfjuBsOnF2iRrmrH4mSA&s',
      emoji: '💎',
      stats: 'Special offers available',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          onClick={() => router.push(feature.href)}
          className="group relative w-64 md:w-72 flex flex-col justify-between bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition transform hover:scale-105 backdrop-blur-md cursor-pointer"
        >
          {/* Background Image */}
          <img
            src={feature.image}
            alt={feature.title}
            className="absolute inset-0 w-full h-full object-cover transition duration-300 ease-in-out blur-[2px] group-hover:blur-none"
          />

          {/* Dark overlay (always visible) */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>

          {/* Hover overlay (optional) */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-center items-center text-center p-4">
            <p className="text-white text-sm mb-3">{feature.stats}</p>
            <span className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg text-xs transition">
              Go to {feature.title}
            </span>
          </div>

          {/* Content */}
          <div className="relative z-10 p-6 flex flex-col gap-4 min-h-64">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span>{feature.emoji}</span>
              <span>{feature.title}</span>
            </div>
            <p className="text-sm text-white/80">{feature.desc}</p>
          </div>

          {/* Footer */}
          <div className="relative z-10 px-6 pb-6 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-yellow-400">
              Explore
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-yellow-400 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
