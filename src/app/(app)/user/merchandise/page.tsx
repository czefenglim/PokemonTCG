"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PokemonCart from "@/components/PokemonCart"; // Adjust path as needed
import { ShoppingCart, Heart, Filter, Search } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Define the type for Merchandise items (based on your Prisma schema + UI usage)
type Merchandise = {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  currency: string;
  active: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export default function MerchandiseStore() {
  const [selectedProduct, setSelectedProduct] = useState<Merchandise | null>(
    null
  );
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "featured" | "price-low" | "price-high" | "rating"
  >("featured");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Merchandise[]>([]);

  useEffect(() => {
    async function fetchMerchandise() {
      const res = await fetch("/api/merchandise");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        console.error("Failed to fetch merchandise");
      }
    }
    fetchMerchandise();
  }, []);

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0; // keep original order
      }
    });

  async function handleCheckout() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart, products }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Redirect to Stripe Checkout
    } else {
      console.error("Checkout error", data.error);
    }
  }

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

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.id);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
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
                  </select>
                </div>
              </div>
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
                          src={product.imageUrl || "/placeholder.png"}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
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
                              ? "text-red-500 fill-red-500"
                              : "text-white"
                          }`}
                        />
                      </button>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <p className="text-white/60 text-sm mb-3 line-clamp-2 flex-1">
                          {product.description}
                        </p>

                        {/* Price and Add to Cart */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-white">
                              ${product.price}
                            </span>
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
                        src={selectedProduct.imageUrl || "/placeholder.png"}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Product Details */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {selectedProduct.name}
                        </h2>
                      </div>

                      <p className="text-white/80">
                        {selectedProduct.description}
                      </p>

                      {/* Price and Actions */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-bold text-white">
                            ${selectedProduct.price}
                          </span>
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
                                ? "bg-red-500 text-white"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                favorites.includes(selectedProduct.id)
                                  ? "fill-current"
                                  : ""
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
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {selectedProduct.name}
                        </h2>
                      </div>

                      <p className="text-white/80">
                        {selectedProduct.description}
                      </p>

                      {/* Price and Actions */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-bold text-white">
                            ${selectedProduct.price}
                          </span>
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
                                ? "bg-red-500 text-white"
                                : "bg-white/10 text-white hover:bg-white/20"
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                favorites.includes(selectedProduct.id)
                                  ? "fill-current"
                                  : ""
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

          {/* Cart Modal */}
          <PokemonCart
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            products={products}
            updateCartQuantity={updateCartQuantity}
            removeFromCart={removeFromCart}
            onCheckout={handleCheckout}
          />
        </div>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl z-40 flex items-center gap-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="font-bold">{getCartItemsCount()}</span>
          </motion.button>
        )}
      </main>
    </div>
  );
}
