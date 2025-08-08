'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getMainManagementTools,
  getQuickActions,
} from '@/lib/admin-navigation';

// Mock data - replace with real API calls
const mockStats = {
  totalRevenue: 28543.5,
  gemsPackagesSold: 324,
  merchandiseSold: 158,
  conversionRate: 12.5,
  dailyRevenue: 456.78,
  todayGemSales: 23,
  todayMerchandiseSales: 8,
};

// Revenue chart data for the past 30 days
const revenueData = [
  { day: '1', revenue: 320 },
  { day: '2', revenue: 280 },
  { day: '3', revenue: 410 },
  { day: '4', revenue: 390 },
  { day: '5', revenue: 450 },
  { day: '6', revenue: 380 },
  { day: '7', revenue: 520 },
  { day: '8', revenue: 490 },
  { day: '9', revenue: 580 },
  { day: '10', revenue: 460 },
  { day: '11', revenue: 620 },
  { day: '12', revenue: 550 },
  { day: '13', revenue: 680 },
  { day: '14', revenue: 590 },
  { day: '15', revenue: 720 },
  { day: '16', revenue: 650 },
  { day: '17', revenue: 780 },
  { day: '18', revenue: 690 },
  { day: '19', revenue: 820 },
  { day: '20', revenue: 750 },
  { day: '21', revenue: 890 },
  { day: '22', revenue: 810 },
  { day: '23', revenue: 920 },
  { day: '24', revenue: 860 },
  { day: '25', revenue: 980 },
  { day: '26', revenue: 920 },
  { day: '27', revenue: 1050 },
  { day: '28', revenue: 980 },
  { day: '29', revenue: 1120 },
  { day: '30', revenue: 1180 },
];

// Professional Line Chart using Recharts
function RechartsLineChart({ data }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {/* Chart Grid */}
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

          {/* X-Axis Configuration */}
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />

          {/* Y-Axis Configuration */}
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />

          {/* Tooltip Configuration */}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
            }}
            formatter={(value) => [`${value}`, 'Revenue']}
            labelFormatter={(label) => `Day ${label}`}
          />

          {/* Gradient Definition */}
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
            </linearGradient>
          </defs>

          {/* Line Chart */}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="url(#colorRevenue)"
            strokeWidth={3}
            dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#f472b6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Professional Bar Chart using Recharts
