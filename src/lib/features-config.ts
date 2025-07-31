// lib/features-config.ts
import {
  Home,
  Package,
  ShoppingCart,
  FolderOpen,
  Gem,
  ShoppingBag,
  Trophy,
  Swords,
} from 'lucide-react';

export interface Feature {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  href: string;
  image: string;
  icon: string; // Emoji for feature cards
  lucideIcon: any; // Lucide icon for sidebar
  stats: { value: string; label: string };
  bgGradient: string;
  borderGradient: string;
  glowColor: string;
  showInSidebar: boolean; // Control which features appear in sidebar
  sidebarOrder: number; // Order in sidebar
  category: 'core' | 'commerce' | 'social' | 'premium';
}

export const FEATURES_CONFIG: Feature[] = [
  {
    id: 'home',
    title: 'Dashboard',
    subtitle: 'HOME',
    desc: 'Your central hub for all Pokemon TCG activities',
    href: '/user/home',
    image: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    icon: '🏠',
    lucideIcon: Home,
    stats: { value: 'NEW', label: 'Updates' },
    bgGradient: 'from-blue-400/20 via-cyan-500/20 to-teal-500/20',
    borderGradient: 'from-blue-400 to-cyan-500',
    glowColor: 'shadow-blue-500/30',
    showInSidebar: true,
    sidebarOrder: 0,
    category: 'core',
  },
  {
    id: 'packs',
    title: 'Mystery Packs',
    subtitle: 'PACK OPENING',
    desc: 'Discover legendary Pokemon cards with thrilling unboxing animations',
    href: '/user/packs',
    image:
      'https://media3.giphy.com/media/v1.Y2lkPTZjMDliOTUyeXFyZnY1c3N0b2hhcjQybG9vajl1cXF6aGVtY3h4ZGd2Z29vZnUxMCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/DRfu7BT8ZK1uo/source.gif',
    icon: '🎁',
    lucideIcon: Package,
    stats: { value: '2', label: 'Available' },
    bgGradient: 'from-yellow-400/20 via-orange-500/20 to-red-500/20',
    borderGradient: 'from-yellow-400 to-orange-500',
    glowColor: 'shadow-orange-500/30',
    showInSidebar: true,
    sidebarOrder: 1,
    category: 'core',
  },
  {
    id: 'marketplace',
    title: 'Trading Hub',
    subtitle: 'MARKETPLACE',
    desc: 'Trade rare cards with trainers across the digital world',
    href: '/user/marketplace',
    image:
      'https://www.indy100.com/media-library/image.gif?id=28085442&width=800&quality=85',
    icon: '🏪',
    lucideIcon: ShoppingCart,
    stats: { value: '14', label: 'Active Trades' },
    bgGradient: 'from-cyan-400/20 via-blue-500/20 to-indigo-500/20',
    borderGradient: 'from-cyan-400 to-blue-500',
    glowColor: 'shadow-blue-500/30',
    showInSidebar: true,
    sidebarOrder: 4,
    category: 'core',
  },
  {
    id: 'collection',
    title: 'Card Vault',
    subtitle: 'COLLECTION',
    desc: 'Showcase your legendary collection in an immersive gallery',
    href: '/user/collection',
    image: 'https://media.tenor.com/AkILqGsdIFoAAAAM/pokemon-ash.gif',
    icon: '📋',
    lucideIcon: FolderOpen,
    stats: { value: '23', label: 'Cards Owned' },
    bgGradient: 'from-emerald-400/20 via-green-500/20 to-teal-500/20',
    borderGradient: 'from-emerald-400 to-green-500',
    glowColor: 'shadow-green-500/30',
    showInSidebar: true,
    sidebarOrder: 2,
    category: 'core',
  },
  {
    id: 'battles',
    title: 'Battle Arena',
    subtitle: 'PVP COMBAT',
    desc: 'Engage in strategic battles and prove your trainer skills',
    href: '/user/pvp',
    image:
      'https://i.pinimg.com/originals/b0/72/8b/b0728b016e209431b2015d623fe93f3c.gif',
    icon: '⚔️',
    lucideIcon: Swords,
    stats: { value: '3', label: 'Pending' },
    bgGradient: 'from-red-400/20 via-pink-500/20 to-purple-500/20',
    borderGradient: 'from-red-400 to-pink-500',
    glowColor: 'shadow-red-500/30',
    showInSidebar: true,
    sidebarOrder: 3,
    category: 'social',
  },
  {
    id: 'gems',
    title: 'Gem Shop',
    subtitle: 'PREMIUM STORE',
    desc: 'Purchase rare gems and unlock exclusive premium features',
    href: '/user/buy-gems',
    image: 'https://media.tenor.com/Pgfwt7YefwoAAAAM/pokemon-center.gif',
    icon: '💎',
    lucideIcon: Gem,
    stats: { value: '50%', label: 'Bonus Sale' },
    bgGradient: 'from-purple-400/20 via-violet-500/20 to-indigo-500/20',
    borderGradient: 'from-purple-400 to-violet-500',
    glowColor: 'shadow-purple-500/30',
    showInSidebar: true,
    sidebarOrder: 6,
    category: 'commerce',
  },
  {
    id: 'leaderboard',
    title: 'Hall of Fame',
    subtitle: 'RANKINGS',
    desc: 'Climb the global leaderboard and earn legendary status',
    href: '/user/leaderboard',
    image:
      'https://media.tenor.com/6gOylbibnTcAAAAM/pokemon-the-pokemon-company.gif',
    icon: '🏆',
    lucideIcon: Trophy,
    stats: { value: '#47', label: 'Your Rank' },
    bgGradient: 'from-yellow-400/20 via-amber-500/20 to-orange-500/20',
    borderGradient: 'from-yellow-400 to-amber-500',
    glowColor: 'shadow-yellow-500/30',
    showInSidebar: true, // Not in sidebar, only in features grid
    sidebarOrder: 5,
    category: 'social',
  },
  {
    id: 'merchandise',
    title: 'Merchandise Store',
    subtitle: 'APPAREL & PHYSICAL PACKS',
    desc: 'Shop exclusive clothing, physical card packs, and collectibles with digital rewards',
    href: '/user/merchandise',
    image: 'https://64.media.tumblr.com/tumblr_mcl3pf2ZC81rsc51fo1_500.gif',
    icon: '🛍️',
    lucideIcon: ShoppingBag,
    stats: { value: 'NEW', label: 'Launch Sale' },
    bgGradient: 'from-pink-400/20 via-rose-500/20 to-purple-500/20',
    borderGradient: 'from-pink-400 to-rose-500',
    glowColor: 'shadow-pink-500/30',
    showInSidebar: true,
    sidebarOrder: 7,
    category: 'commerce',
  },
];

