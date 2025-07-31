'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Crown,
  Star,
  Zap,
  Medal,
  Target,
  TrendingUp,
  Users,
  Award,
  Flame,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Eye,
  ArrowUp,
} from 'lucide-react';

export default function HallOfFamePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [animatedItems, setAnimatedItems] = useState(new Set());
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Enhanced mock data with more realistic profiles
  const leaderboardData = [
    {
      id: 1,
      rank: 1,
      username: 'StrikeMaster3000',
      displayName: 'Strike Master',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=strike1&backgroundColor=1e40af',
      totalStrikes: 15847,
      winRate: 94.2,
      level: 67,
      title: '⚡ Lightning Champion',
      isCurrentUser: false,
      country: '🇺🇸',
      streak: 156,
      rankChange: 0,
      lastSeen: '2 min ago',
      badges: ['🏆', '⚡', '🔥'],
      powerLevel: 9850,
    },
    {
      id: 2,
      rank: 2,
      username: 'ThunderBolt99',
      displayName: 'Thunder Bolt',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=thunder2&backgroundColor=7c3aed',
      totalStrikes: 14203,
      winRate: 91.8,
      level: 63,
      title: '⛈️ Storm Lord',
      isCurrentUser: false,
      country: '🇯🇵',
      streak: 89,
      rankChange: 1,
      lastSeen: '5 min ago',
      badges: ['🌩️', '👑', '💎'],
      powerLevel: 9340,
    },
    {
      id: 3,
      rank: 3,
      username: 'ElectricAce',
      displayName: 'Electric Ace',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=electric3&backgroundColor=ea580c',
      totalStrikes: 13956,
      winRate: 89.4,
      level: 61,
      title: '⚡ Volt Warrior',
      isCurrentUser: false,
      country: '🇰🇷',
      streak: 67,
      rankChange: -1,
      lastSeen: '1 hour ago',
      badges: ['⚡', '🛡️', '⭐'],
      powerLevel: 8920,
    },
    {
      id: 4,
      rank: 4,
      username: 'PikaDestroyer',
      displayName: 'Pika Destroyer',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=pika4&backgroundColor=dc2626',
      totalStrikes: 12834,
      winRate: 87.9,
      level: 58,
      title: '🎯 Strike Specialist',
      isCurrentUser: false,
      country: '🇬🇧',
      streak: 34,
      rankChange: 2,
      lastSeen: '15 min ago',
      badges: ['🎯', '💥', '🚀'],
      powerLevel: 8150,
    },
    {
      id: 5,
      rank: 5,
      username: 'ZapKing777',
      displayName: 'Zap King',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=zap5&backgroundColor=059669',
      totalStrikes: 11792,
      winRate: 85.6,
      level: 55,
      title: '👑 Thunder Sage',
      isCurrentUser: false,
      country: '🇩🇪',
      streak: 23,
      rankChange: 0,
      lastSeen: '3 hours ago',
      badges: ['👑', '🌟', '💫'],
      powerLevel: 7680,
    },
    {
      id: 6,
      rank: 47,
      username: 'YourUsername',
      displayName: 'Rising Star',
      avatar:
        'https://api.dicebear.com/7.x/adventurer/svg?seed=you&backgroundColor=2563eb',
      totalStrikes: 3247,
      winRate: 72.3,
      level: 28,
      title: '🌟 Rising Striker',
      isCurrentUser: true,
      country: '🇲🇾',
      streak: 12,
      rankChange: 5,
      lastSeen: 'Online',
      badges: ['🌟', '🎮', '💪'],
      powerLevel: 2890,
    },
  ];

  const periods = [
    {
      key: 'all-time',
      label: 'All Time',
      icon: Crown,
      gradient: 'from-yellow-400 to-amber-500',
    },
    {
      key: 'monthly',
      label: 'This Month',
      icon: Star,
      gradient: 'from-purple-400 to-pink-500',
    },
    {
      key: 'weekly',
      label: 'This Week',
      icon: TrendingUp,
      gradient: 'from-green-400 to-blue-500',
    },
  ];

  const stats = {
    totalPlayers: 847203,
    averageStrikes: 1847,
    topStriker: 'StrikeMaster3000',
    onlineNow: 12456,
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedItems((prev) => {
        const newSet = new Set(prev);
        if (newSet.size < leaderboardData.length) {
          newSet.add(newSet.size);
        }
        return newSet;
      });
    }, 100);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-7 h-7 text-yellow-400 drop-shadow-lg" />;
      case 2:
        return <Medal className="w-7 h-7 text-slate-300 drop-shadow-lg" />;
      case 3:
        return <Medal className="w-7 h-7 text-amber-600 drop-shadow-lg" />;
      default:
        return <Target className="w-6 h-6 text-blue-400" />;
    }
  };

  const getRankStyle = (rank, isCurrentUser) => {
    if (isCurrentUser) {
      return {
        card: 'bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border-blue-400/50 shadow-2xl shadow-blue-500/25',
        glow: 'shadow-blue-400/50',
      };
    }

    switch (rank) {
      case 1:
        return {
          card: 'bg-gradient-to-br from-yellow-400/20 via-amber-500/15 to-orange-500/10 border-yellow-400/50 shadow-2xl shadow-yellow-500/30',
          glow: 'shadow-yellow-400/60',
        };
      case 2:
        return {
          card: 'bg-gradient-to-br from-slate-300/20 via-slate-400/15 to-slate-500/10 border-slate-300/50 shadow-2xl shadow-slate-400/25',
          glow: 'shadow-slate-300/50',
        };
      case 3:
        return {
          card: 'bg-gradient-to-br from-amber-600/20 via-amber-700/15 to-amber-800/10 border-amber-600/50 shadow-2xl shadow-amber-600/25',
          glow: 'shadow-amber-500/50',
        };
      default:
        return {
          card: 'bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-600/20 border-slate-500/30 hover:border-slate-400/50',
          glow: 'shadow-slate-500/20',
        };
    }
  };

  const getRankChangeIcon = (change) => {
    if (change > 0) return <ChevronUp className="w-4 h-4 text-emerald-400" />;
    if (change < 0) return <ChevronDown className="w-4 h-4 text-red-400" />;
    return (
      <div className="w-4 h-4 flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Cursor Following Light */}
      <div
        className="absolute w-96 h-96 bg-gradient-radial from-blue-500/10 to-transparent rounded-full pointer-events-none transition-all duration-300 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          opacity: hoveredCard ? 0.6 : 0.3,
        }}
      />

      <div className="relative z-10 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Ultra Modern Header */}
          <div className="text-center mb-16">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 blur-2xl opacity-30 scale-110"></div>
              <div className="relative flex items-center justify-center gap-6">
                <div className="relative">
                  <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-2xl animate-bounce" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-spin">
                    <Zap className="w-5 h-5 text-slate-900" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-yellow-400/30 blur-md rounded-full"></div>
                </div>
              </div>
            </div>

            <h1 className="text-7xl lg:text-8xl font-black bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent mb-6 tracking-tight">
              HALL OF FAME
            </h1>
            <p className="text-2xl text-slate-300 mb-4 font-light">
              Elite Strike Champions
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Eye className="w-5 h-5" />
              <span className="text-lg">
                {stats.onlineNow.toLocaleString()} watching live
              </span>
            </div>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: Users,
                label: 'Total Players',
                value: stats.totalPlayers.toLocaleString(),
                color: 'blue',
                trend: '+12%',
              },
              {
                icon: Zap,
                label: 'Avg. Strikes',
                value: stats.averageStrikes.toLocaleString(),
                color: 'yellow',
                trend: '+8%',
              },
              {
                icon: Crown,
                label: 'Champion',
                value: stats.topStriker,
                color: 'purple',
                trend: 'Unbeaten',
              },
              {
                icon: Flame,
                label: 'Online Now',
                value: stats.onlineNow.toLocaleString(),
                color: 'green',
                trend: 'Live',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-slate-800/60 via-slate-700/40 to-slate-600/20 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <Icon className={`w-8 h-8 text-${stat.color}-400`} />
                      <span
                        className={`text-xs px-2 py-1 bg-${stat.color}-500/20 text-${stat.color}-300 rounded-full font-medium`}
                      >
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-2">
                      {stat.label}
                    </p>
                    <p className="text-2xl lg:text-3xl font-bold text-white truncate">
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ultra Modern Period Selection */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {periods.map((period, index) => {
              const Icon = period.icon;
              const isActive = selectedPeriod === period.key;

              return (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`group relative flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 font-semibold text-lg overflow-hidden ${
                    isActive
                      ? `bg-gradient-to-r ${period.gradient} text-white shadow-2xl scale-105`
                      : 'bg-slate-800/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 hover:scale-105 hover:text-white backdrop-blur-xl'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                  )}
                  <Icon
                    className={`w-6 h-6 relative z-10 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  />
                  <span className="relative z-10">{period.label}</span>
                  {isActive && (
                    <Sparkles className="w-5 h-5 text-white/80 animate-spin relative z-10" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Revolutionary Leaderboard Cards */}
          <div className="space-y-6">
            {leaderboardData.map((player, index) => {
              const isAnimated = animatedItems.has(index);
              const styles = getRankStyle(player.rank, player.isCurrentUser);
              const isHovered = hoveredCard === player.id;

              return (
                <div
                  key={player.id}
                  className={`relative group transition-all duration-700 ${
                    isAnimated
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-12 scale-95'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredCard(player.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    className={`
                    relative overflow-hidden rounded-3xl border backdrop-blur-2xl p-8
                    transition-all duration-500 hover:scale-[1.02] cursor-pointer
                    ${styles.card}
                    ${isHovered ? `hover:shadow-3xl ${styles.glow}` : ''}
                  `}
                  >
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                      {player.rank <= 3 && (
                        <div className="absolute top-4 right-4 text-6xl opacity-20 animate-pulse">
                          {player.rank === 1
                            ? '👑'
                            : player.rank === 2
                            ? '🥈'
                            : '🥉'}
                        </div>
                      )}
                    </div>

                    {/* Modern Rank Badge */}
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                      <div
                        className={`
                        relative w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl
                        ${
                          player.rank <= 3
                            ? 'bg-gradient-to-br from-yellow-400/30 to-amber-500/30 text-yellow-300 border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/25'
                            : 'bg-gradient-to-br from-slate-700/50 to-slate-600/30 text-slate-300 border-2 border-slate-600/50'
                        }
                        ${isHovered ? 'scale-110 rotate-3' : ''}
                        transition-all duration-300
                      `}
                      >
                        #{player.rank}
                        {player.rank <= 3 && (
                          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400/20 to-transparent rounded-2xl blur animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {getRankIcon(player.rank)}
                        {getRankChangeIcon(player.rankChange)}
                      </div>
                    </div>

                    {/* Player Avatar and Info */}
                    <div className="flex items-center gap-8 ml-24">
                      <div className="relative group/avatar">
                        <div
                          className={`absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-50 ${
                            isHovered ? 'animate-pulse' : ''
                          }`}
                        ></div>
                        <img
                          src={player.avatar}
                          alt={player.username}
                          className={`relative w-20 h-20 rounded-full border-4 border-slate-600/50 group-hover/avatar:border-purple-400/80 transition-all duration-300 ${
                            isHovered ? 'scale-110' : ''
                          }`}
                        />
                        <div className="absolute -bottom-1 -right-1 text-2xl">
                          {player.country}
                        </div>
                        {player.isCurrentUser && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-bounce">
                            <Star className="w-5 h-5 text-white" />
                          </div>
                        )}
                        {player.lastSeen === 'Online' && (
                          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-slate-800 animate-pulse"></div>
                        )}
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-4">
                          <h3 className="text-2xl lg:text-3xl font-bold text-white">
                            {player.displayName}
                          </h3>
                          {player.isCurrentUser && (
                            <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 text-sm font-bold rounded-full border border-blue-400/30 animate-pulse">
                              YOU
                            </span>
                          )}
                          <div className="flex gap-1">
                            {player.badges.map((badge, i) => (
                              <span
                                key={i}
                                className="text-lg animate-bounce"
                                style={{ animationDelay: `${i * 200}ms` }}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>

                        <p className="text-lg text-slate-300 font-medium">
                          {player.title}
                        </p>

                        <div className="flex items-center gap-6 text-slate-400">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-purple-400" />
                            <span className="font-medium">
                              Level {player.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-green-400" />
                            <span className="font-medium">
                              {player.winRate}% Win Rate
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-400" />
                            <span className="font-medium">
                              {player.streak} streak
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-blue-400" />
                            <span className="font-medium">
                              {player.powerLevel} Power
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-500">
                          Last seen: {player.lastSeen}
                        </p>
                      </div>

                      {/* Strike Count - Ultra Modern */}
                      <div className="text-right space-y-2">
                        <div
                          className={`flex items-center justify-end gap-3 ${
                            isHovered ? 'scale-110' : ''
                          } transition-transform duration-300`}
                        >
                          <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
                          <div className="text-right">
                            <div className="text-4xl lg:text-5xl font-black text-white">
                              {player.totalStrikes.toLocaleString()}
                            </div>
                            <p className="text-lg text-yellow-300 font-semibold">
                              STRIKES
                            </p>
                          </div>
                        </div>

                        {/* Power Level Bar */}
                        <div className="w-32 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${(player.powerLevel / 10000) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    {isHovered && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modern Load More */}
          <div className="text-center mt-16">
            <button className="group relative px-12 py-6 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 border border-slate-600/50 hover:border-slate-500/70 hover:scale-105 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-3">
                <ArrowUp className="w-6 h-6 group-hover:animate-bounce" />
                Load More Champions
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