function RechartsBarChart({ data }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {/* Chart Grid */}
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />

          {/* X-Axis Configuration */}
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
          />

          {/* Y-Axis Configuration */}
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />

          {/* Tooltip Configuration */}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
            }}
            formatter={(value) => [`${value}`, 'Revenue']}
            labelFormatter={(label) => `Day ${label}`}
          />

          {/* Gradient Definition for Bars */}
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={1} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={1} />
            </linearGradient>
          </defs>

          {/* Bar Chart */}
          <Bar
            dataKey="revenue"
            fill="url(#barGradient)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminPage() {
  // Authentication and routing hooks
  const { data: session, status } = useSession();
  const router = useRouter();

  // Component state management
  const [hoveredCard, setHoveredCard] = useState(null);
  const [chartType, setChartType] = useState('line');

  // Get navigation items from shared configuration
  const managementTools = getMainManagementTools();
  const quickActions = getQuickActions();

  // Authentication check and role verification
  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load

    const role = session?.user?.role;
    if (!role) return;

    const allowedRoles = ['ADMIN', 'admin', 'super_admin'];
    if (status === 'unauthenticated' || !role || !allowedRoles.includes(role)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  // Loading state display
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          {/* Animated loading spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 border-4 border-purple-300 rounded-full border-t-transparent"
          />
          <p className="text-white text-xl">Accessing command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Floating Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {['💎', '🛍️', '📊', '💰', '⚡', '🎯'].map((icon, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.sin(i) * 30, 0],
                rotate: [0, 360],
                opacity: [0.05, 0.15, 0.05],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 20 + i * 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute text-5xl text-purple-300/50"
              style={{
                left: `${15 + ((i * 15) % 70)}%`,
                top: `${10 + ((i * 20) % 80)}%`,
                filter: 'blur(1px)',
              }}
            >
              {icon}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-6">
        {/* Analytics & Insights Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white flex items-center gap-4">
            <motion.span
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="text-3xl"
            >
              📊
            </motion.span>
            Analytics & Insights
          </h2>
        </motion.div>

        {/* Top 4 Statistics Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {[
            {
              label: 'Total Revenue',
              value: `${mockStats.totalRevenue.toLocaleString()}`,
              subValue: `${mockStats.dailyRevenue} today`,
              icon: '💰',
              color: 'from-green-500 via-emerald-500 to-teal-500',
              change: '+18.2%',
            },
            {
              label: 'Gem Packages',
              value: mockStats.gemsPackagesSold.toLocaleString(),
              subValue: `${mockStats.todayGemSales} today`,
              icon: '💎',
              color: 'from-yellow-500 via-orange-500 to-red-500',
              change: '+23.1%',
            },
            {
              label: 'Merchandise',
              value: mockStats.merchandiseSold.toLocaleString(),
              subValue: `${mockStats.todayMerchandiseSales} today`,
              icon: '🛍️',
              color: 'from-purple-500 via-pink-500 to-rose-500',
              change: '+15.7%',
            },
            {
              label: 'Conversion Rate',
              value: `${mockStats.conversionRate}%`,
              subValue: 'Monthly average',
              icon: '📈',
              color: 'from-blue-500 via-cyan-500 to-indigo-500',
              change: '+5.3%',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-500">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.icon}
                  </div>
                  <span className="text-green-400 text-sm font-bold">
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-white/70 text-sm font-medium mb-2">
                  {stat.label}
                </h3>
                <p className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-white/50 text-xs">{stat.subValue}</p>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Charts Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          {/* Chart Controls Header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <motion.span
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="text-3xl"
              >
                📈
              </motion.span>
              Revenue Over Time
            </h3>
            <div className="flex items-center gap-4">
              <div className="text-white/60 text-sm">
                Last 30 days revenue trend
              </div>
              {/* Chart Type Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    chartType === 'line'
                      ? 'bg-blue-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  📈 Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    chartType === 'bar'
                      ? 'bg-blue-500 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  📊 Bars
                </button>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20"
          >
            {/* Chart Header with Current Month and Stats */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {new Date().toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <p className="text-white/60">
                  Daily revenue performance for the past 30 days
                </p>
              </div>
              {/* Current Revenue Display */}
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  ${revenueData[revenueData.length - 1].revenue}
                </p>
                <p className="text-green-400 text-sm font-medium">
                  +18.2% from yesterday
                </p>
              </div>
            </div>

            {/* Chart Display Area */}
            <div className="bg-white/5 rounded-2xl p-6">
              {chartType === 'line' ? (
                <RechartsLineChart data={revenueData} />
              ) : (
                <RechartsBarChart data={revenueData} />
              )}
            </div>

            {/* Chart Summary Statistics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Daily Revenue */}
              <div className="text-center">
                <p className="text-white/60 text-sm mb-1">Average Daily</p>
                <p className="text-2xl font-bold text-white">
                  $
                  {Math.round(
                    revenueData.reduce((sum, d) => sum + d.revenue, 0) /
                      revenueData.length
                  )}
                </p>
              </div>
              {/* Highest Revenue Day */}
              <div className="text-center">
                <p className="text-white/60 text-sm mb-1">Highest Day</p>
                <p className="text-2xl font-bold text-green-400">
                  ${Math.max(...revenueData.map((d) => d.revenue))}
                </p>
              </div>
              {/* Total 30-Day Revenue */}
              <div className="text-center">
                <p className="text-white/60 text-sm mb-1">Total (30 Days)</p>
                <p className="text-2xl font-bold text-blue-400">
                  $
                  {revenueData
                    .reduce((sum, d) => sum + d.revenue, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Management Tools */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-4">
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="text-4xl"
              >
                ⚡
              </motion.span>
              Management Tools
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {managementTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 30, rotateX: -15 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 250,
                    damping: 15,
                    delay: index * 0.1,
                  }}
                  whileHover={{ y: -12, rotateX: 5, scale: 1.02 }}
                  onHoverStart={() => setHoveredCard(tool.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="group cursor-pointer"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <Link href={tool.href}>
                    <div
                      className={`relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-white/40 transition-all duration-700 overflow-hidden shadow-2xl ${
                        hoveredCard === tool.id ? 'shadow-3xl' : ''
                      }`}
                    >
                      {/* Gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-15 transition-opacity duration-700`}
                      ></div>

                      {/* Animated particles */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={
                              hoveredCard === tool.id
                                ? {
                                    y: [0, -100],
                                    x: [0, Math.random() * 50 - 25],
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1, 0.5],
                                  }
                                : {}
                            }
                            transition={{
                              duration: 2,
                              repeat: hoveredCard === tool.id ? Infinity : 0,
                            }}
                            className="absolute w-2 h-2 bg-white rounded-full"
                            style={{
                              left: `${20 + i * 12}%`,
                              bottom: '10px',
                            }}
                          />
                        ))}
                      </div>

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center gap-6 mb-6">
                          <motion.div
                            animate={
                              hoveredCard === tool.id
                                ? {
                                    rotate: [0, 15, -15, 0],
                                    scale: [1, 1.2, 1],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.8 }}
                            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}
                          >
                            <IconComponent className="w-8 h-8 text-white" />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-white group-hover:text-yellow-300 transition-colors duration-300 mb-2">
                              {tool.title}
                            </h3>
                            <p className="text-white/70 text-sm leading-relaxed">
                              {tool.description}
                            </p>
                          </div>
                        </div>

                        {/* Feature list */}
                        {tool.features && (
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {tool.features.map((feature, i) => (
                              <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-2 text-white/60 text-sm"
                              >
                                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
                                {feature}
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Arrow indicator */}
                        <motion.div
                          animate={{
                            x: hoveredCard === tool.id ? [0, 10, 0] : 0,
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: hoveredCard === tool.id ? Infinity : 0,
                          }}
                          className="flex items-center justify-end"
                        >
                          <div className="bg-white/10 group-hover:bg-white/20 rounded-full p-3 transition-all duration-300">
                            <span className="text-white/60 group-hover:text-white transition-colors text-xl">
                              →
                            </span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">⚡</span>
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <Link key={action.id} href={action.href}>
                    <motion.div
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {action.title}
                      </h3>
                      <p className="text-white/70 text-sm">
                        {action.description}
                      </p>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
