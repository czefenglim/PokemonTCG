// components/NFTGameFeatureSection.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getFeaturesForGrid } from '@/lib/features-config';

export default function NFTGameFeatureSection() {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Get features from centralized config
  const features = getFeaturesForGrid();

  useEffect(() => {
    setMounted(true);
  }, []);

  const playClick = () => console.log('Click sound played');

  const handleCardClick = (feature) => {
    playClick();
    console.log(`Navigating to ${feature.href}`);

    // Add navigation functionality
    router.push(feature.href);
  };

  return (
    <div className="relative">
      {/* Subtle animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                mounted
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
              onMouseEnter={() => setHoveredCard(feature.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(feature)}
            >
              {/* Card Background */}
              <div className="relative h-80 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    style={{
                      filter:
                        hoveredCard === feature.id
                          ? 'blur(0px) brightness(1)'
                          : 'blur(1px) brightness(0.6)',
                    }}
                  />

                  {/* Gradient Overlays */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>

                {/* Animated Border */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-all duration-300 ${
                    hoveredCard === feature.id
                      ? `bg-gradient-to-r ${feature.borderGradient} p-0.5 ${feature.glowColor} shadow-2xl`
                      : 'bg-slate-700/30 p-0.5'
                  }`}
                >
                  <div className="w-full h-full bg-transparent rounded-2xl"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-6">
                  {/* Header Section */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="text-3xl transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg">
                        {feature.icon}
                      </div>
                      <div>
                        <div className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">
                          {feature.subtitle}
                        </div>
                        <h3 className="text-xl font-black text-white">
                          {feature.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-slate-200 text-sm leading-relaxed mb-4">
                      {feature.desc}
                    </p>

                    {/* Stats Badge */}
                    <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2 border border-white/10">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-semibold">
                        {feature.stats.value}
                      </span>
                      <span className="text-slate-300 text-xs">
                        {feature.stats.label}
                      </span>
                    </div>
                  </div>

                  {/* Action Button - Appears on Hover */}
                  <div
                    className={`transform transition-all duration-300 ${
                      hoveredCard === feature.id
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                    }`}
                  >
                    <button className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/40 hover:border-white/70 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-2xl hover:shadow-white/30 group relative overflow-hidden">
                      {/* Subtle shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-all duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>

                      <span className="relative z-10 flex items-center justify-center gap-3">
                        <span className="text-lg font-bold">
                          Explore {feature.title}
                        </span>
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                          <svg
                            className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </span>
                    </button>
                  </div>
                </div>

                {/* Shine Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 transition-all duration-700 ${
                    hoveredCard === feature.id
                      ? 'translate-x-full'
                      : '-translate-x-full'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
