'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle, X, Zap, Shield, Crown } from 'lucide-react';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmLogoutModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmLogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [particles, setParticles] = useState([]);

  /**
   * Generate floating particles for epic effect
   */
  useEffect(() => {
    if (isOpen) {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 2,
      }));
      setParticles(newParticles);
    }
  }, [isOpen]);

  /**
   * Handle logout confirmation with epic animation
   */
  const handleConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(false);
    onClose();
  };

  /**
   * Handle escape key press
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoggingOut) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoggingOut]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
        >
          {/* Epic Backdrop with animated gradient */}
          <motion.div
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-lg"
            onClick={handleClose}
          />

          {/* Floating Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                y: [0, -50, -100],
                x: [0, Math.sin(particle.id) * 30, Math.sin(particle.id) * 60],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
              }}
            >
              <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-sm" />
            </motion.div>
          ))}

          {/* Modal Container with Epic Entrance */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateY: -30 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.3, opacity: 0, rotateY: 30 }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 300,
              duration: 0.6,
            }}
            className="relative w-full max-w-lg mx-auto perspective-1000"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Outer Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/30 via-orange-500/40 to-red-600/30 rounded-3xl blur-2xl animate-pulse" />

            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-slate-800/98 via-slate-900/95 to-slate-800/98 backdrop-blur-xl rounded-3xl border-2 border-gradient-to-r from-red-500/50 via-orange-500/50 to-red-600/50 shadow-2xl overflow-hidden">
              {/* Animated Border */}
              <div className="absolute inset-0 rounded-3xl">
                <div className="absolute inset-[1px] rounded-3xl bg-gradient-to-r from-red-500/20 via-orange-500/30 to-red-600/20 animate-pulse" />
              </div>

              {/* Close Button with Epic Style */}
              {!isLoggingOut && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClose}
                  className="absolute top-6 right-6 z-30 p-3 bg-white/10 hover:bg-red-500/20 backdrop-blur-sm rounded-xl border border-white/20 hover:border-red-500/50 text-white/70 hover:text-white transition-all duration-300 shadow-lg"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}

              {/* Epic Header */}
              <div className="relative p-8 pb-4">
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-center mb-6"
                >
                  {/* Main Warning Icon with Epic Animation */}
                  <motion.div
                    animate={{
                      rotate: [0, -5, 5, -5, 0],
                      scale: [1, 1.05, 1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="relative mx-auto w-20 h-20 mb-4"
                  >
                    {/* Outer Ring */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 rounded-full animate-spin-slow opacity-20" />

                    {/* Middle Ring */}
                    <div className="absolute inset-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-t from-red-600/50 to-transparent rounded-full" />

                      {/* Icon */}
                      <AlertTriangle
                        className="w-8 h-8 text-white drop-shadow-lg relative z-10"
                        strokeWidth={3}
                      />
                    </div>

                    {/* Pulsing Glow */}
                    <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-xl animate-pulse" />
                  </motion.div>

                  {/* Epic Title */}
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-500 mb-2"
                  >
                    ⚠️ LOGOUT WARNING ⚠️
                  </motion.h2>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-white/80 text-lg font-semibold"
                  >
                    End Your PokéChain Adventure?
                  </motion.p>
                </motion.div>
              </div>

              {/* Epic Content Section */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="relative px-8 pb-4"
              >
                {/* Main Warning Card */}
                <div className="relative bg-gradient-to-br from-red-500/10 via-orange-500/15 to-red-600/10 rounded-2xl p-6 border border-red-500/30 shadow-2xl backdrop-blur-sm mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/10 to-red-600/5 rounded-2xl animate-pulse" />

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg mb-2">
                          🚨 Critical Action Required
                        </h3>
                        <p className="text-white/90 leading-relaxed">
                          You're about to end your PokéChain session and return
                          to the login screen. This action will terminate your
                          current gameplay session.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Epic Action Buttons */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="relative p-8 pt-4"
              >
                <div className="flex gap-4">
                  {/* Cancel Button */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    disabled={isLoggingOut}
                    className="flex-1 relative px-6 py-4 bg-gradient-to-r from-slate-600/50 to-slate-700/50 hover:from-slate-600/70 hover:to-slate-700/70 text-white font-bold rounded-2xl transition-all duration-300 border-2 border-slate-500/30 hover:border-slate-400/50 shadow-xl group overflow-hidden disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center justify-center gap-2">
                      <Crown className="w-5 h-5" />
                      <span>Continue</span>
                    </div>
                  </motion.button>

                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirm}
                    disabled={isLoggingOut}
                    className="flex-1 relative px-6 py-4 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white font-black rounded-2xl transition-all duration-300 shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 group overflow-hidden disabled:opacity-70"
                  >
                    {/* Epic Button Effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-red-400/30 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-red-800/50 to-transparent" />

                    <div className="relative flex items-center justify-center gap-2">
                      {isLoggingOut ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          <span>🚀 Logging Out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="w-5 h-5" strokeWidth={3} />
                          <span>END SESSION</span>
                        </>
                      )}
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              {/* Epic Bottom Border */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 to-red-600 animate-pulse" />

              {/* Corner Decorations */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-yellow-400/50 rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-yellow-400/50 rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-yellow-400/50 rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-yellow-400/50 rounded-br-lg" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
