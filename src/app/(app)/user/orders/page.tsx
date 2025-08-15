"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { startOfDay, endOfDay } from "date-fns";

type Transaction = {
  id: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  location: string;
  phoneNumber: string;
  email?: string;
  status: string;
  paymentRef?: string;
  createdAt: string;
  merchandise: {
    id: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
  };
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "PAID":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "SHIPPED":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "COMPLETED":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "CANCELLED":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "REFUNDED":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles(
        status
      )}`}
    >
      {status}
    </motion.span>
  );
};

const LoadingCard = () => (
  <div className="bg-white/10 rounded-2xl border border-white/20 p-6 animate-pulse backdrop-blur-md">
    <div className="flex gap-6">
      <div className="w-24 h-24 bg-white/10 rounded-lg"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-3 bg-white/10 rounded w-1/2"></div>
        <div className="h-3 bg-white/10 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

export default function OrdersPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  useEffect(() => {
    if (startDate || endDate) {
      const filtered = transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt).getTime();
        const startTime = startDate
          ? startOfDay(new Date(startDate)).getTime()
          : 0;
        const endTime = endDate
          ? endOfDay(new Date(endDate)).getTime()
          : Infinity;
        return txDate >= startTime && txDate <= endTime;
      });
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transactions);
    }
  }, [startDate, endDate, transactions]);

  const renderAnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(i) * 30, 0],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "easeInOut",
          }}
          className="absolute text-xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          {["🛍️", "👕", "📦", "💎", "⭐"][Math.floor(Math.random() * 5)]}
        </motion.div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {renderAnimatedBackground()}
        <div className="relative z-10 min-h-screen py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="h-8 bg-white/10 rounded w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-white/10 rounded w-64 animate-pulse"></div>
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderAnimatedBackground()}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl shadow-lg p-8 text-center max-w-md border border-white/20">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-white/80 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-xl font-medium transition-all"
          >
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {renderAnimatedBackground()}
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-3xl shadow-lg p-8 text-center max-w-md border border-white/20">
          <div className="text-white/60 text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-white mb-2">No orders yet</h2>
          <p className="text-white/60 mb-6">
            Your order history will appear here once you make your first
            purchase.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Start Shopping
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {renderAnimatedBackground()}
      <div className="relative z-10 min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Your Orders
            </h1>
            <p className="text-white/80">Track and manage your purchases</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-white/80 mb-1"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label
                  htmlFor="end-date"
                  className="block text-sm font-medium text-white/80 mb-1"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={startDate}
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <div className="mt-3 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-sm bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1 rounded-lg transition-all"
                >
                  Clear Filters
                </motion.button>
              </div>
            )}
          </motion.div>

          <div className="space-y-6">
            <AnimatePresence>
              {filteredTransactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:border-white/40 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 relative rounded-xl overflow-hidden bg-white/10">
                          {tx.merchandise.imageUrl ? (
                            <img
                              src={tx.merchandise.imageUrl}
                              alt={tx.merchandise.name}
                              className="object-cover w-full h-full"
                              sizes="(max-width: 640px) 96px, 128px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40 text-3xl">
                              📦
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-white truncate pr-2">
                              {tx.merchandise.name}
                            </h3>
                            <p className="text-white/60 text-sm">
                              Order #{tx.id.slice(-8).toUpperCase()}
                            </p>
                          </div>
                          <StatusBadge status={tx.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                              Quantity
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {tx.quantity}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                              Total
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {tx.currency} {tx.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                              Unit Price
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {tx.currency} {tx.merchandise.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-white/5 rounded-xl p-3">
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                              Order Date
                            </p>
                            <p className="text-sm font-medium text-white">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-white/20 pt-4">
                          <h4 className="text-sm font-semibold text-white mb-2">
                            Delivery Information
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-white/80">
                                Location:
                              </span>
                              <span className="ml-2 text-white">
                                {tx.location}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-white/80">
                                Phone:
                              </span>
                              <span className="ml-2 text-white">
                                {tx.phoneNumber}
                              </span>
                            </div>
                            {tx.email && (
                              <div>
                                <span className="font-medium text-white/80">
                                  Email:
                                </span>
                                <span className="ml-2 text-white">
                                  {tx.email}
                                </span>
                              </div>
                            )}
                            {tx.paymentRef && (
                              <div>
                                <span className="font-medium text-white/80">
                                  Payment Ref:
                                </span>
                                <span className="ml-2 text-white/80 font-mono text-xs">
                                  {tx.paymentRef}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/50">
                        Ordered on {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
