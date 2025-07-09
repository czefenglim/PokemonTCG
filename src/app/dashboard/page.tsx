// app/dashboard/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.4,
        ease: 'easeOut' as const,
      },
    }),
  };

  if (status === 'loading') {
    return <p className="text-yellow-200">Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return <p className="text-red-400">You must be logged in.</p>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 py-10 px-4 flex flex-col items-center">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl flex flex-col md:flex-row justify-between items-center mb-8"
      >
        <div className="flex items-center gap-4">
          <img
            src="https://images.pokemontcg.io/base1/58.png"
            alt="Trainer Avatar"
            className="w-16 h-16 rounded-full border-2 border-yellow-400"
          />
          <div>
            <h1 className="text-3xl font-bold text-yellow-300">
              {session?.user?.name
                ? `Welcome, ${session.user.name}`
                : 'Welcome, Trainer'}
            </h1>
            <p className="text-yellow-200 text-sm">
              Your Pokémon adventure begins here.
            </p>
          </div>
        </div>
        <div className="flex gap-4 mt-4 md:mt-0">
          <div className="bg-yellow-500/10 border border-yellow-400 px-4 py-2 rounded-lg text-yellow-200">
            Gems: <span className="font-semibold">120</span>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-400 px-4 py-2 rounded-lg text-yellow-200">
            Next Pack: <span className="font-semibold">2h 15m</span>
          </div>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        {[
          {
            title: 'Open Card Pack',
            desc: 'Reveal new cards and expand your collection.',
            img: '4.png',
            href: '/packs',
          },
          {
            title: 'Marketplace',
            desc: 'Buy and sell cards with other trainers.',
            img: '2.png',
            href: '/marketplace',
          },
          {
            title: 'My Inventory',
            desc: 'View all cards you own.',
            img: '5.png',
            href: '/inventory',
          },
          {
            title: 'PvE Battle',
            desc: 'Challenge AI opponents for rewards.',
            img: '15.png',
            href: '/game/pve',
          },
          {
            title: 'PvP Battle',
            desc: 'Compete against other trainers in real time.',
            img: '7.png',
            href: '/game/pvp',
          },
        ].map((card, i) => (
          <motion.button
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(card.href)}
            className="group bg-gradient-to-br from-yellow-600/20 to-yellow-400/10 border border-yellow-500/40 rounded-xl shadow-lg p-6 flex flex-col items-center focus:outline-none"
          >
            <motion.img
              src={`https://images.pokemontcg.io/base1/${card.img}`}
              alt={card.title}
              className="w-24 mb-4"
              whileHover={{ rotate: 5 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
            <h2 className="text-lg font-semibold text-yellow-200">
              {card.title}
            </h2>
            <p className="text-sm text-yellow-100 opacity-80">{card.desc}</p>
          </motion.button>
        ))}
      </div>
    </main>
  );
}
