'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'purple' | 'blue' | 'red' | 'green';
  intensity?: 'light' | 'medium' | 'strong';
  particles?: boolean;
}

export default function AnimatedBackground({
  variant = 'default',
  intensity = 'medium',
  particles = true,
}: AnimatedBackgroundProps) {
  // Fix hydration issue by only rendering particles on client
  const [isClient, setIsClient] = useState(false);
  const [particlePositions, setParticlePositions] = useState<
    Array<{ left: string; top: string }>
  >([]);

  useEffect(() => {
    setIsClient(true);
    // Generate particle positions only on client side
    if (particles) {
      const positions = Array.from({ length: 20 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }));
      setParticlePositions(positions);
    }
  }, [particles]);

  const getGradientClasses = (variant: string) => {
    switch (variant) {
      case 'purple':
        return 'from-purple-900 via-indigo-900 to-purple-900';
      case 'blue':
        return 'from-blue-900 via-indigo-900 to-cyan-900';
      case 'red':
        return 'from-red-900 via-pink-900 to-purple-900';
      case 'green':
        return 'from-emerald-900 via-teal-900 to-cyan-900';
      default:
        return 'from-slate-900 via-purple-900 to-slate-900';
    }
  };

  const getOrbColors = (variant: string) => {
    switch (variant) {
      case 'purple':
        return ['bg-purple-500', 'bg-indigo-500', 'bg-pink-500'];
      case 'blue':
        return ['bg-blue-500', 'bg-cyan-500', 'bg-indigo-500'];
      case 'red':
        return ['bg-red-500', 'bg-pink-500', 'bg-orange-500'];
      case 'green':
        return ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'];
      default:
        return ['bg-purple-500', 'bg-blue-500', 'bg-indigo-500'];
    }
  };

  const getOpacity = (intensity: string) => {
    switch (intensity) {
      case 'light':
        return 'opacity-10';
      case 'strong':
        return 'opacity-30';
      default:
        return 'opacity-20';
    }
  };

  const orbColors = getOrbColors(variant);
  const opacityClass = getOpacity(intensity);

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br ${getGradientClasses(
        variant
      )} -z-10`}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`absolute -top-4 -left-4 w-96 h-96 ${orbColors[0]} rounded-full mix-blend-multiply filter blur-xl ${opacityClass} animate-pulse`}
        />

        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
          className={`absolute top-1/3 -right-4 w-96 h-96 ${orbColors[1]} rounded-full mix-blend-multiply filter blur-xl ${opacityClass} animate-pulse animation-delay-1000`}
        />

        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 10,
          }}
          className={`absolute -bottom-8 left-1/3 w-96 h-96 ${orbColors[2]} rounded-full mix-blend-multiply filter blur-xl ${opacityClass} animate-pulse animation-delay-2000`}
        />
      </div>

      {/* Floating Particles - Only render on client */}
      {particles && isClient && (
        <div className="absolute inset-0">
          {particlePositions.map((position, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + (i % 3), // Use index instead of random
                repeat: Infinity,
                delay: i * 0.5, // Use index instead of random
                ease: 'easeInOut',
              }}
              className="absolute w-2 h-2 bg-white rounded-full opacity-20"
              style={{
                left: position.left,
                top: position.top,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