// Helper functions to get features for different components
export const getFeaturesForSidebar = () =>
  FEATURES_CONFIG.filter((feature) => feature.showInSidebar)
    .sort((a, b) => a.sidebarOrder - b.sidebarOrder)
    .map((feature) => ({
      href: feature.href,
      label:
        feature.title === 'Dashboard'
          ? 'Home'
          : feature.title.replace(' Store', '').replace(' Shop', ''),
      icon: feature.lucideIcon,
    }));

export const getFeaturesForGrid = () =>
  FEATURES_CONFIG.filter((feature) => feature.id !== 'home'); // Exclude home from features grid

export const getFeatureById = (id: string) =>
  FEATURES_CONFIG.find((feature) => feature.id === id);

export const getFeaturesByCategory = (category: Feature['category']) =>
  FEATURES_CONFIG.filter((feature) => feature.category === category);

// Easy way to add new features
export const addNewFeature = (feature: Omit<Feature, 'sidebarOrder'>) => {
  const maxOrder = Math.max(
    ...FEATURES_CONFIG.filter((f) => f.showInSidebar).map((f) => f.sidebarOrder)
  );
  const newFeature: Feature = {
    ...feature,
    sidebarOrder: feature.showInSidebar ? maxOrder + 1 : 0,
  };
  FEATURES_CONFIG.push(newFeature);
  return newFeature;
};
