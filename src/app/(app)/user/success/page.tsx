"use client";

import { motion } from "framer-motion";
import { Trophy, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const total = searchParams.get("total");

  return (
    <div className="min-h-screen  relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-
        3xl animate-pulse"
        ></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-600/20 backdrop-blur-2xl rounded-3xl border border-slate-600/50 shadow-2xl overflow-hidden"
        >
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-yellow-400/10 via-amber-500/10 to-orange-500/10 border-b border-yellow-400/30 p-6 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/5 to-transparent opacity-20"></div>
            <div className="relative z-10 flex items-center justify-center gap-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                PAYMENT SUCCESSFUL!
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8 md:p-10">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto drop-shadow-2xl" />
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-spin" />
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-yellow-400/30 blur-md rounded-full"></div>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-white mb-4"
              >
                Your Order is Confirmed!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-slate-300 mb-6 max-w-md mx-auto"
              >
                Thank you for your purchase. Your items have been added to your
                collection.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 text-left"
              >
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-3 mb-3">
                  <span className="text-slate-400">Date</span>
                  <span className="text-slate-300">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total</span>
                  <span className="text-xl font-bold text-white">
                    ${total || "0.00"}
                  </span>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/user/orders"
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <span>View Orders</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/user/merchandise"
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-slate-600/50"
              >
                <span>Continue Shopping</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
          className="absolute rounded-full bg-yellow-400/30"
          style={{
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}
