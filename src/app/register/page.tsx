"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirmWalletAddress, setConfirmWalletAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!walletAddress.trim()) {
      setError("Wallet address is required.");
      return;
    }

    if (walletAddress !== confirmWalletAddress) {
      setError("Wallet addresses do not match!");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, walletAddress }),
    });

    setLoading(false);

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    alert("Registration successful!");
    router.push("/login");
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* Background Pokémon cards */}
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
            Trainer Registration
          </h1>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />

        <input
          type="text"
          placeholder="MetaMask Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />

        <input
          type="text"
          placeholder="Confirm Wallet Address"
          value={confirmWalletAddress}
          onChange={(e) => setConfirmWalletAddress(e.target.value)}
          className="text-white placeholder-yellow-200 border border-yellow-300 p-3 rounded-lg bg-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />

        <button
          type="submit"
          disabled={loading}
          className={`bg-yellow-500 text-gray-900 font-semibold py-2 rounded-full ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-xs text-yellow-200 text-center">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Login here
          </a>
        </p>
      </form>
    </main>
  );
}
