import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  title: 'PokéChain Admin',
  description: 'Advanced admin management for Pokémon TCG ecosystem',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`min-h-screen relative overflow-hidden ${geistSans.variable} ${geistMono.variable}`}
    >
      {/* Multi-Layer Cinematic Background */}

      {/* Base Dark Foundation */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900" />

      {/* Dynamic Color Overlays */}
      <div className="fixed inset-0 bg-gradient-to-tr from-blue-950/30 via-transparent to-purple-950/30" />
      <div className="fixed inset-0 bg-gradient-to-bl from-emerald-950/20 via-transparent to-cyan-950/20" />
      <div className="fixed inset-0 bg-gradient-to-tl from-violet-950/25 via-transparent to-indigo-950/25" />

      {/* Large Dramatic Radial Gradients */}
      <div className="fixed inset-0">
        {/* Primary Accent - Top Left */}
        <div
          className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-gradient-radial from-blue-600/15 via-blue-800/8 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />

        {/* Secondary Accent - Bottom Right */}
        <div
          className="absolute -bottom-48 -right-48 w-[700px] h-[700px] bg-gradient-radial from-purple-600/12 via-violet-800/6 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />

        {/* Tertiary Accent - Center */}
        <div
          className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-emerald-500/8 via-teal-700/4 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '15s', animationDelay: '4s' }}
        />

        {/* Quaternary Accent - Top Right */}
        <div
          className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-gradient-radial from-cyan-500/10 via-sky-700/5 to-transparent rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '6s' }}
        />
      </div>

      {/* Sophisticated Grid Patterns */}
      <div className="fixed inset-0">
        {/* Main Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Diagonal Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] rotate-45"
          style={{
            backgroundImage: `
              linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Advanced Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Large Floating Orbs */}
        <div
          className="absolute top-[5%] left-[8%] w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-600/10 blur-md animate-bounce"
          style={{ animationDuration: '20s', animationDelay: '0s' }}
        />
        <div
          className="absolute top-[15%] right-[12%] w-6 h-6 rounded-full bg-gradient-to-br from-purple-400/20 to-violet-600/10 blur-md animate-bounce"
          style={{ animationDuration: '25s', animationDelay: '5s' }}
        />
        <div
          className="absolute bottom-[20%] left-[15%] w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/15 to-teal-600/8 blur-lg animate-bounce"
          style={{ animationDuration: '30s', animationDelay: '10s' }}
        />
        <div
          className="absolute bottom-[8%] right-[8%] w-7 h-7 rounded-full bg-gradient-to-br from-pink-400/20 to-rose-600/10 blur-md animate-bounce"
          style={{ animationDuration: '22s', animationDelay: '15s' }}
        />

        {/* Medium Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${10 + i * 7}%`,
              top: `${5 + i * 8}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${4 + (i % 3)}s`,
            }}
          >
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-br ${
                i % 4 === 0
                  ? 'from-blue-400/15 to-cyan-400/8'
                  : i % 4 === 1
                  ? 'from-purple-400/15 to-violet-400/8'
                  : i % 4 === 2
                  ? 'from-emerald-400/15 to-teal-400/8'
                  : 'from-pink-400/15 to-rose-400/8'
              } blur-sm`}
            />
          </div>
        ))}

        {/* Micro Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`micro-${i}`}
            className="absolute w-1 h-1 rounded-full bg-white/10 animate-pulse blur-[0.5px]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Dynamic Light Beams */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Horizontal Beams */}
        <div
          className="absolute top-[20%] left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div
          className="absolute top-[40%] left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/15 to-transparent animate-pulse"
          style={{ animationDuration: '8s', animationDelay: '2s' }}
        />
        <div
          className="absolute top-[60%] left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '4s' }}
        />
        <div
          className="absolute bottom-[20%] left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse"
          style={{ animationDuration: '7s', animationDelay: '6s' }}
        />

        {/* Vertical Beams */}
        <div
          className="absolute top-0 left-[25%] w-px h-full bg-gradient-to-b from-transparent via-violet-400/10 to-transparent animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '1s' }}
        />
        <div
          className="absolute top-0 right-[30%] w-px h-full bg-gradient-to-b from-transparent via-indigo-400/10 to-transparent animate-pulse"
          style={{ animationDuration: '14s', animationDelay: '3s' }}
        />
      </div>

      {/* Sophisticated Noise Texture */}
      <div
        className="fixed inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Depth Layers with Parallax Effect */}
      <div className="fixed inset-0">
        {/* Far Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-slate-800/50 transform scale-110" />

        {/* Mid Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-transparent to-purple-950/20 transform scale-105" />

        {/* Near Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-bl from-emerald-950/10 via-transparent to-cyan-950/10 transform scale-102" />
      </div>

      {/* Enhanced AnimatedBackground */}
      <AnimatedBackground variant="admin" intensity="medium" particles={true} />

      <GlobalClickSound />

      <SessionWrapper>
        {/* Admin Layout Container */}
        <div className="relative z-20 flex min-h-screen">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">
            <div className="w-full h-full lg:ml-0 pt-16 lg:pt-0">
              <div className="w-full h-full overflow-auto backdrop-blur-[1px] backdrop-saturate-150">
                {children}
              </div>
            </div>
          </main>
        </div>
      </SessionWrapper>
    </div>
  );
}
