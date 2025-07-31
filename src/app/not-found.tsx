// app/not-found.tsx - Simple 404 page
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NotFound() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating 404 elements */}
        {['🔍', '❓', '💫', '🌟', '🎯', '🚀', '⭐'].map((icon, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(i) * 40, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'easeInOut',
            }}
            className="absolute text-4xl text-blue-300"
            style={{
              left: `${15 + i * 12}%`,
              top: `${10 + i * 15}%`,
            }}
          >
            {icon}
          </motion.div>
        ))}

        {/* Gradient orbs */}
        <div className="absolute -top-4 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000"></div>
        <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Main Content Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl">
            {/* Animated 404 Icon */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="text-8xl md:text-9xl mb-6"
            >
              🔍
            </motion.div>

            {/* 404 Error Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <span className="text-6xl md:text-8xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                404
              </span>
            </motion.div>

            {/* Main Message */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Oops! Page Not Found
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-lg text-white/80 mb-8 leading-relaxed"
            >
              The page you're looking for doesn't exist. It might have been
              moved, deleted, or you entered the wrong URL.
            </motion.p>

            {/* URL Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white/5 rounded-2xl p-4 mb-8 border border-white/10"
            >
              <div className="text-white/60 text-sm mb-2">
                You tried to visit:
              </div>
              <div className="text-white font-mono text-sm break-all bg-black/20 rounded-lg p-3">
                {pathname}
              </div>
            </motion.div>

            {/* Helpful Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="text-left mb-8"
            >
              <h3 className="text-white font-semibold mb-4 text-center">
                💡 What you can try:
              </h3>
              <ul className="space-y-2 text-white/70 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Check the URL for typos
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Go back to the previous page
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Visit our homepage and navigate from there
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Use the search function if available
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link
                href="/"
                className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                <span className="text-xl">🏠</span>
                <span>Go to Homepage</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="group relative inline-flex items-center gap-3 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105"
              >
                <span className="text-xl">↩️</span>
                <span>Go Back</span>
              </button>
            </motion.div>

            {/* Popular Pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-8 pt-6 border-t border-white/10"
            >
              <h4 className="text-white/80 text-sm mb-4">🔥 Popular pages:</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Packs', href: '/packs' },
                  { label: 'Collection', href: '/collection' },
                  { label: 'Buy Gems', href: '/buy-gems' },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded-lg hover:bg-white/5 transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.7, duration: 0.5 }}
            className="mt-8 flex justify-center gap-4"
          >
            {['🎮', '🎯', '⭐'].map((icon, i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="text-2xl opacity-60"
              >
                {icon}
              </motion.div>
            ))}
          </motion.div>

          {/* Fun message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-6 text-white/50 text-sm"
          >
            Lost in the digital world? Don't worry, every trainer gets lost
            sometimes! 🗺️
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
