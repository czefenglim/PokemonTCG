// components/CosmicBackground.tsx
import { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export default function CosmicBackground() {
  // track cursor normalized [-0.5,0.5]
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      setCursor({
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
      });
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  // motion values for parallax
  const mx = useMotionValue(cursor.x);
  const my = useMotionValue(cursor.y);
  const slowX = useTransform(mx, (v) => v * 20);
  const slowY = useTransform(my, (v) => v * 20);

  useEffect(() => {
    mx.set(cursor.x);
    my.set(cursor.y);
  }, [cursor.x, cursor.y, mx, my]);

  // generate star positions once
  const stars = useRef(
    Array.from({ length: 100 }).map(() => ({
      x: Math.random() * 100 + '%',
      y: Math.random() * 100 + '%',
      size: Math.random() * 2 + 1,
      delay: Math.random() * 3,
    }))
  ).current;

  return (
    <div className="fixed inset-0 overflow-hidden -z-10">
      {/* 1. Base cosmic gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #1A0546 0%, #000014 100%)',
          x: slowX,
          y: slowY,
        }}
      />

      {/* 2. Twinkling stars */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full"
          style={{
            top: star.y,
            left: star.x,
            width: star.size,
            height: star.size,
          }}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, delay: star.delay }}
        />
      ))}

      {/* 3. Energy swirl ring */}
      <motion.div
        className="absolute border-2 rounded-full pointer-events-none"
        style={{
          width: 800,
          height: 800,
          top: '50%',
          left: '50%',
          x: '-50%',
          y: '-50%',
          borderImage: 'conic-gradient(from 0deg, #ff4e50, #f9d423) 1',
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
      />

      {/* 4. Nebula cloud layers */}
      <motion.img
        src="/images/nebula1.png"
        alt="nebula"
        className="absolute pointer-events-none"
        style={{ top: '-10%', left: '-20%', width: 1200 }}
        initial={{ opacity: 0.2, scale: 1 }}
        animate={{ x: [0, 50, 0], y: [0, 30, 0], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.img
        src="/images/nebula2.png"
        alt="nebula"
        className="absolute pointer-events-none"
        style={{ bottom: '-15%', right: '-25%', width: 1400 }}
        initial={{ opacity: 0.15, scale: 1 }}
        animate={{ x: [0, -60, 0], y: [0, -40, 0], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 5. Subtle noise overlay */}
      <div className="absolute inset-0 bg-noise" />
    </div>
  );
}
