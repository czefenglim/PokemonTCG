// app/admin/gem-packages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GemPackage {
  id: string;
  amount: number;
  priceCents: number;
  currency: string;
  stripeId: string;
  badge?: string;
  popular: boolean;
  active: boolean;
  discountPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  amount: number;
  priceCents: number;
  stripeId: string;
  badge: string;
  popular: boolean;
  active: boolean;
  discountPercentage: number;
  currency: string;
}

export default function AdminGemPackagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [packages, setPackages] = useState<GemPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<GemPackage | null>(null);
  const [formData, setFormData] = useState({
    amount: 0,
    priceCents: 0,
    stripeId: '',
    badge: '',
    discountPercentage: 0,
    popular: false,
    active: true,
    currency: 'USD',
  });
  const [emojiPositions, setEmojiPositions] = useState<
    { left: string; top: string }[]
  >([]);

  useEffect(() => {
    const positions = Array.from({ length: 10 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }));
    setEmojiPositions(positions);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (
      !session ||
      (session.user.role !== 'ADMIN' &&
        session.user.role !== 'admin' &&
        session.user.role !== 'super_admin')
    ) {
      router.push('/unauthorized');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session) {
      fetchPackages();
    }
  }, [session]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/gem-packages');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPackages(data);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to load gem packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingPackage ? 'update' : 'create');

    try {
      const url = '/api/admin/gem-packages';
      const method = editingPackage ? 'PUT' : 'POST';
      const body = editingPackage
        ? { id: editingPackage.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let result;
      try {
        result = await response.json();
      } catch {
        result = { error: 'Unexpected server error. Please try again.' };
      }

      if (!response.ok) {
        const message = result?.error?.toLowerCase() || '';
        if (message.includes('stripe') && message.includes('unique')) {
          alert('⚠ Stripe Price ID already exists. Please enter a unique one.');
        } else {
          alert(result.error || 'Failed to save package.');
        }
        return;
      }

      // Success — update packages and close modal
      await fetchPackages();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm('Are you sure you want to delete this package?');
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/gem-packages?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        console.error('Failed to delete:', error);
        alert('Failed to delete package.');
        return;
      }

      // Success — refresh or update UI
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      alert('Package deleted successfully!');
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Something went wrong.');
    }
  };

  const handleEdit = (pkg: GemPackage) => {
    setEditingPackage(pkg);
    setFormData({
      amount: pkg.amount,
      priceCents: pkg.priceCents,
      stripeId: pkg.stripeId,
      badge: pkg.badge || '',
      popular: pkg.popular,
      active: pkg.active,
      discountPercentage: pkg.discountPercentage || 0,
      currency: pkg.currency || 'USD', // ✅ Add this
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      amount: 0,
      priceCents: 0,
      stripeId: '',
      badge: '',
      popular: false,
      active: true,
      discountPercentage: 0,
      currency: 'USD', // ✅ Add this
    });
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(`toggle-${id}`);
    try {
      const response = await fetch('/api/admin/gem-packages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentStatus }),
      });

      if (response.ok) {
        await fetchPackages();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setError('Failed to toggle status');
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-purple-300 rounded-full animate-spin border-t-transparent"></div>
          <p className="text-white text-xl">Loading gem packages...</p>
        </div>
      </div>
    );
  }

  if (
    !session ||
    (session.user.role !== 'ADMIN' &&
      session.user.role !== 'admin' &&
      session.user.role !== 'super_admin')
  ) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {emojiPositions.map((pos, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.sin(i) * 30, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
            }}
            className="absolute text-3xl text-purple-300"
            style={pos}
          >
            💎
          </motion.div>
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/10 backdrop-blur-md bg-white/5"
        >
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin"
                  className="text-white/60 hover:text-white transition-colors"
                >
                  ← Back to Dashboard
                </Link>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">💎</span>
                  <h1 className="text-2xl font-bold text-white">
                    Gem Packages Management
                  </h1>
                </div>
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                + Create Package
              </button>
            </div>
          </div>
        </motion.header>

        {/* Add this to your JSX before the packages grid: */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
              <div className="text-red-400 font-semibold mb-2">⚠️ Error</div>
              <div className="text-white">{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  fetchPackages();
                }}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Packages Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border transition-all duration-300 ${
                    pkg.active
                      ? 'border-white/20 hover:border-white/40'
                      : 'border-red-500/30 bg-red-500/5'
                  } ${pkg.popular ? 'ring-2 ring-purple-400/50' : ''}`}
                >
                  {/* Status indicators */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {pkg.popular && (
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          🔥 Popular
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          pkg.active
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {pkg.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Package content */}
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">💎</div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {pkg.amount.toLocaleString()} Gems
                    </h3>
                    <div className="text-3xl font-bold text-yellow-400 mb-2">
                      ${(pkg.priceCents / 100).toFixed(2)}
                    </div>
                    {pkg.badge && (
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-2">
                        {pkg.badge}
                      </div>
                    )}
                    <div className="text-sm text-white/60">
                      ${((pkg.priceCents / 100 / pkg.amount) * 1000).toFixed(2)}{' '}
                      per 1k gems
                    </div>
                    {pkg.discountPercentage && pkg.discountPercentage > 0 && (
                      <div className="text-sm text-green-400 font-bold">
                        {pkg.discountPercentage}% OFF
                      </div>
                    )}
                  </div>

                  {/* Stripe ID */}
                  <div className="text-xs text-white/50 mb-4 break-all">
                    Stripe ID: {pkg.stripeId}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(pkg)}
                      disabled={actionLoading !== null}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => toggleStatus(pkg.id, pkg.active)}
                      disabled={actionLoading === `toggle-${pkg.id}`}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 ${
                        pkg.active
                          ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200'
                      }`}
                    >
                      {actionLoading === `toggle-${pkg.id}`
                        ? 'Loading...'
                        : pkg.active
                        ? 'Disable'
                        : 'Enable'}
                    </button>

                    <button
                      onClick={() => handleDelete(pkg.id, `${pkg.amount} Gems`)}
                      disabled={actionLoading === `delete-${pkg.id}`}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50"
                    >
                      {actionLoading === `delete-${pkg.id}` ? '...' : '🗑️'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {packages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-white mb-4">
                No Gem Packages Found
              </h3>
              <p className="text-white/60 mb-6">
                Create your first gem package to get started.
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Create First Package
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Gem Amount */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Gem Amount *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 1000"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Price in cents */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Price (in cents) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.priceCents || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceCents: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="e.g., 700"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {formData.priceCents > 0 && (
                    <p className="text-white/60 text-sm mt-1">
                      Display price: ${(formData.priceCents / 100).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Currency *
                  </label>
                  <select
                    required
                    value={formData.currency || 'USD'}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none"
                  >
                    <option value="USD" className="text-black">
                      USD (US Dollar)
                    </option>
                    <option value="EUR" className="text-black">
                      EUR (Euro)
                    </option>
                    <option value="JPY" className="text-black">
                      JPY (Yen)
                    </option>
                    <option value="GBP" className="text-black">
                      GBP (Pound Sterling)
                    </option>
                  </select>
                </div>

                {/* Stripe Price ID */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Stripe Price ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.stripeId}
                    onChange={(e) =>
                      setFormData({ ...formData, stripeId: e.target.value })
                    }
                    placeholder="price_1234567890"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Badge (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, badge: e.target.value })
                    }
                    placeholder="e.g., Starter, Popular, Best Value"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercentage: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={formData.popular || false}
                      onChange={(e) =>
                        setFormData({ ...formData, popular: e.target.checked })
                      }
                      className="rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-400"
                    />
                    Popular Package
                  </label>
                  <label className="flex items-center gap-2 text-white/80">
                    <input
                      type="checkbox"
                      checked={formData.active || false}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="rounded border-white/20 bg-white/10 text-green-500 focus:ring-green-400"
                    />
                    Active
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading !== null}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {actionLoading
                      ? 'Saving...'
                      : editingPackage
                      ? 'Update'
                      : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
