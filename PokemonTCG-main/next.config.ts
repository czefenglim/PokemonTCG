// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly expose environment variables to the client
  env: {
    NEXT_PUBLIC_POKEMON_CARD_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_POKEMON_CARD_CONTRACT_ADDRESS,
    NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    NEXT_PUBLIC_IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY,

    // Legacy support
    NEXT_PUBLIC_POKEMON_CARD_CONTRACT:
      process.env.NEXT_PUBLIC_POKEMON_CARD_CONTRACT,
    NEXT_PUBLIC_BATTLE_WAGER_CONTRACT:
      process.env.NEXT_PUBLIC_BATTLE_WAGER_CONTRACT,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
  },

  webpack: (config, { isServer }) => {
    // Handle node modules that might not be available in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },

  // Image optimization settings
  images: {
    domains: [
      "images.pokemontcg.io",
      "ipfs.io",
      "gateway.pinata.cloud",
      "www.freeiconspng.com",
    ],
    unoptimized: true, // For development - set to false in production
  },

  // CORS headers for API routes
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, x-user-id",
          },
        ],
      },
    ];
  },

  // Logging configuration for debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // TypeScript configuration
  typescript: {
    // Don't ignore TypeScript errors during build for better development
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Don't ignore ESLint errors during build for better development
    ignoreDuringBuilds: false,
  },
};

// Log environment variables for debugging (only in development)
if (process.env.NODE_ENV === "development") {
  console.log("🔧 Next.js Config - Environment Variables:");
  console.log(
    "POKEMON_CARD_CONTRACT:",
    process.env.NEXT_PUBLIC_POKEMON_CARD_CONTRACT_ADDRESS
  );
  console.log(
    "WAGER_CONTRACT:",
    process.env.NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS
  );
  console.log("CHAIN_ID:", process.env.NEXT_PUBLIC_CHAIN_ID);
  console.log("WEBSOCKET_URL:", process.env.NEXT_PUBLIC_WEBSOCKET_URL);

  // Warn about missing environment variables
  const requiredEnvVars = [
    "NEXT_PUBLIC_POKEMON_CARD_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_CHAIN_ID",
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    console.warn("⚠️ Missing required environment variables:");
    missingEnvVars.forEach((envVar) => {
      console.warn(`   - ${envVar}`);
    });
  }
}

export default nextConfig;
