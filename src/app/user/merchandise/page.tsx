'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Star,
  Package,
  Shirt,
  Gift,
  Sparkles,
  Heart,
  Filter,
  Search,
  TrendingUp,
  Crown,
  Zap,
} from 'lucide-react';

type ProductType = 'clothing' | 'physical-pack' | 'bundle' | 'exclusive';

type Product = {
  id: string;
  name: string;
  type: ProductType;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  features: string[];
  digitalBonus: {
    gems: number;
    packs: number;
    exclusive?: string;
  };
  rarity: 'common' | 'rare' | 'legendary';
  inStock: boolean;
  limitedEdition?: boolean;
  unlockRequirement?: string;
  rating: number;
  reviews: number;
};

export default function MerchandiseStore() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<
    'featured' | 'price-low' | 'price-high' | 'rating'
  >('featured');

  // Mock products data
  const products: Product[] = [
    // Clothing Items
    {
      id: 'legendary-hoodie',
      name: 'Legendary Trainer Hoodie',
      type: 'clothing',
      price: 65,
      originalPrice: 85,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
      category: 'hoodies',
      description:
        'Premium fleece hoodie featuring holographic legendary card artwork',
      features: [
        'Premium fleece material',
        'Holographic print',
        'Kangaroo pocket',
        'Limited edition',
      ],
      digitalBonus: {
        gems: 500,
        packs: 5,
        exclusive: 'Legendary avatar frame',
      },
      rarity: 'legendary',
      inStock: true,
      limitedEdition: true,
      rating: 4.9,
      reviews: 127,
    },
    {
      id: 'trainer-tshirt',
      name: 'Elite Trainer T-Shirt',
      type: 'clothing',
      price: 35,
      image:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
      category: 'tshirts',
      description: 'Comfortable cotton tee with minimalist card rarity design',
      features: [
        '100% cotton',
        'Breathable fabric',
        'Fade-resistant print',
        'Unisex fit',
      ],
      digitalBonus: { gems: 200, packs: 2 },
      rarity: 'common',
      inStock: true,
      rating: 4.7,
      reviews: 89,
    },
    {
      id: 'collector-cap',
      name: "Collector's Edition Cap",
      type: 'clothing',
      price: 25,
      image:
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500',
      category: 'accessories',
      description: 'Snapback cap with embroidered rarity gems',
      features: [
        'Adjustable snapback',
        'Embroidered design',
        'UV protection',
        'Premium materials',
      ],
      digitalBonus: { gems: 150, packs: 1 },
      rarity: 'rare',
      inStock: true,
      rating: 4.5,
      reviews: 156,
    },

    // Physical Packs
    {
      id: 'starter-pack',
      name: 'Starter Physical Pack',
      type: 'physical-pack',
      price: 15,
      image:
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=500',
      category: 'packs',
      description: '15 premium physical cards with digital unlock codes',
      features: [
        '15 physical cards',
        '1 guaranteed rare',
        'Digital unlock codes',
        'Collectible packaging',
      ],
      digitalBonus: { gems: 300, packs: 5, exclusive: 'Physical pack badge' },
      rarity: 'common',
      inStock: true,
      rating: 4.8,
      reviews: 243,
    },
    {
      id: 'premium-pack',
      name: 'Premium Collectors Pack',
      type: 'physical-pack',
      price: 45,
      originalPrice: 55,
      image:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
      category: 'packs',
      description: '25 premium cards with guaranteed ultra-rare and foil cards',
      features: [
        '25 premium cards',
        '2 guaranteed ultra-rares',
        'Foil cards included',
        'Premium packaging',
      ],
      digitalBonus: { gems: 800, packs: 15, exclusive: 'Exclusive card backs' },
      rarity: 'legendary',
      inStock: true,
      limitedEdition: true,
      rating: 4.9,
      reviews: 178,
    },

    // Bundles
    {
      id: 'trainer-bundle',
      name: 'Complete Trainer Bundle',
      type: 'bundle',
      price: 89,
      originalPrice: 120,
      image:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500',
      category: 'bundles',
      description: 'Hoodie + Premium Pack + Exclusive accessories',
      features: [
        'Legendary hoodie',
        'Premium pack',
        'Collector cap',
        'Exclusive stickers',
      ],
      digitalBonus: { gems: 1500, packs: 25, exclusive: 'VIP badge + avatar' },
      rarity: 'legendary',
      inStock: true,
      limitedEdition: true,
      rating: 5.0,
      reviews: 67,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Items', icon: '🛍️' },
    { id: 'clothing', name: 'Apparel', icon: '👕' },
    { id: 'physical-pack', name: 'Physical Packs', icon: '📦' },
    { id: 'bundle', name: 'Bundles', icon: '🎁' },
    { id: 'exclusive', name: 'VIP Exclusive', icon: '👑' },
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'from-purple-400 to-pink-500';
      case 'rare':
        return 'from-blue-400 to-cyan-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const filteredProducts = products
    .filter(
      (product) =>
        (activeCategory === 'all' || product.type === activeCategory) &&
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        default:
          return b.rarity === 'legendary' ? 1 : -1;
      }
    });

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing) {
        return prev.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
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
                ease: 'easeInOut',
              }}
              className="absolute text-xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              {['🛍️', '👕', '📦', '💎', '⭐'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      </div>

      <main className="relative z-10 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-full flex justify-center items-center text-center mb-6">
              <motion.h1
                className="text-4xl md:text-6xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex items-center justify-center gap-4">
                  <span>Merchandise Store</span>
                </div>
              </motion.h1>
            </div>

            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
              Exclusive apparel, premium physical card packs, and limited
              edition collectibles with amazing digital rewards
            </p>

            {/* Quick Stats */}
            <div className="flex justify-center gap-8 mb-8">
              {[
                {
                  label: 'Items Available',
                  value: products.length,
                  icon: '📦',
                },
                { label: 'Digital Rewards', value: '10K+', icon: '💎' },
                { label: 'Happy Customers', value: '2.5K+', icon: '⭐' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/60">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Search and Filters */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search merchandise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-4">
                  <Filter className="w-5 h-5 text-white/60" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="featured" className="bg-gray-800">
                      Featured
                    </option>
                    <option value="price-low" className="bg-gray-800">
                      Price: Low to High
                    </option>
                    <option value="price-high" className="bg-gray-800">
                      Price: High to Low
                    </option>
                    <option value="rating" className="bg-gray-800">
                      Highest Rated
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Category Navigation */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.section>

          {/* Products Grid */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 h-full flex flex-col">
                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.limitedEdition && (
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                              LIMITED
                            </div>
                          )}
                          {product.originalPrice && (
                            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              SALE
                            </div>
                          )}
                        </div>

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              favorites.includes(product.id)
                                ? 'text-red-500 fill-red-500'
                                : 'text-white'
                            }`}
                          />
                        </button>

                        {/* Rarity Glow */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(
                            product.rarity
                          )} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">
                            {product.name}
                          </h3>
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(
                              product.rarity
                            )} text-white`}
                          >
                            {product.rarity.toUpperCase()}
                          </div>
                        </div>

                        <p className="text-white/60 text-sm mb-3 line-clamp-2 flex-1">
                          {product.description}
                        </p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product.rating)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-white/60 text-sm">
                            ({product.reviews})
                          </span>
                        </div>

                        {/* Digital Bonus */}
                        <div className="bg-purple-500/20 rounded-lg p-2 mb-3">
                          <div className="text-xs text-purple-300 font-medium mb-1">
                            Digital Bonus:
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/80">
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-400">💎</span>
                              {product.digitalBonus.gems}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-blue-400">📦</span>
                              {product.digitalBonus.packs}
                            </span>
                          </div>
                        </div>

                        {/* Price and Add to Cart */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">
                              ${product.price}
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-white/50 line-through">
                                ${product.originalPrice}
                              </span>
                            )}
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(product.id);
                            }}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-2 rounded-lg transition-all duration-300"
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Product Detail Modal */}
          <AnimatePresence>
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={() => setSelectedProduct(null)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(
                          selectedProduct.rarity
                        )} opacity-20`}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {selectedProduct.name}
                        </h2>
                        <div className="flex items-center gap-4">
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r ${getRarityColor(
                              selectedProduct.rarity
                            )} text-white`}
                          >
                            {selectedProduct.rarity.toUpperCase()}
                          </div>
                          {selectedProduct.limitedEdition && (
                            <div className="px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
                              LIMITED EDITION
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-white/80">
                        {selectedProduct.description}
                      </p>

                      {/* Features */}
                      <div>
                        <h3 className="font-bold text-white mb-2">Features:</h3>
                        <ul className="space-y-1">
                          {selectedProduct.features.map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-center gap-2 text-white/70"
                            >
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Digital Bonus */}
                      <div className="bg-purple-500/20 rounded-xl p-4">
                        <h3 className="font-bold text-purple-300 mb-2 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Digital Rewards Included:
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-yellow-400">💎</span>
                            <span>
                              {selectedProduct.digitalBonus.gems} Gems
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-blue-400">📦</span>
                            <span>
                              {selectedProduct.digitalBonus.packs} Digital Packs
                            </span>
                          </div>
                          {selectedProduct.digitalBonus.exclusive && (
                            <div className="flex items-center gap-2 text-white">
                              <Crown className="w-4 h-4 text-purple-400" />
                              <span>
                                {selectedProduct.digitalBonus.exclusive}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price and Actions */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-bold text-white">
                            ${selectedProduct.price}
                          </span>
                          {selectedProduct.originalPrice && (
                            <span className="text-xl text-white/50 line-through">
                              ${selectedProduct.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addToCart(selectedProduct.id)}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleFavorite(selectedProduct.id)}
                            className={`p-3 rounded-xl transition-all duration-300 ${
                              favorites.includes(selectedProduct.id)
                                ? 'bg-red-500 text-white'
                                : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                favorites.includes(selectedProduct.id)
                                  ? 'fill-current'
                                  : ''
                              }`}
                            />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <span className="text-white text-xl">✕</span>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </motion.button>
        )}
      </main>
    </div>
  );
}
