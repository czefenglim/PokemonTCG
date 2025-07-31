import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import ClientLayout from '@/components/ClientLayout';
import GlobalClickSound from '@/components/GlobalClickSound';
import AnimatedBackground from '@/components/AnimatedBackground';

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
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased relative z-10`}
    >
      <AnimatedBackground variant="default" intensity="medium" particles />
      <GlobalClickSound />
      <ClientLayout>{children}</ClientLayout>
    </div>
  );
}
