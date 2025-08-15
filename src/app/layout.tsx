// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import SessionWrapper from '@/features/auth/providers/SessionWrapper';
import Web3Provider from '@/features/user/web3/components/Web3Provider';

export const metadata: Metadata = {
  title: 'Pokémon TCG',
  description: 'Blockchain-powered Pokémon TCG',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionWrapper>
          <Web3Provider>{children}</Web3Provider>
        </SessionWrapper>
      </body>
    </html>
  );
}
