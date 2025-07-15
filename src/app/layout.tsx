import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import Web3Provider from '@/components/Web3Provider'; // ✅
import '@rainbow-me/rainbowkit/styles.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Pékemon TCG',
  description: 'Your blockchain-powered Pokémon TCG',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          <Web3Provider>{children}</Web3Provider>
        </SessionWrapper>
      </body>
    </html>
  );
}
