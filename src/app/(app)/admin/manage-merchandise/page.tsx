'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Package,
  DollarSign,
  Eye,
  EyeOff,
  ArrowUpRight,
  Filter,
  MoreVertical,
  Image as ImageIcon,
  TrendingUp,
  ShoppingCart,
  Star,
  Grid3X3,
  List,
  SortAsc,
} from 'lucide-react';

interface Merchandise {
  id: string;
  name: string;
  price: number;
  quantity: number;
  currency: string;
  active: boolean;
  imageUrl?: string;
  description?: string;
}

export default function MerchandisePage() {
  // Original state management - PRESERVED
  const [items, setItems] = useState<Merchandise[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Merchandise>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // New UI state for enhanced UX
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name');

  // Original API fetch - PRESERVED EXACTLY
  useEffect(() => {
    fetch('/api/admin/merchandise')
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      });
  }, []);

  // Original form handlers - PRESERVED EXACTLY
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Original submit logic - PRESERVED EXACTLY
  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.quantity) return;

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `/api/admin/merchandise/${editingId}`
      : '/api/admin/merchandise';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: parseFloat(String(form.price)),
        quantity: parseInt(String(form.quantity)),
      }),
    });

    const text = await res.text();
    if (!text) return alert('Empty server response');

    const updated = JSON.parse(text);

    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
    } else {
      setItems((prev) => [updated, ...prev]);
    }

    setForm({});
    setEditingId(null);
    setShowForm(false);
  };

  // Original delete logic - PRESERVED EXACTLY
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await fetch(`/api/admin/merchandise/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Original edit functions - PRESERVED EXACTLY
  const startEdit = (item: Merchandise) => {
    setForm(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setForm({});
    setEditingId(null);
    setShowForm(false);
  };

  // Original filtering logic - PRESERVED, enhanced with sorting
  const filteredItems = items
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'quantity':
          return b.quantity - a.quantity;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  // Original calculations - PRESERVED EXACTLY
  const totalValue = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Merchandise Management
          </h1>
        </div>
        <p className="text-white/70">
          Manage your Pokemon TCG inventory and products
        </p>
      </div>

      {/* Enhanced Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +15.7%
            </span>
          </div>
          <h3 className="text-white/70 text-sm font-medium">Total Items</h3>
          <p className="text-2xl font-bold text-white">{totalItems}</p>
          <p className="text-white/50 text-xs mt-1">8 added today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-6 border border-green-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +23.1%
            </span>
          </div>
          <h3 className="text-white/70 text-sm font-medium">Total Value</h3>
          <p className="text-2xl font-bold text-white">
            ${totalValue.toFixed(2)}
          </p>
          <p className="text-white/50 text-xs mt-1">Inventory worth</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +5.3%
            </span>
          </div>
          <h3 className="text-white/70 text-sm font-medium">Active Products</h3>
          <p className="text-2xl font-bold text-white">
            {items.filter((i) => i.active).length}
          </p>
          <p className="text-white/50 text-xs mt-1">Live on store</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md rounded-2xl p-6 border border-orange-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8.2%
            </span>
          </div>
          <h3 className="text-white/70 text-sm font-medium">Low Stock Items</h3>
          <p className="text-2xl font-bold text-white">
            {items.filter((item) => item.quantity <= 10).length}
          </p>
          <p className="text-white/50 text-xs mt-1">Need restocking</p>
        </motion.div>
      </div>

      {/* Enhanced Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Enhanced Search - same functionality */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* New Sort Feature */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'name' | 'price' | 'quantity')
            }
            className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Stock</option>
          </select>

          {/* New View Toggle */}
          <div className="flex bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Enhanced Add Button - same functionality */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          {editingId ? 'Update' : 'Add'} Merchandise
        </motion.button>
      </div>

      {/* Enhanced Form Modal - same backend logic */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && cancelEdit()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-2xl border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingId ? '✏️ Update Merchandise' : '➕ Add New Merchandise'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    name="name"
                    placeholder="Name"
                    value={form.name || ''}
                    onChange={handleChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={form.price || ''}
                    onChange={handleChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={form.currency || 'USD'}
                    onChange={handleChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="MYR">MYR</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    value={form.quantity || ''}
                    onChange={handleChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={form.description || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Image URL
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    placeholder="Image URL"
                    value={form.imageUrl || ''}
                    onChange={handleChange}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active || false}
                      onChange={handleChange}
                      className="w-5 h-5 text-blue-600 bg-white/10 border-white/30 rounded focus:ring-blue-500"
                    />
                    <span className="text-white/80 font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                >
                  {editingId ? 'Update' : 'Add'} Merchandise
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Content Area - same backend data */}
      {loading ? (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center">
          <div className="animate-spin w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Loading...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center"
        >
          <Package className="w-20 h-20 text-white/30 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">
            No merchandise found.
          </h3>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first product'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
          >
            Add First Product
          </button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={
                viewMode === 'grid'
                  ? 'bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all group'
                  : 'bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all'
              }
            >
              {viewMode === 'grid' ? (
                // Grid View
                <>
                  <div className="relative mb-4">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-40 object-cover rounded-xl bg-white/5"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center">
                        <Package className="w-12 h-12 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {item.active ? (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                          ✅
                        </span>
                      ) : (
                        <span className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
                          ❌
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-white/60 text-sm line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-white">
                      ${item.price.toFixed(2)}
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.quantity > 10
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : item.quantity > 0
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {item.quantity}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="flex-1 bg-blue-500/20 text-blue-300 py-2 px-4 rounded-lg hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-red-500/20 text-red-300 py-2 px-4 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                // List View - same as original table data
                <div className="flex items-center gap-4">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl bg-white/5"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white/30" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-white/60 text-sm">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      ${item.price.toFixed(2)}
                    </div>
                    <div className="text-white/60 text-sm">{item.currency}</div>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      item.quantity > 10
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : item.quantity > 0
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {item.quantity}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                        ✅
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                        ❌
                      </span>
                    )}
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
