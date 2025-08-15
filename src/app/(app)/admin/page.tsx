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
} from '@/lib/admin/navigation/admin-navigation';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Activity,
  Zap,
} from 'lucide-react';

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

// Enhanced Line Chart with matching theme
function RechartsLineChart({ data }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.1)"
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              color: '#f8fafc',
              backdropFilter: 'blur(12px)',
            }}
            formatter={(value) => [`${value}`, 'Revenue']}
            labelFormatter={(label) => `Day ${label}`}
          />
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#6366f1" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{
              r: 6,
              fill: '#60a5fa',
              stroke: '#3b82f6',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Enhanced Bar Chart with matching theme
function RechartsBarChart({ data }) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(148, 163, 184, 0.1)"
          />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'rgba(148, 163, 184, 0.8)', fontSize: 12 }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '12px',
              color: '#f8fafc',
              backdropFilter: 'blur(12px)',
            }}
            formatter={(value) => [`${value}`, 'Revenue']}
            labelFormatter={(label) => `Day ${label}`}
          />
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <Bar
            dataKey="revenue"
            fill="url(#barGradient)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [hoveredCard, setHoveredCard] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [currentTime, setCurrentTime] = useState(new Date());

  const managementTools = getMainManagementTools();
  const quickActions = getQuickActions();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;

    const role = session?.user?.role;
    if (!role) return;

    const allowedRoles = ['ADMIN', 'admin', 'super_admin'];
    if (status === 'unauthenticated' || !role || !allowedRoles.includes(role)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900/95 to-slate-800/95 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-6 border-4 border-blue-400/30 rounded-full border-t-blue-400"
          />
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-slate-200 text-xl font-medium"
          >
            Accessing command center...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {/* Floating geometric shapes */}
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -40, 0],
                x: [0, Math.sin(i) * 30, 0],
                rotate: [0, 180, 360],
                opacity: [0.02, 0.05, 0.02],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 30 + i * 5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute w-16 h-16 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl backdrop-blur-sm"
              style={{
                left: `${15 + ((i * 20) % 70)}%`,
                top: `${10 + ((i * 25) % 80)}%`,
                filter: 'blur(2px)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 p-8">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Analytics & Insights
                </h1>
                <p className="text-slate-300 text-sm">Dashboard Overview</p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-slate-300 text-xs mb-1">Current Time</div>
              <div className="text-white text-sm font-mono">
                {currentTime.toLocaleTimeString('en-US', {
                  hour12: true,
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Compact Statistics Grid */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: 'Total Revenue',
              value: `${mockStats.totalRevenue.toLocaleString()}`,
              subValue: `${mockStats.dailyRevenue} today`,
              icon: '💰',
              color: 'from-emerald-500 to-teal-600',
              change: '+18.2%',
              trend: 'up',
            },
            {
              label: 'Gem Packages',
              value: mockStats.gemsPackagesSold.toLocaleString(),
              subValue: `${mockStats.todayGemSales} today`,
              icon: '💎',
              color: 'from-amber-500 to-orange-600',
              change: '+23.1%',
              trend: 'up',
            },
            {
              label: 'Merchandise',
              value: mockStats.merchandiseSold.toLocaleString(),
              subValue: `${mockStats.todayMerchandiseSales} today`,
              icon: '🛍️',
              color: 'from-pink-500 to-rose-600',
              change: '+15.7%',
              trend: 'up',
            },
            {
              label: 'Conversion Rate',
              value: `${mockStats.conversionRate}%`,
              subValue: 'Monthly average',
              icon: '📈',
              color: 'from-blue-500 to-indigo-600',
              change: '+5.3%',
              trend: 'up',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: index * 0.05,
                type: 'spring',
                stiffness: 120,
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform duration-200`}
                  >
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-emerald-400 text-xs font-bold">
                      {stat.change}
                    </span>
                  </div>
                </div>
                <h3 className="text-slate-300 text-xs font-medium mb-2">
                  {stat.label}
                </h3>
                <p className="text-xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-xs">{stat.subValue}</p>
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Compact Charts Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Revenue Over Time
                </h2>
                <p className="text-slate-300 text-sm">
                  Last 30 days revenue trend
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-slate-800/60 backdrop-blur-xl rounded-xl p-0.5 border border-slate-600/30">
                <button
                  onClick={() => setChartType('line')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chartType === 'line'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <LineChartIcon className="w-3 h-3" />
                  Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    chartType === 'bar'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  Bars
                </button>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl px-8 pt-5 pb-6 border border-slate-600/30 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {new Date().toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Daily revenue performance analysis
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-white mb-0.5">
                  ${revenueData[revenueData.length - 1].revenue}
                </p>
                <div className="flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <p className="text-emerald-400 text-xs font-medium">
                    +18.2% from yesterday
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-xl p-3 backdrop-blur-sm border border-slate-600/20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={chartType}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {chartType === 'line' ? (
                    <RechartsLineChart data={revenueData} />
                  ) : (
                    <RechartsBarChart data={revenueData} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  label: 'Average Daily',
                  value: `${Math.round(
                    revenueData.reduce((sum, d) => sum + d.revenue, 0) /
                      revenueData.length
                  )}`,
                  color: 'text-blue-400',
                },
                {
                  label: 'Highest Day',
                  value: `${Math.max(...revenueData.map((d) => d.revenue))}`,
                  color: 'text-emerald-400',
                },
                {
                  label: 'Total (30 Days)',
                  value: `${revenueData
                    .reduce((sum, d) => sum + d.revenue, 0)
                    .toLocaleString()}`,
                  color: 'text-purple-400',
                },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="text-center p-3 bg-slate-800/50 rounded-xl border border-slate-600/20"
                >
                  <p className="text-slate-400 text-xs mb-1">{item.label}</p>
                  <p className={`text-lg font-bold ${item.color}`}>
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Compact Management Tools */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Management Tools</h2>
              <p className="text-slate-300 text-sm">
                Powerful admin capabilities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
            {managementTools.map((tool, index) => {
              const IconComponent = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 30, rotateX: -10 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 12,
                    delay: index * 0.05,
                  }}
                  whileHover={{ y: -6, rotateX: 3, scale: 1.01 }}
                  onHoverStart={() => setHoveredCard(tool.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="group cursor-pointer h-full"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <Link href={tool.href} className="h-full block">
                    <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-500 overflow-hidden shadow-lg h-full flex flex-col">
                      {' '}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-8 transition-opacity duration-500`}
                      ></div>
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-3">
                          <motion.div
                            animate={
                              hoveredCard === tool.id
                                ? {
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.05, 1],
                                  }
                                : {}
                            }
                            transition={{ duration: 0.6 }}
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-md`}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors duration-300 mb-1">
                              {tool.title}
                            </h3>
                            <p className="text-slate-300 text-xs leading-relaxed">
                              {tool.description}
                            </p>
                          </div>
                        </div>

                        {tool.features && (
                          <div className="grid grid-cols-2 gap-2 mb-3 flex-1">
                            {tool.features.map((feature, i) => (
                              <motion.div
                                key={feature}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex items-center gap-1.5 text-slate-400 text-xs"
                              >
                                <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                                {feature}
                              </motion.div>
                            ))}
                          </div>
                        )}

                        <motion.div
                          animate={{
                            x: hoveredCard === tool.id ? [0, 6, 0] : 0,
                          }}
                          transition={{
                            duration: 1,
                            repeat: hoveredCard === tool.id ? Infinity : 0,
                          }}
                          className="flex items-center justify-end mt-auto"
                        >
                          <div className="bg-slate-700/50 group-hover:bg-slate-600/50 rounded-xl p-2 transition-all duration-300 border border-slate-600/20">
                            <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
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

        {/* Compact Quick Actions */}
        {quickActions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Quick Actions</h2>
                <p className="text-slate-300 text-sm">Streamlined shortcuts</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + index * 0.05 }}
                    whileHover={{ scale: 1.03, y: -3 }}
                  >
                    <Link href={action.href}>
                      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-xl p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 shadow-lg">
                        <div
                          className={`w-8 h-8 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-3 shadow-md`}
                        >
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="text-sm font-semibold text-white mb-1">
                          {action.title}
                        </h3>
                        <p className="text-slate-300 text-xs">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
