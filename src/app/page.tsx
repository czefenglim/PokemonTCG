'use client';

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useScroll,
  useSpring,
} from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import FloatingParticles from '@/components/FloatingParticles';
import Link from 'next/link';

export default function CyberPokemonLanding() {
  const [currentCard, setCurrentCard] = useState(0);
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [pokemonData, setPokemonData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredCard, setHoveredCard] = useState(null);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();

  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);
  const trades = useMotionValue(24000);
  const tradesRounded = useTransform(
    trades,
    (v) => `${Math.round(v / 1000)}K+`
  );

  // Enhanced cyber cards data
  const cyberCards = [
    {
      id: 6,
      name: 'CYBERZARD',
      type: 'FIRE',
      rarity: 'LEGENDARY',
      price: '2.4',
      trend: '+12%',
    },
    {
      id: 25,
      name: 'NEONACHU',
      type: 'ELECTRIC',
      rarity: 'MYTHIC',
      price: '1.8',
      trend: '+8%',
    },
    {
      id: 9,
      name: 'TECHTOISE',
      type: 'WATER',
      rarity: 'EPIC',
      price: '1.2',
      trend: '-3%',
    },
    {
      id: 150,
      name: 'VIRTUALTWO',
      type: 'PSYCHIC',
      rarity: 'ULTRA',
      price: '3.1',
      trend: '+15%',
    },
  ];

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch Pokémon data
  useEffect(() => {
    const fetchPokemonData = async () => {
      setIsLoading(true);
      try {
        const data = await Promise.all(
          cyberCards.map(async (card) => {
            const response = await fetch(
              `https://pokeapi.co/api/v2/pokemon/${card.id}`
            );
            const pokemon = await response.json();
            return {
              ...card,
              image: pokemon.sprites.other['official-artwork'].front_default,
              stats: pokemon.stats.reduce((acc, stat) => {
                acc[stat.stat.name] = stat.base_stat;
                return acc;
              }, {}),
              abilities: pokemon.abilities.map((a) => a.ability.name),
            };
          })
        );
        setPokemonData(data);
      } catch (error) {
        console.error('Error fetching Pokémon data:', error);
        // Fallback data if API fails
        setPokemonData(
          cyberCards.map((card) => ({
            ...card,
            stats: { hp: 100, attack: 120, defense: 80, speed: 90 },
            abilities: ['cyber-boost', 'digital-shield'],
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPokemonData();
  }, []);

  // Animated counters
  useEffect(() => {
    const controls = animate(count, 12450, { duration: 3 });
    const tradesControl = animate(trades, 28500, { duration: 3.5 });
    return () => {
      controls.stop();
      tradesControl.stop();
    };
  }, [count, trades]);

  // Auto-rotation with pause on hover
  useEffect(() => {
    if (hoveredCard !== null) return;

    const interval = setInterval(() => {
      if (pokemonData.length > 0) {
        setGlitchEffect(true);
        setTimeout(() => {
          setCurrentCard((prev) => (prev + 1) % pokemonData.length);
          setGlitchEffect(false);
        }, 300);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pokemonData, hoveredCard]);

  // Helper functions
  function getRarityClass(rarity) {
    switch (rarity) {
      case 'LEGENDARY':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-700 text-yellow-100';
      case 'MYTHIC':
        return 'bg-gradient-to-r from-purple-500 to-pink-600 text-purple-100';
      case 'EPIC':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-blue-100';
      case 'ULTRA':
        return 'bg-gradient-to-r from-red-500 to-pink-500 text-red-100';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  }

  function getTypeColor(type) {
    switch (type) {
      case 'FIRE':
        return '#ef4444';
      case 'WATER':
        return '#3b82f6';
      case 'ELECTRIC':
        return '#eab308';
      case 'PSYCHIC':
        return '#a855f7';
      default:
        return '#6b7280';
    }
  }

  function getTypeGradient(type) {
    switch (type) {
      case 'FIRE':
        return 'rgba(239, 68, 68, 0.5), rgba(252, 165, 165, 0.3)';
      case 'WATER':
        return 'rgba(59, 130, 246, 0.5), rgba(147, 197, 253, 0.3)';
      case 'ELECTRIC':
        return 'rgba(234, 179, 8, 0.5), rgba(253, 224, 71, 0.3)';
      case 'PSYCHIC':
        return 'rgba(168, 85, 247, 0.5), rgba(196, 181, 253, 0.3)';
      default:
        return 'rgba(107, 114, 128, 0.5), rgba(156, 163, 175, 0.3)';
    }
  }

  return (
    <div
      className="min-h-screen bg-black text-white overflow-hidden relative"
      ref={containerRef}
    >
      {/* Enhanced background with parallax */}
      <motion.div
        className="absolute inset-0"
        style={{
          y: useTransform(scrollYProgress, [0, 1], [0, -200]),
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black to-cyan-900/20"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(0,255,255,0.1)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`,
          }}
        ></div>
      </motion.div>

      {/* Dynamic light following cursor */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-30"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,255,255,0.06), transparent 40%)`,
        }}
      />

      {/* Floating particles */}
      <FloatingParticles />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Enhanced title with 3D effect */}
        <motion.div
          className="relative mb-16 text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="absolute inset-0 blur-3xl"
            animate={{
              background: [
                'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                'radial-gradient(circle, rgba(0,255,255,0.3) 0%, transparent 70%)',
                'radial-gradient(circle, rgba(255,0,150,0.3) 0%, transparent 70%)',
              ],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          <h1 className="relative text-7xl md:text-9xl font-black mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 drop-shadow-[0_0_35px_rgba(168,85,247,0.5)]">
              POKÉMON
            </span>
            <motion.span
              className="block text-5xl md:text-7xl mt-2 font-mono"
              animate={{
                textShadow: [
                  '0 0 20px rgba(0,255,255,0.8)',
                  '0 0 40px rgba(0,255,255,0.8)',
                  '0 0 20px rgba(0,255,255,0.8)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-cyan-300">CYBER</span>
              <span className="text-white mx-2">×</span>
              <span className="text-purple-400">CHAIN</span>
            </motion.span>
          </h1>

          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur border border-cyan-500/30 rounded-full mt-4"
            whileHover={{ scale: 1.05, borderColor: 'rgba(0,255,255,0.8)' }}
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono text-cyan-300">
              MAINNET LIVE
            </span>
            <span className="text-xs text-gray-500">v3.1.0</span>
          </motion.div>
        </motion.div>

        {/* Enhanced stats dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 max-w-6xl mx-auto">
          {[
            {
              label: 'CARDS MINTED',
              value: rounded,
              icon: '🎴',
              color: 'from-purple-500 to-pink-500',
            },
            {
              label: 'ACTIVE PLAYERS',
              value: '8,921',
              icon: '👥',
              color: 'from-cyan-400 to-blue-500',
            },
            {
              label: 'DAILY TRADES',
              value: tradesRounded,
              icon: '📊',
              color: 'from-green-400 to-emerald-500',
            },
            {
              label: 'FLOOR PRICE',
              value: 'Ξ0.42',
              icon: '💎',
              color: 'from-yellow-400 to-orange-500',
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
              <motion.div
                className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-cyan-400/50 transition-all overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 right-0 text-6xl opacity-10">
                  {stat.icon}
                </div>
                <div className="relative z-10">
                  <div className="text-xs font-mono text-gray-500 mb-1">
                    {stat.label}
                  </div>
                  <div
                    className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                  >
                    {typeof stat.value === 'object' ? (
                      <motion.span>{stat.value}</motion.span>
                    ) : (
                      stat.value
                    )}
                  </div>
                </div>
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-purple-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced 3D Card Display */}
        {isLoading ? (
          <div className="relative h-[600px] flex items-center justify-center">
            <div className="relative">
              <motion.div
                className="w-24 h-24 border-4 border-cyan-400/30 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute inset-0 w-24 h-24 border-4 border-purple-400/30 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-cyan-300 font-mono text-sm">LOADING</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-[700px] mb-32">
            <div className="absolute inset-0 flex items-center justify-center">
              {pokemonData.map((card, index) => {
                const offset = index - currentCard;
                const isActive = currentCard === index;

                return (
                  <motion.div
                    key={card.id}
                    className="absolute w-[380px] h-[560px]"
                    style={{
                      zIndex: isActive ? 20 : 10 - Math.abs(offset),
                    }}
                    animate={{
                      x: offset * 120,
                      y: Math.abs(offset) * 30,
                      scale: isActive ? 1 : 0.8 - Math.abs(offset) * 0.1,
                      rotateY: offset * -15,
                      opacity: Math.abs(offset) > 2 ? 0 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    onHoverStart={() => setHoveredCard(index)}
                    onHoverEnd={() => setHoveredCard(null)}
                  >
                    <motion.div
                      className={`relative w-full h-full rounded-3xl overflow-hidden cursor-pointer ${
                        isActive ? 'shadow-[0_0_80px_rgba(0,255,255,0.4)]' : ''
                      }`}
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                      onClick={() => setCurrentCard(index)}
                    >
                      {/* Card background with animated gradient */}
                      <motion.div
                        className="absolute inset-0"
                        animate={{
                          background: isActive
                            ? [
                                'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                                'linear-gradient(135deg, #16213e 0%, #0f3460 50%, #1a1a2e 100%)',
                                'linear-gradient(135deg, #0f3460 0%, #1a1a2e 50%, #16213e 100%)',
                              ]
                            : 'linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%)',
                        }}
                        transition={{ duration: 5, repeat: Infinity }}
                      />

                      {/* Holographic overlay */}
                      <motion.div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background:
                            'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                          backgroundSize: '200% 200%',
                        }}
                        animate={{
                          backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />

                      {/* Card content */}
                      <div className="relative z-10 p-8 h-full flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-cyan-400">
                                #{card.id.toString().padStart(3, '0')}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">
                                GEN I
                              </span>
                            </div>
                            <h3 className="text-3xl font-black text-white tracking-tight">
                              {card.name}
                            </h3>
                          </div>
                          <motion.div
                            className={`px-3 py-1.5 text-xs font-bold rounded-full ${getRarityClass(
                              card.rarity
                            )} shadow-lg`}
                            whileHover={{ scale: 1.1 }}
                          >
                            {card.rarity}
                          </motion.div>
                        </div>

                        {/* Pokemon Image Container */}
                        <div className="flex-1 relative mb-6">
                          <motion.div
                            className="absolute inset-0 rounded-2xl overflow-hidden"
                            style={{
                              background: `radial-gradient(circle at 50% 50%, ${getTypeGradient(
                                card.type
                              )}, transparent 70%)`,
                            }}
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />

                          {card.image && (
                            <motion.img
                              src={card.image}
                              alt={card.name}
                              className="relative z-10 w-48 h-48 mx-auto object-contain drop-shadow-2xl"
                              animate={
                                isActive
                                  ? {
                                      y: [0, -10, 0],
                                      filter: [
                                        'drop-shadow(0 20px 30px rgba(0,255,255,0.3))',
                                        'drop-shadow(0 30px 40px rgba(0,255,255,0.5))',
                                        'drop-shadow(0 20px 30px rgba(0,255,255,0.3))',
                                      ],
                                    }
                                  : {}
                              }
                              transition={{ duration: 4, repeat: Infinity }}
                            />
                          )}

                          {/* Type badge */}
                          <motion.div
                            className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${getTypeColor(
                                card.type
                              )}, ${getTypeColor(card.type)}dd)`,
                              boxShadow: `0 4px 15px ${getTypeColor(
                                card.type
                              )}40`,
                            }}
                            whileHover={{ scale: 1.1 }}
                          >
                            {card.type}
                          </motion.div>
                        </div>

                        {/* Stats Grid */}
                        <div className="space-y-3">
                          {/* Price and trend */}
                          <div className="flex justify-between items-center p-3 bg-black/30 rounded-xl backdrop-blur">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                FLOOR
                              </span>
                              <span className="text-lg font-bold text-white">
                                Ξ{card.price}
                              </span>
                            </div>
                            <motion.span
                              className={`text-sm font-bold ${
                                card.trend.startsWith('+')
                                  ? 'text-green-400'
                                  : 'text-red-400'
                              }`}
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {card.trend}
                            </motion.span>
                          </div>

                          {/* Combat stats */}
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries({
                              hp: {
                                color:
                                  'bg-gradient-to-r from-green-500 to-emerald-500',
                                icon: '❤️',
                              },
                              attack: {
                                color:
                                  'bg-gradient-to-r from-red-500 to-orange-500',
                                icon: '⚔️',
                              },
                              defense: {
                                color:
                                  'bg-gradient-to-r from-blue-500 to-cyan-500',
                                icon: '🛡️',
                              },
                              speed: {
                                color:
                                  'bg-gradient-to-r from-yellow-500 to-amber-500',
                                icon: '⚡',
                              },
                            }).map(([stat, config]) => (
                              <div
                                key={stat}
                                className="bg-black/30 rounded-lg p-2 backdrop-blur"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-400 uppercase">
                                    {stat}
                                  </span>
                                  <span className="text-sm">{config.icon}</span>
                                </div>
                                <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <motion.div
                                    className={config.color}
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${
                                        ((card.stats[stat] || 0) / 255) * 100
                                      }%`,
                                    }}
                                    transition={{
                                      delay: isActive ? 0.3 : 0,
                                      duration: 1,
                                    }}
                                  />
                                </div>
                                <div className="text-right mt-1">
                                  <span className="text-xs font-mono text-white">
                                    {card.stats[stat] || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Abilities */}
                          {isActive && card.abilities && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-2 flex-wrap"
                            >
                              {card.abilities.slice(0, 2).map((ability, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30"
                                >
                                  {ability.replace('-', ' ').toUpperCase()}
                                </span>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* Animated border */}
                      <motion.div
                        className="absolute inset-0 rounded-3xl pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${getTypeColor(
                            card.type
                          )}40, transparent)`,
                          backgroundSize: '200% 100%',
                        }}
                        animate={
                          isActive
                            ? {
                                backgroundPosition: ['200% 0', '-200% 0'],
                              }
                            : {}
                        }
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Enhanced navigation */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-8">
              <div className="flex gap-3">
                {pokemonData.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentCard(index)}
                    className="relative w-12 h-12 rounded-full overflow-hidden group"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <div
                      className={`absolute inset-0 ${
                        currentCard === index
                          ? 'bg-gradient-to-r from-cyan-400 to-purple-500'
                          : 'bg-gray-700'
                      } transition-all duration-300`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className={`text-xs font-bold ${
                          currentCard === index ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </div>
                    {currentCard === index && (
                      <motion.div
                        className="absolute inset-0 border-2 border-white rounded-full"
                        initial={{ scale: 0.8, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action section with enhanced CTAs */}
        <motion.div
          className="flex flex-col items-center gap-12 mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent">
              Join the Revolution
            </h2>
            <p className="text-gray-400 text-lg">
              Collect, trade, and battle with blockchain-verified Pokémon cards.
              Every card is a unique NFT with real ownership.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <Link href="/register">
              <motion.button
                className="group relative px-10 py-5 rounded-2xl font-bold text-lg overflow-hidden"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 opacity-90"></div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400"
                  animate={{ x: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ mixBlendMode: 'overlay' }}
                />
                <span className="relative z-10 flex items-center gap-3">
                  <span>START COLLECTING</span>
                  <motion.svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </motion.svg>
                </span>
              </motion.button>
            </Link>

            <motion.button
              className="group relative px-10 py-5 rounded-2xl font-bold text-lg border-2 border-cyan-500/50 overflow-hidden"
              whileHover={{ scale: 1.02, borderColor: 'rgba(0,255,255,0.8)' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 group-hover:opacity-50 transition-opacity"></div>
              <span className="relative z-10 text-cyan-300 flex items-center gap-3">
                <span>VIEW MARKETPLACE</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced blockchain features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20 max-w-5xl mx-auto">
          {[
            {
              icon: '🔐',
              title: 'TRUE OWNERSHIP',
              description:
                'Every card is a unique NFT stored on the blockchain. You own your cards forever.',
              gradient: 'from-purple-500 to-pink-500',
            },
            {
              icon: '⚡',
              title: 'INSTANT TRADES',
              description:
                'Trade cards instantly with players worldwide. No intermediaries, just peer-to-peer.',
              gradient: 'from-cyan-500 to-blue-500',
            },
            {
              icon: '🌐',
              title: 'GLOBAL BATTLES',
              description:
                'Battle trainers across the metaverse with verifiable on-chain results.',
              gradient: 'from-green-500 to-emerald-500',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="relative group"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-8 hover:border-cyan-400/30 transition-all">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3
                  className={`text-xl font-bold mb-3 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                >
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          className="text-center py-8 border-t border-gray-800"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                />
              </svg>
            </motion.div>
            <span className="text-sm font-mono text-gray-400">
              POWERED BY <span className="text-cyan-400">ETHEREUM</span>
            </span>
          </div>
          <p className="text-xs text-gray-600">
            © 2024 Pokémon Cyber Chain. Not affiliated with Nintendo, Game
            Freak, or The Pokémon Company.
          </p>
        </motion.div>
      </div>

      {/* Animated cyber lines */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
    </div>
  );
}
