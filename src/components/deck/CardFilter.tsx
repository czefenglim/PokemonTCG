"use client";

interface CardFilterProps {
  types: string[];
  rarities: string[];
  selectedType: string;
  selectedRarity: string;
  onTypeChange: (type: string) => void;
  onRarityChange: (rarity: string) => void;
}

export default function CardFilter({
  types,
  rarities,
  selectedType,
  selectedRarity,
  onTypeChange,
  onRarityChange,
}: CardFilterProps) {
  // Filter out empty/undefined/null values before mapping
  const filteredTypes = types.filter((t) => t && t.trim() !== "");
  const filteredRarities = rarities.filter((r) => r && r.trim() !== "");

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Type Filter */}
      <select
        className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={selectedType}
        onChange={(e) => onTypeChange(e.target.value)}
      >
        <option value="">All Types</option>
        {filteredTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Rarity Filter */}
      <select
        className="bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={selectedRarity}
        onChange={(e) => onRarityChange(e.target.value)}
      >
        <option value="">All Rarities</option>
        {filteredRarities.map((rarity) => (
          <option key={rarity} value={rarity}>
            {rarity}
          </option>
        ))}
      </select>
    </div>
  );
}
