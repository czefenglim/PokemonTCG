"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PokemonCardProps {
  card: any;
  isSelected: boolean;
  onClick: () => void;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  hovered: boolean;
  getTypeColor: (type: string) => string;
}

export default function PokemonCard({
  card,
  isSelected,
  onClick,
  onHoverStart,
  onHoverEnd,
  hovered,
  getTypeColor,
}: PokemonCardProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      {/* Main Card */}
      <motion.div
        key={card.tokenId}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
      >
        <div
          className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-300 shadow-lg ${
            isSelected
              ? "ring-4 ring-yellow-400 transform scale-95"
              : "border-2 border-gray-700 hover:border-yellow-400"
          }`}
          onClick={onClick}
        >
          <div className="relative">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full aspect-[3/4] object-cover"
            />
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
              >
                <span className="text-white font-bold text-lg">
                  {isSelected ? "Remove" : "Select"}
                </span>
              </motion.div>
            )}
          </div>

          {/* Card Footer */}
          <div className="bg-gray-800 px-2 py-2 relative flex justify-between items-center">
            <div className="flex flex-col">
              <h3 className="font-semibold truncate text-sm">{card.name}</h3>
              <span
                className={`text-xs mt-1 px-2 py-1 rounded-full ${getTypeColor(
                  card.type
                )}`}
              >
                {card.type}
              </span>
            </div>

            {/* Zoom Button - Bottom Right */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(true);
              }}
              className="text-white bg-transparent hover:text-yellow-400 text-lg rounded-full p-1"
              title="Zoom"
            >
              🔍
            </button>
          </div>
        </div>
      </motion.div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-2 right-2 text-white bg-black bg-opacity-60 hover:bg-opacity-80 px-3 py-1 rounded-full z-50 text-sm font-bold"
              >
                ✕
              </button>
              <img
                src={card.imageUrl}
                alt={card.name}
                className="w-full h-auto max-h-[80vh] rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center text-white">
                <h2 className="text-xl font-bold">{card.name}</h2>
                <p className="mt-1 text-sm text-gray-300">
                  Rarity: {card.rarity} | Type: {card.type}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
