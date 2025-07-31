'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';
import FeatureSection from '@/components/FeatureSection';
import AvatarPickerModal from '@/components/AvatarPickerModal';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.pokemontcg.io/base1/58.png'
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Music state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Load selected avatar from localStorage
    const stored = localStorage.getItem('selectedAvatar');
    if (stored) {
      setAvatarUrl(stored);
    }

    // Auto-play music if flagged after login
    const shouldAutoPlay = localStorage.getItem('shouldAutoPlayMusic');
    if (shouldAutoPlay === 'true' && audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          setPlaying(true);
          console.log('🎵 Music started');
          localStorage.removeItem('shouldAutoPlayMusic'); // prevent repeat
        })
        .catch((err) => {
          console.warn('🔇 Autoplay blocked by browser:', err);
          // Optionally: show a UI prompt to let user manually start music
        });
    }
  }, []);

  if (status === 'loading') {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-yellow-300 text-lg">Loading your dashboard...</p>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-red-400 text-lg">
          You must be logged in to access this page.
        </p>
      </main>
    );
  }

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <main className="min-h-screen text-white p-6 relative">
      {/* Background music element */}
      <audio ref={audioRef} loop>
        <source src="/audio/background-music.mp3" type="audio/mpeg" />
      </audio>

      {/* Volume Button */}
      <button
        onClick={togglePlay}
        className="fixed bottom-4 right-4 bg-yellow-400 p-3 rounded-full shadow hover:bg-yellow-300 transition z-50"
      >
        {playing ? (
          <SpeakerWaveIcon className="w-6 h-6 text-black" />
        ) : (
          <SpeakerXMarkIcon className="w-6 h-6 text-black" />
        )}
      </button>

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 mb-6">
        <h1 className="text-xl font-bold">
          {`Welcome back, ${session?.user?.name || 'Trainer'}!`}
        </h1>
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-9 h-9 rounded-full border-2 border-yellow-400 cursor-pointer"
          onClick={() => setIsAvatarModalOpen(true)}
        />
      </div>

      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl mt-6 mb-10  shadow-2xl"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://i.imgur.com/BwnxyqD.png')",
          }}
        ></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-8">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 text-xs font-semibold uppercase px-3 py-1 rounded-full tracking-wide">
              🔥 Hot Right Now
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow">
              Collect Rare NFT Packs
            </h2>
            <p className="text-white/80 text-base leading-relaxed max-w-lg">
              Unlock exclusive collectibles, showcase your collection, and trade
              with other trainers.
            </p>
            <Link
              href="/packs"
              className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-semibold px-6 py-3 rounded-xl transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 shadow-md hover:shadow-lg"
            >
              <span>Open Packs Now</span>
            </Link>
          </div>

          {/* Pokémon Images */}
          <div className="relative flex-shrink-0 flex items-end mt-6 md:mt-0 z-0 overflow-visible">
            <div className="relative w-36 md:w-48 lg:w-56 z-30 animate-float">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png"
                alt="Charizard"
                className="w-full h-auto object-contain drop-shadow-2xl"
              />
            </div>
            <div className="relative w-28 md:w-36 lg:w-44 -ml-6 z-20 translate-y-3 animate-float-slower">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png"
                alt="Gengar"
                className="w-full h-auto object-contain drop-shadow-xl"
              />
            </div>
            <div className="relative w-24 md:w-32 lg:w-40 -ml-6 z-10 -translate-y-2 animate-float-faster">
              <img
                src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png"
                alt="Snorlax"
                className="w-full h-auto object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Features */}
      <FeatureSection />

      {/* Avatar Modal */}
      <AvatarPickerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSave={(url) => {
          setAvatarUrl(url);
          localStorage.setItem('selectedAvatar', url);
        }}
        currentAvatar={avatarUrl}
      />
    </main>
  );
}
