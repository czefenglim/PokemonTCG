'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GemSuccessNotificationProps {
  isVisible: boolean;
  userGems?: number | null;
  purchasedAmount?: number | null;
  onClose?: () => void;
}

export const GemSuccessNotification: React.FC<GemSuccessNotificationProps> = ({
  isVisible,
  userGems,
  purchasedAmount,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
            duration: 0.6,
          }}
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          {/* Main notification container */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-green-400/30 rounded-3xl p-6 shadow-2xl">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                  className="absolute text-yellow-300"
                  style={{
                    left: `${20 + (i % 3) * 30}%`,
                    top: `${20 + Math.floor(i / 3) * 25}%`,
                    fontSize: `${12 + (i % 3) * 4}px`,
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </div>

            {/* Success content */}
            <div className="relative z-10 text-center">
              {/* Animated check mark and gems */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white text-2xl font-bold"
                  >
                    ✓
                  </motion.span>
                </motion.div>

                {/* Bouncing gems */}
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: 0.7 + i * 0.2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                    className="text-3xl"
                  >
                    💎
                  </motion.span>
                ))}
              </div>

              {/* Success message */}
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-white mb-2"
              >
                Payment Successful! 🎉
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-green-300 font-semibold mb-4"
              >
                Your gems have been added to your account
              </motion.p>

              {/* Gem counter animation - Shows purchased amount prominently */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: 'spring' }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-4"
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="text-3xl"
                    >
                      💎
                    </motion.span>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-300">
                        You received:
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.8,
                          type: 'spring',
                          stiffness: 300,
                        }}
                        className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent"
                      >
                        +
                        {purchasedAmount
                          ? purchasedAmount.toLocaleString()
                          : '...'}{' '}
                        gems
                      </motion.div>
                    </div>
                  </div>

                  {/* Show new total balance as secondary info */}
                  <div className="text-sm text-white/70 border-t border-white/10 pt-3">
                    New Balance:
                    <span className="ml-1 font-semibold text-white">
                      {userGems !== null ? userGems.toLocaleString() : '...'}{' '}
                      gems
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Optional close button */}
              {onClose && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-white/60 hover:text-white text-sm transition-colors duration-200"
                >
                  Dismiss
                </motion.button>
              )}
            </div>

            {/* Glowing border effect */}
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-emerald-400/20 to-teal-400/20 rounded-3xl blur-sm"
            />
          </div>

          {/* Floating celebration particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: [0, (Math.random() - 0.5) * 200],
                  y: [0, -100 - Math.random() * 100],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: 1 + i * 0.1,
                  ease: 'easeOut',
                }}
                className="absolute left-1/2 top-1/2 text-lg"
                style={{
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {['✨', '💎', '🎉', '⭐'][i % 4]}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
