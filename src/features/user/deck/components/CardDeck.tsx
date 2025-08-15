"use client";
import { motion } from "framer-motion";

interface DeckCardProps {
  card: any;
  onRemove: (tokenId: string) => void;
  hovered: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export default function DeckCard({
  card,
  onRemove,
  hovered,
  onHoverStart,
  onHoverEnd,
}: DeckCardProps) {
  return (
    <motion.div
      key={card.tokenId}
      layoutId={`selected-${card.tokenId}`}
      className="relative w-16 h-20 md:w-20 md:h-24 rounded-md overflow-hidden border-2 border-yellow-400 shadow-lg cursor-pointer"
      whileHover={{ scale: 1.1, zIndex: 10 }}
      onClick={() => onRemove(card.tokenId)}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate">
        {card.name}
      </div>
      {hovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center"
        >
          <span className="text-white font-bold text-sm">Remove</span>
        </motion.div>
      )}
    </motion.div>
  );
}
