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
  Loader,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function HallOfFamePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [animatedItems, setAnimatedItems] = useState(new Set());
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const containerRef = useRef(null);

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

  // Helper functions to transform API data into UI format
  const generateDisplayName = (playerId) => {
    const names = [
      'Strike Master',
      'Thunder Bolt',
      'Electric Ace',
      'Pika Destroyer',
      'Zap King',
      'Lightning Lord',
      'Storm Sage',
      'Volt Warrior',
      'Thunder Champion',
      'Electric Legend',
    ];
    const hash = playerId.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return names[Math.abs(hash) % names.length];
  };

  const generateTitle = (winStreak, totalWins) => {
    if (winStreak >= 20) return '⚡ Lightning Legend';
    if (winStreak >= 15) return '👑 Thunder Champion';
    if (winStreak >= 10) return '⛈️ Storm Master';
    if (winStreak >= 7) return '🔥 Fire Striker';
    if (winStreak >= 5) return '🎯 Strike Specialist';
    if (totalWins >= 100) return '🏆 Battle Veteran';
    if (totalWins >= 50) return '⭐ Rising Champion';
    if (totalWins >= 20) return '🌟 Skilled Trainer';
    return '🎮 Card Battler';
  };

  const generateAvatar = (playerId, existingAvatar) => {
    if (existingAvatar) return existingAvatar;
    const colors = [
      '1e40af',
      '7c3aed',
      'ea580c',
      'dc2626',
      '059669',
      '2563eb',
      'be185d',
      '0891b2',
    ];
    const colorIndex =
      Math.abs(playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) %
      colors.length;
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerId}&backgroundColor=${colors[colorIndex]}`;
  };

  const generateBadges = (winStreak, winRate, totalWins) => {
    const badges = [];
    if (winStreak >= 15) badges.push('🔥');
    if (winStreak >= 10) badges.push('⚡');
    if (winRate >= 90) badges.push('🎯');
    if (winRate >= 80) badges.push('👑');
    if (totalWins >= 100) badges.push('🏆');
    if (totalWins >= 50) badges.push('⭐');

    // Ensure at least 2 badges
    if (badges.length === 0) badges.push('🎮', '🌟');
    if (badges.length === 1) badges.push('💪');

    return badges.slice(0, 3); // Max 3 badges
  };

  const calculateLevel = (totalWins) => {
    return Math.floor(totalWins / 3) + 1; // Level up every 3 wins
  };

  const calculatePowerLevel = (winStreak, winRate, totalWins) => {
    return Math.floor(winStreak * 50 + winRate * 30 + totalWins * 20);
  };

  const getCountryFlag = (playerId) => {
    const flags = ['🇺🇸', '🇯🇵', '🇰🇷', '🇬🇧', '🇩🇪', '🇫🇷', '🇨🇦', '🇦🇺', '🇲🇾', '🇸🇬'];
    const index =
      Math.abs(playerId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) %
      flags.length;
    return flags[index];
  };

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 5) return 'Online';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Fetch leaderboard data from API
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leaderboard?period=${selectedPeriod}`);
      const result = await response.json();

      if (result.success) {
        // Transform API data to match UI expectations
        const transformedData = result.data.map((player) => ({
          id: player.playerId,
          rank: player.rank,
          username: player.username || player.playerId.slice(0, 12) + '...',
          displayName: player.username || generateDisplayName(player.playerId),
          avatar: generateAvatar(player.playerId, player.avatar),
          totalStrikes: player.totalWins,
          winRate: player.winRate,
          level: calculateLevel(player.totalWins),
          title: generateTitle(player.winStreak, player.totalWins),
          isCurrentUser: player.playerId === currentUserId,
          country: getCountryFlag(player.playerId),
          streak: player.winStreak,
          rankChange: 0, // You can implement rank change tracking later
          lastSeen: formatLastSeen(player.lastPlayed),
          badges: generateBadges(
            player.winStreak,
            player.winRate,
            player.totalWins
          ),
          powerLevel: calculatePowerLevel(
            player.winStreak,
            player.winRate,
            player.totalWins
          ),
          totalGames: player.totalGames,
          gems: player.gems, // Added gems from your schema
        }));

        setLeaderboardData(transformedData);
        setStats({
          totalPlayers: result.stats.totalPlayers,
          averageStrikes:
            Math.floor(
              result.data.reduce((acc, p) => acc + p.totalWins, 0) /
                result.data.length
            ) || 0,
          topStriker: result.stats.topStriker || 'No Champion',
          onlineNow: Math.floor(Math.random() * 50) + 25,
          totalRegisteredUsers: result.stats.totalRegisteredUsers,
          totalGames: result.stats.totalGames,
          averageStreak: result.stats.averageStreak || 0,
          dateRange: result.stats.dateRange,
          period: result.period,
          gamesInPeriod: result.stats.gamesInPeriod,
        });
      } else {
        setError(result.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // TODO: Get current user ID from your auth context/session
    // setCurrentUserId(getCurrentUserId());
    fetchLeaderboard();
  }, [selectedPeriod]);

  useEffect(() => {
    if (!loading && leaderboardData.length > 0) {
      setAnimatedItems(new Set()); // Reset animations
      const timer = setInterval(() => {
        setAnimatedItems((prev) => {
          const newSet = new Set(prev);
          if (newSet.size < leaderboardData.length) {
            newSet.add(newSet.size);
          }
          return newSet;
        });
      }, 150);

      return () => clearInterval(timer);
    }
  }, [leaderboardData, loading]);

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

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-yellow-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Loading Champions...
          </h2>
          <p className="text-slate-400">Calculating win streaks and rankings</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty State
  if (!loading && leaderboardData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            No Champions Yet
          </h2>
          <p className="text-slate-400">
            Be the first to win a game and claim your spot!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden">
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
          {/* Header with Refresh Button */}
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
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Eye className="w-5 h-5" />
                <span className="text-lg">
                  {stats.totalGames?.toLocaleString() || 0} games played
                  {stats.dateRange && stats.dateRange !== 'All Time' && (
                    <span className="text-sm text-slate-500 ml-1">
                      ({stats.dateRange})
                    </span>
                  )}
                </span>
              </div>
              <button
                onClick={fetchLeaderboard}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 rounded-lg transition-all duration-300 border border-slate-600/50"
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Period Selection */}
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

          {/* Leaderboard Cards */}
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
                    className={`relative overflow-hidden rounded-3xl border backdrop-blur-2xl p-8 transition-all duration-500 hover:scale-[1.02] cursor-pointer ${
                      styles.card
                    } ${isHovered ? `hover:shadow-3xl ${styles.glow}` : ''}`}
                  >
                    {/* Background Pattern */}
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

                    {/* Rank Badge */}
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                      <div
                        className={`relative w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl ${
                          player.rank <= 3
                            ? 'bg-gradient-to-br from-yellow-400/30 to-amber-500/30 text-yellow-300 border-2 border-yellow-400/50 shadow-lg shadow-yellow-400/25'
                            : 'bg-gradient-to-br from-slate-700/50 to-slate-600/30 text-slate-300 border-2 border-slate-600/50'
                        } ${
                          isHovered ? 'scale-110 rotate-3' : ''
                        } transition-all duration-300`}
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

                    {/* Player Info */}
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
                          Last seen: {player.lastSeen} • {player.totalGames}{' '}
                          games played
                          {player.gems && (
                            <span className="block text-xs text-yellow-400 font-semibold">
                              💎 {player.gems} gems
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Win Count */}
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
                              WINS
                            </p>
                          </div>
                        </div>

                        {/* Power Level Bar */}
                        <div className="w-32 bg-slate-700/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${Math.min(
                                (player.powerLevel / 5000) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    {isHovered && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none animate-pulse"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Button (for future pagination) */}
          <div className="text-center mt-16">
            <button
              onClick={fetchLeaderboard}
              className="group relative px-12 py-6 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 border border-slate-600/50 hover:border-slate-500/70 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center gap-3">
                <RefreshCw className="w-6 h-6 group-hover:animate-spin" />
                Refresh Rankings
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
