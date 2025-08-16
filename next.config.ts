import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
      },
    ],
  },
  turbopack: {
    rules: {
      '*.svg': [{ loader: '@svgr/webpack', options: { icon: true } }],
    },
  },
};

export default nextConfig;
