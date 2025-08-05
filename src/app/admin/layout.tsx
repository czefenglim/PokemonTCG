import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import GlobalClickSound from '@/components/GlobalClickSound';
import AnimatedBackground from '@/components/AnimatedBackground';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'Admin management for Pokémon TCG',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AnimatedBackground
        variant="default"
        intensity="medium"
        particles={true}
      />
      <GlobalClickSound />
      <SessionWrapper>
        <main className="relative z-10">{children}</main>
      </SessionWrapper>
    </div>
  );
}
