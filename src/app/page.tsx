'use client';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-yellow-200 to-yellow-300 relative overflow-hidden p-4">
      {/* Decorative background Pokeball */}
      <img
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
        alt="Pokeball"
        className="absolute opacity-10 w-96 h-96 top-10 right-10 rotate-12"
      />

      {/* Hero section */}
      <div className="relative z-10 max-w-2xl text-center space-y-6">
        <img
          src="https://1000logos.net/wp-content/uploads/2017/05/Pokemon-Logo.png"
          alt="Pokemon Logo"
          className="mx-auto w-60 drop-shadow-lg"
        />
        <h1 className="text-3xl md:text-5xl font-extrabold text-red-500 drop-shadow-sm">
          Welcome to the Pokémon TCG!
        </h1>
        <p className="text-gray-700 text-lg md:text-xl">
          Collect, trade, and battle your favorite Pokémon cards online.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/login">
            <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-full shadow-md transition">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-full shadow-md transition">
              Register
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
