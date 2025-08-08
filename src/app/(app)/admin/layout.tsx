import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import SessionWrapper from '@/components/SessionWrapper';
import GlobalClickSound from '@/components/GlobalClickSound';
import AnimatedBackground from '@/components/AnimatedBackground';
import AdminSidebar from '@/components/admin/AdminSidebar';

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
    <div className={`min-h-screen ${geistSans.variable} ${geistMono.variable}`}>
      {/* Background and Global Components */}
      <AnimatedBackground
        variant="default"
        intensity="medium"
        particles={true}
      />
      <GlobalClickSound />

      <SessionWrapper>
        {/* Admin Layout Container */}
        <div className="relative z-10 flex min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">
            {/* Content Container with proper spacing for mobile */}
            <div className="w-full h-full lg:ml-0 pt-16 lg:pt-0">
              {/* Mobile top spacing for menu button */}
              <div className="w-full h-full overflow-auto">{children}</div>
            </div>
          </main>
        </div>
      </SessionWrapper>
    </div>
  );
}
