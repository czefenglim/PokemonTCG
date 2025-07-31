'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [orbs, setOrbs] = useState<React.CSSProperties[]>([]);
  const [particles, setParticles] = useState<React.CSSProperties[]>([]);
  const [cards, setCards] = useState<React.CSSProperties[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pokemonSprite, setPokemonSprite] = useState('');
  const [pokemonSprite2, setPokemonSprite2] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Set mounted to true after component mounts
    setMounted(true);

    // Generate random pokemon IDs
    const id1 = Math.floor(Math.random() * 151) + 1;
    const id2 = Math.floor(Math.random() * 151) + 1;

    // Fetch Pokemon sprites
    Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id1}`).then((res) =>
        res.json()
      ),
      fetch(`https://pokeapi.co/api/v2/pokemon/${id2}`).then((res) =>
        res.json()
      ),
    ])
      .then(([data1, data2]) => {
        setPokemonSprite(data1.sprites.front_default);
        setPokemonSprite2(data2.sprites.front_default);
      })
      .catch((error) => {
        console.error('Failed to fetch Pokemon sprites:', error);
      });

    // Generate random styles only on client side
    // Energy orbs
    const orbStyles = Array.from({ length: 15 }).map((_, i) => ({
      width: `${Math.random() * 20 + 8}px`,
      height: `${Math.random() * 20 + 8}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${Math.random() * 6 + 4}s`,
      background: [
        'radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0.4) 50%, transparent)',
        'radial-gradient(circle, rgba(147,51,234,0.8) 0%, rgba(126,34,206,0.4) 50%, transparent)',
        'radial-gradient(circle, rgba(236,72,153,0.8) 0%, rgba(219,39,119,0.4) 50%, transparent)',
        'radial-gradient(circle, rgba(34,197,94,0.8) 0%, rgba(22,163,74,0.4) 50%, transparent)',
        'radial-gradient(circle, rgba(245,158,11,0.8) 0%, rgba(217,119,6,0.4) 50%, transparent)',
      ][i % 5],
    }));
    setOrbs(orbStyles);

    // Particles
    const generated = Array.from({ length: 20 }).map((_, i) => ({
      width: `${Math.random() * 15 + 5}px`,
      height: `${Math.random() * 15 + 5}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 20 + 10}s`,
      animationDelay: `${Math.random() * 5}s`,
      background:
        i % 2 === 0
          ? 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,0,0,0.5) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(0,0,255,0.5) 50%, transparent 70%)',
    }));
    setParticles(generated);

    // Cards
    const cardStyles = Array.from({ length: 8 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 10}s`,
      animationDuration: `${Math.random() * 15 + 20}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }));
    setCards(cardStyles);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      setLoading(false);

      if (result?.error) {
        setError('Invalid email or password.');
        return;
      }

      if (result?.ok) {
        const session = await getSession();
        const role = session?.user?.role;

        // Only access localStorage after successful login
        if (typeof window !== 'undefined') {
          localStorage.setItem('shouldAutoPlayMusic', 'true');
        }

        if (role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/user/home');
        }
      }
    } catch (error) {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          33% {
            transform: translateY(-20px) rotate(120deg);
          }
          66% {
            transform: translateY(-10px) rotate(240deg);
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) scale(1);
          }
          25% {
            transform: translateY(-15px) translateX(10px) scale(1.05);
          }
          50% {
            transform: translateY(-25px) translateX(-5px) scale(0.95);
          }
          75% {
            transform: translateY(-10px) translateX(15px) scale(1.02);
          }
        }
        @keyframes float-slower {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) translateX(20px) rotate(180deg);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-slower {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes glow-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5),
              0 0 40px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(59, 130, 246, 0.8),
              0 0 60px rgba(59, 130, 246, 0.5), 0 0 90px rgba(59, 130, 246, 0.3);
          }
        }
        @keyframes card-shine {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes energy-orb {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
          }
        }
        @keyframes lightning {
          0%,
          90%,
          100% {
            opacity: 0;
          }
          5%,
          10% {
            opacity: 1;
          }
        }
        @keyframes welcome-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        .animate-float {
          animation: float 15s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 20s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 25s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
        }
        .animate-spin-slower {
          animation: spin-slower 45s linear infinite;
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .animate-card-shine {
          animation: card-shine 3s ease-in-out infinite;
        }
        .animate-energy-orb {
          animation: energy-orb 4s ease-in-out infinite;
        }
        .animate-lightning {
          animation: lightning 2s infinite;
        }
        .animate-welcome-pulse {
          animation: welcome-pulse 2s ease-in-out infinite;
        }
        .holographic-bg {
          background: linear-gradient(
            135deg,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(147, 51, 234, 0.1) 25%,
            rgba(236, 72, 153, 0.1) 50%,
            rgba(34, 197, 94, 0.1) 75%,
            rgba(59, 130, 246, 0.1) 100%
          );
          background-size: 200% 200%;
          animation: card-shine 4s ease-in-out infinite;
        }
        .tcg-card-border {
          border-image: linear-gradient(
              45deg,
              #3b82f6,
              #8b5cf6,
              #ec4899,
              #22c55e,
              #3b82f6
            )
            1;
          border-width: 2px;
          border-style: solid;
        }
        .energy-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, #3b82f6, transparent);
          border-radius: 50%;
          animation: energy-orb 3s ease-in-out infinite;
        }
      `}</style>

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 via-purple-900 to-indigo-900 overflow-hidden relative">
        {/* Enhanced Dynamic Background with TCG Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Only render animated elements after mount to prevent hydration errors */}
          {mounted && (
            <>
              {/* Energy Orbs */}
              {orbs.map((style, i) => (
                <div
                  key={`orb-${i}`}
                  className="absolute rounded-full animate-energy-orb"
                  style={style}
                />
              ))}

              {/* TCG Card Particles */}
              {cards.map((style, i) => (
                <div
                  key={`card-${i}`}
                  className="absolute w-8 h-12 bg-gradient-to-b from-blue-400/20 to-purple-500/20 rounded-lg animate-float-slow tcg-card-border"
                  style={style}
                />
              ))}

              {/* Lightning Effects - Static positions to avoid hydration issues */}
              <div
                className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-lightning"
                style={{
                  top: '20%',
                  left: '10%',
                  animationDelay: '0s',
                  transform: 'rotate(-15deg)',
                }}
              />
              <div
                className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-lightning"
                style={{
                  top: '40%',
                  left: '50%',
                  animationDelay: '1s',
                  transform: 'rotate(10deg)',
                }}
              />
              <div
                className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-lightning"
                style={{
                  top: '30%',
                  left: '80%',
                  animationDelay: '2s',
                  transform: 'rotate(-20deg)',
                }}
              />

              {/* Original animated particles */}
              {particles.map((style, i) => (
                <div
                  key={`particle-${i}`}
                  className="absolute rounded-full bg-white/10 animate-float"
                  style={style}
                />
              ))}
            </>
          )}
        </div>

        {/* Enhanced Floating Pokemon with Glow Effects */}
        {mounted && pokemonSprite && (
          <div className="absolute top-1/4 left-1/4 w-36 h-36 animate-float-slow">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl animate-pulse"></div>
              <img
                src={pokemonSprite}
                alt="Random Pokemon 1"
                className="relative w-full h-full object-contain drop-shadow-2xl filter brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-full"></div>
            </div>
          </div>
        )}
        {mounted && pokemonSprite2 && (
          <div className="absolute bottom-1/4 right-1/4 w-28 h-28 animate-float-slower">
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0 bg-purple-400/30 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: '1s' }}
              ></div>
              <img
                src={pokemonSprite2}
                alt="Random Pokemon 2"
                className="relative w-full h-full object-contain drop-shadow-2xl filter brightness-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Enhanced Main Card Container */}
        <div className="relative z-10 w-full max-w-md mx-4">
          {/* Decorative Pokeball Elements with Enhanced Effects */}
          <div className="absolute -top-10 -left-10 w-20 h-20 opacity-40 animate-spin-slow">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-full border-4 border-white/30">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-black/50"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-black/30"></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 opacity-40 animate-spin-slower">
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0 bg-purple-500/30 rounded-full blur-lg animate-pulse"
                style={{ animationDelay: '2s' }}
              ></div>
              <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 rounded-full border-4 border-white/30">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-black/50"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-2 border-black/30"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl animate-glow-pulse"></div>

          {/* Enhanced Form Card */}
          <form
            onSubmit={handleSubmit}
            className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden p-8 holographic-bg"
          >
            {/* Enhanced Top Decorative Strip */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-blue-600 via-purple-500 via-white via-purple-500 to-blue-600"></div>
            <div className="absolute top-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

            {/* Enhanced Logo Section */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative bg-gray-800/90 rounded-full p-4 border border-blue-500/30">
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 bg-clip-text text-transparent animate-welcome-pulse">
                    ⚡ TCG ⚡
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-white mb-8 flex items-center justify-center">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 bg-clip-text text-transparent">
                Welcome Back, Trainer
              </span>
              <span className="ml-3 text-2xl animate-pulse">✦</span>
            </h2>

            {/* Enhanced Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/60 border-2 border-red-500/70 rounded-xl text-red-100 text-sm flex items-center backdrop-blur-sm">
                <div className="flex-shrink-0 w-6 h-6 mr-3 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div className="flex-1">{error}</div>
              </div>
            )}

            <div className="space-y-6">
              {/* Enhanced Email Field */}
              <div className="group">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-200 mb-2 flex items-center"
                >
                  <div className="w-5 h-5 mr-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    placeholder="trainer@pokemon-tcg.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm group-hover:border-gray-500/70"
                    required
                  />
                </div>
              </div>

              {/* Enhanced Password Field */}
              <div className="group">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-200 mb-2 flex items-center"
                >
                  <div className="w-5 h-5 mr-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 pr-16 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 backdrop-blur-sm group-hover:border-gray-500/70"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 text-sm text-yellow-400 hover:text-yellow-300 font-medium transition-colors duration-200 bg-gray-700/50 px-2 py-1 rounded backdrop-blur-sm"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 to-green-500/0 group-focus-within:from-green-500/10 group-focus-within:to-emerald-500/10 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-8 py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 hover:from-blue-500 hover:via-purple-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-2xl transition-all duration-300 flex items-center justify-center text-lg border-2 border-blue-400/30 backdrop-blur-sm relative overflow-hidden group ${
                loading
                  ? 'opacity-80 cursor-not-allowed'
                  : 'hover:shadow-blue-500/25 transform hover:-translate-y-1 hover:scale-105'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <>
                  <div className="w-6 h-6 mr-3 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="relative z-10">Signing in...</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 mr-3 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full border-2 border-white/50 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black/50"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full border border-black/30"></div>
                  </div>
                  <span className="relative z-10">⚡ Enter the Arena ⚡</span>
                </>
              )}
            </button>

            {/* Enhanced Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-300">
                Don&apos;t have an account?{' '}
                <a
                  href="/register"
                  className="text-transparent bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text font-bold hover:from-blue-300 hover:to-purple-400 transition-all duration-300 hover:underline"
                >
                  Join the Adventure →
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
