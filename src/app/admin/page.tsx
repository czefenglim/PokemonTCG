'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Mock data - replace with real API calls
const mockStats = {
  totalUsers: 1247,
  totalRevenue: 8543.5,
  gemsPackagesSold: 324,
  activeUsers: 892,
  todayRegistrations: 23,
  todayRevenue: 156.78,
};

const quickActions = [
  {
    title: 'Manage Gem Packages',
    description: 'Create, edit, and manage gem packages',
    icon: '💎',
    href: '/admin/gem-packages',
    color: 'from-yellow-500 to-orange-500',
    glow: 'shadow-yellow-500/25',
  },
  {
    title: 'User Management',
    description: 'View and manage user accounts',
    icon: '👥',
    href: '/admin/users',
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/25',
  },
  {
    title: 'Analytics Dashboard',
    description: 'View sales and usage analytics',
    icon: '📊',
    href: '/admin/analytics',
    color: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/25',
  },
  {
    title: 'Card Packs Management',
    description: 'Manage card packs and rarities',
    icon: '📦',
    href: '/admin/packs',
    color: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/25',
  },
  {
    title: 'Platform Settings',
    description: 'Configure platform-wide settings',
    icon: '⚙️',
    href: '/admin/settings',
    color: 'from-red-500 to-pink-500',
    glow: 'shadow-red-500/25',
  },
  {
    title: 'Support Center',
    description: 'Handle customer support requests',
    icon: '🎧',
    href: '/admin/support',
    color: 'from-indigo-500 to-purple-500',
    glow: 'shadow-indigo-500/25',
  },
];

const recentActivities = [
  {
    type: 'user',
    message: 'New user registered: trainer_mike@example.com',
    time: '2 minutes ago',
    icon: '👤',
  },
  {
    type: 'purchase',
    message: 'Gem package purchased: 1000 gems for $7.00',
    time: '5 minutes ago',
    icon: '💰',
  },
  {
    type: 'admin',
    message: 'Gem package "Best Value" updated',
    time: '15 minutes ago',
    icon: '✏️',
  },
  {
    type: 'system',
    message: 'Daily backup completed successfully',
    time: '1 hour ago',
    icon: '💾',
  },
  {
    type: 'user',
    message: 'User reported: Possible duplicate account',
    time: '2 hours ago',
    icon: '🚨',
  },
];

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    console.log('Session:', session);
    if (status === 'loading') return;

    const role = session?.user?.role;
    if (!role) return; // Still waiting for session to populate fully

    const allowedRoles = ['ADMIN', 'admin', 'super_admin'];

    if (status === 'unauthenticated' || !role || !allowedRoles.includes(role)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-300 rounded-full animate-spin border-t-transparent"></div>
          <p className="text-white text-xl">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Floating Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {['👑', '⚡', '🛡️', '🎯', '🚀'].map((icon, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(i) * 20, 0],
                rotate: [0, 180, 360],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 15 + i * 3,
                repeat: Infinity,
                delay: i * 2,
                ease: 'easeInOut',
              }}
              className="absolute text-4xl text-purple-300"
              style={{ left: `${20 + i * 15}%`, top: `${10 + i * 20}%` }}
            >
              {icon}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 backdrop-blur-md bg-white/5"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-4xl"
              >
                👑
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-white/60">
                  Welcome back, {session?.user?.name || session?.user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to sign out?')) {
                  signOut({ callbackUrl: '/' });
                }
              }}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 px-4 py-2 rounded-xl border border-red-500/30 transition-all duration-300"
            >
              Sign Out
            </button>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {[
              {
                label: 'Total Users',
                value: mockStats.totalUsers.toLocaleString(),
                icon: '👥',
                color: 'from-blue-500 to-cyan-500',
                change: '+12%',
              },
              {
                label: 'Total Revenue',
                value: `$${mockStats.totalRevenue.toLocaleString()}`,
                icon: '💰',
                color: 'from-green-500 to-emerald-500',
                change: '+8%',
              },
              {
                label: 'Packages Sold',
                value: mockStats.gemsPackagesSold.toLocaleString(),
                icon: '💎',
                color: 'from-yellow-500 to-orange-500',
                change: '+23%',
              },
              {
                label: 'Active Users',
                value: mockStats.activeUsers.toLocaleString(),
                icon: '⚡',
                color: 'from-purple-500 to-pink-500',
                change: '+5%',
              },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icon}
                  </div>
                  <span className="text-green-400 text-sm font-medium">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-white/70 text-sm font-medium mb-1">
                  {stat.label}
                </h3>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </motion.section>

          {/* Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onHoverStart={() => setHoveredCard(action.title)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="group cursor-pointer"
                >
                  <Link href={action.href}>
                    <div
                      className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-500 overflow-hidden ${
                        hoveredCard === action.title
                          ? `${action.glow} shadow-2xl`
                          : 'shadow-xl'
                      }`}
                    >
                      {/* Gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                      ></div>

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                          <motion.div
                            animate={
                              hoveredCard === action.title
                                ? {
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.1, 1],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.5 }}
                            className="text-4xl"
                          >
                            {action.icon}
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-yellow-300 transition-colors">
                              {action.title}
                            </h3>
                          </div>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">
                          {action.description}
                        </p>

                        {/* Arrow indicator */}
                        <motion.div
                          animate={{
                            x: hoveredCard === action.title ? [0, 5, 0] : 0,
                          }}
                          transition={{
                            duration: 1,
                            repeat: hoveredCard === action.title ? Infinity : 0,
                          }}
                          className="flex items-center justify-end mt-4"
                        >
                          <span className="text-white/60 group-hover:text-white transition-colors">
                            →
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Recent Activity & Today's Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">📈</span>
                Recent Activity
              </h3>

              <div className="space-y-4">
                <AnimatePresence>
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 + index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <span className="text-2xl">{activity.icon}</span>
                      <div className="flex-1">
                        <p className="text-white/90 text-sm">
                          {activity.message}
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Link
                href="/admin/activity"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium mt-4 transition-colors"
              >
                View all activity →
              </Link>
            </motion.section>

            {/* Today's Summary */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl">📊</span>
                Today's Summary
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      👤
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        New Registrations
                      </p>
                      <p className="text-white/60 text-sm">
                        Users who joined today
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {mockStats.todayRegistrations}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      💰
                    </div>
                    <div>
                      <p className="text-white font-medium">Today's Revenue</p>
                      <p className="text-white/60 text-sm">
                        Total earnings today
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    ${mockStats.todayRevenue}
                  </span>
                </div>

                <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🎯</span>
                    <span className="font-medium text-yellow-300">
                      Daily Goal Progress
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '73%' }}
                      transition={{ delay: 1.5, duration: 1 }}
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
                    ></motion.div>
                  </div>
                  <p className="text-white/70 text-sm mt-2">
                    73% of daily revenue goal achieved
                  </p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
