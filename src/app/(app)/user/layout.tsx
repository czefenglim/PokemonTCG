import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ClientLayout from '@/features/user/app-shell/layout/ClientLayout';
import GlobalClickSound from '@/features/public/shared/ui/GlobalClickSound';
import AnimatedBackground from '@/features/user/app-shell/components/background/AnimatedBackground';

import { MusicProvider } from '@/features/user/music/contexts/MusicContext';
import { GemProvider } from '@/features/user/buy-gems/contexts/GemContext';
import AuthenticatedMusicStarter from '@/features/user/app-shell/components/music/AuthenticatedMusicStarter';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pokémon TCG - Trainer Area',
  description: 'User dashboard for Pokémon TCG',
};

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MusicProvider>
      <GemProvider>
        <AuthenticatedMusicStarter />

        <div
          className={`${geistSans.variable} ${geistMono.variable} antialiased relative z-10`}
        >
          <AnimatedBackground variant="default" intensity="medium" particles />
          <GlobalClickSound />
          <ClientLayout>{children}</ClientLayout>
        </div>
      </GemProvider>
    </MusicProvider>
  );
}
