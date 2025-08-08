"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true); // Start loading

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/home",
    });

    setLoading(false); // Stop loading

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    if (result?.url) {
      router.push(result.url);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Multiple Pokémon cards */}
      <img
        src="https://images.pokemontcg.io/base1/4.png"
        alt="Charizard Card"
        className="absolute w-52 top-8 left-8 rotate-6"
      />
      <img
        src="https://images.pokemontcg.io/base1/58.png"
        alt="Pikachu Card"
        className="absolute w-52 bottom-8 left-16 -rotate-6"
      />
      <img
        src="https://images.pokemontcg.io/base1/2.png"
        alt="Blastoise Card"
        className="absolute w-52 top-24 right-12 rotate-3"
      />
      <img
        src="https://images.pokemontcg.io/base1/15.png"
        alt="Venusaur Card"
        className="absolute w-52 bottom-20 right-16 -rotate-3"
      />
      <img
        src="https://images.pokemontcg.io/base1/5.png"
        alt="Clefairy Card"
        className="absolute w-52 top-1/2 left-100 rotate-12"
      />
      <img
        src="https://images.pokemontcg.io/base1/7.png"
        alt="Squirtle Card"
        className="absolute w-52 top-1/4 right-1/4 -rotate-12"
      />

      {/* No dark overlay */}
      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md bg-white/20 border border-yellow-400 backdrop-blur-md rounded-3xl shadow-2xl p-8 flex flex-col gap-6 transform transition hover:scale-105"
      >
        <div className="flex flex-col items-center gap-2">
          <img
            src="https://1000logos.net/wp-content/uploads/2017/05/Pokemon-Logo.png"
            alt="Pokemon Logo"
            className="w-48 drop-shadow-lg"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-yellow-300 drop-shadow-sm">
            Trainer Login
          </h1>
        </div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />

        {/* Show error here */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`bg-yellow-500 text-white px-4 py-2 rounded ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-xs text-yellow-200 text-center">
          Don&apos;t have an account?{" "}
          <a href="/register" className="underline">
            Register here
          </a>
        </p>
      </form>
    </main>
  );
}
