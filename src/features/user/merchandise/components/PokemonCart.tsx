"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  name: string;
  type: "clothing" | "physical-pack" | "bundle" | "exclusive";
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
  rarity: "common" | "rare" | "legendary";
  inStock: boolean;
  limitedEdition?: boolean;
  rating: number;
  reviews: number;
}

interface CartItem {
  id: string;
  quantity: number;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  products: Product[];
  updateCartQuantity: (productId: string, newQuantity: number) => void;
  removeFromCart: (productId: string) => void;
  onCheckout?: () => void;
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "legendary":
      return "from-purple-400 to-pink-500";
    case "rare":
      return "from-blue-400 to-cyan-500";
    default:
      return "from-gray-400 to-gray-600";
  }
};

export default function PokemonCart({
  isOpen,
  onClose,
  cart,
  products,
  updateCartQuantity,
  removeFromCart,
  onCheckout,
}: CartProps) {
  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find((p) => p.id === item.id);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const { data: session } = useSession();

  // Inside your component function (PokemonCart) — add state for inputs
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{
    location?: string;
    phone?: string;
    email?: string;
  }>({});

  // Validation helpers
  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[0-9]{7,15}$/; // Allows optional + and 7-15 digits
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Run validations when user types
  const handleLocationChange = (value: string) => {
    setLocation(value);
    setErrors((prev) => ({
      ...prev,
      location: value.trim() ? undefined : "Location is required",
    }));
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setErrors((prev) => ({
      ...prev,
      phone: validatePhone(value) ? undefined : "Invalid phone number",
    }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setErrors((prev) => ({
      ...prev,
      email:
        !value || validateEmail(value) ? undefined : "Invalid email format",
    }));
  };

  // Button enable/disable condition
  const isFormValid =
    location.trim() && validatePhone(phone) && (!email || validateEmail(email));

  const getCartItemsCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!isFormValid) {
      console.error("Form is not valid");
      return;
    }

    if (cart.length === 0) {
      console.error("Cart is empty");
      return;
    }

    const firstItem = cart[0]; // or handle multiple items
    const productId = firstItem.id;
    const quantity = firstItem.quantity;

    const total = getCartTotal();

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id, // pass from props or session
          productId,
          quantity,
          location,
          phoneNumber: phone,
          total,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
            className="absolute right-0 top-0 h-full w-[440px] bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Clean Modern Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    <span>Shopping Cart</span>
                  </h2>
                  <div className="text-sm text-gray-500 mt-1">
                    {getCartItemsCount()}{" "}
                    {getCartItemsCount() === 1 ? "item" : "items"}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                >
                  <span className="text-gray-400 group-hover:text-gray-600 text-xl">
                    ✕
                  </span>
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30 p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                      <ShoppingCart className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <span className="text-white text-xs font-bold">0</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-gray-500 text-sm mb-8 max-w-sm leading-relaxed">
                    Discover amazing products and add them to your cart to get
                    started with your purchase.
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg transform hover:scale-105"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {cart.map((item) => {
                    const product = products.find((p) => p.id === item.id);
                    if (!product) return null;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 p-5"
                      >
                        <div className="flex gap-4">
                          {/* Clean product image */}
                          <div className="relative">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Subtle rarity indicator */}
                            <div
                              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r ${getRarityColor(
                                product.rarity
                              )} border-2 border-white shadow-sm`}
                            ></div>

                            {product.limitedEdition && (
                              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm border border-white">
                                LE
                              </div>
                            )}
                          </div>

                          {/* Product details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-base leading-tight">
                                  {product.name}
                                </h3>
                                <div className="text-xs text-gray-500 font-medium mt-1">
                                  {product.type === "physical-pack"
                                    ? "Card Pack"
                                    : product.type === "clothing"
                                    ? "Apparel"
                                    : product.type === "bundle"
                                    ? "Bundle"
                                    : "Premium Item"}
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                                title="Remove item"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                              <span className="font-bold text-gray-900 text-lg">
                                ${product.price}
                              </span>
                              {product.originalPrice && (
                                <>
                                  <span className="text-sm text-gray-500 line-through">
                                    ${product.originalPrice}
                                  </span>
                                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                    Save $
                                    {(
                                      product.originalPrice - product.price
                                    ).toFixed(2)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Clean quantity controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600">
                                  Qty:
                                </span>
                                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                  <button
                                    onClick={() =>
                                      updateCartQuantity(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 font-medium transition-colors rounded-l-lg hover:bg-gray-100"
                                  >
                                    −
                                  </button>
                                  <span className="font-semibold text-gray-900 w-12 text-center text-sm">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateCartQuantity(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 font-medium transition-colors rounded-r-lg hover:bg-gray-100"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Item total */}
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                              <span className="text-sm font-medium text-gray-500">
                                Subtotal:
                              </span>
                              <span className="font-semibold text-gray-900">
                                ${(product.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Clean Modern Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-100 bg-white p-6 space-y-6">
                  {/* Order summary */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <div className="text-gray-600 text-sm font-medium mb-1">
                          Order Total
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          ${getCartTotal().toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right text-gray-500 text-sm space-y-1">
                        <div>
                          {getCartItemsCount()}{" "}
                          {getCartItemsCount() === 1 ? "item" : "items"}
                        </div>
                        <div className="flex items-center gap-1 justify-end text-green-600 font-medium">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Free shipping</span>
                        </div>
                      </div>
                    </div>

                    {/* Order breakdown */}
                    <div className="space-y-2 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">
                          ${getCartTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium text-green-600">Free</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium text-gray-900">
                          Calculated at checkout
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* New customer info form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="w-full border text-black border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter your location"
                      />
                      {errors.location && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.location}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full border text-black border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="+1234567890"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email (optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className="w-full border text-black border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: isFormValid ? 1.02 : 1 }}
                      whileTap={{ scale: isFormValid ? 0.98 : 1 }}
                      onClick={handleCheckout}
                      disabled={!isFormValid}
                      className={`w-full font-semibold py-4 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg
                      ${
                        isFormValid
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Proceed to Checkout
                    </motion.button>

                    <button
                      onClick={onClose}
                      className="w-full text-gray-600 hover:text-gray-800 font-medium py-3 transition-colors text-sm"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

