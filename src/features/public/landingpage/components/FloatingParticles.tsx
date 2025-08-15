'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[-1]">
      {[...Array(20)].map((_, i) => {
        const left = `${Math.random() * 100}%`;
        const top = `${Math.random() * 100}%`;
        const duration = 10 + Math.random() * 20;
        const delay = Math.random() * 10;

        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{ left, top }}
            animate={{ y: [-20, -2000], opacity: [0, 1, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}
