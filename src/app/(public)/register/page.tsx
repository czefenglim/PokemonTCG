"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pokemonSprite, setPokemonSprite] = useState("");
  const [pokemonSprite2, setPokemonSprite2] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [confirmWalletAddress, setConfirmWalletAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [country, setCountry] = useState("");
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const avatars = [
    "https://i.pinimg.com/564x/59/40/1c/59401cad1047716d7a916cae339dbf6b.jpg", // Ash
    "https://preview.redd.it/put-my-avatar-in-a-misty-costume-for-halloween-v0-ewqonnongywd1.jpg?width=640&crop=smart&auto=webp&s=4e087c62f463302167a9199e38ea368d9e878485", // Misty
    "https://imagedelivery.net/LBWXYQ-XnKSYxbZ-NuYGqQ/fee497b1-bf1e-44d0-b99c-ab256e6b8d00/avatarhd", // Brock
    "https://cdn.costumewall.com/wp-content/uploads/2016/10/serena-pokemon-costume.jpg", // Serena
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsX070csr2Qhcc4sIfOG5M6L8zLiAExUA6vA&s", // Gary
    "https://i.pinimg.com/736x/64/68/8d/64688d41df504d52071fd84852356ecb.jpg", // Professor Oak
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1BL3FlC2xopRJ43DV2hCy1VtkPqS0eGKtIw&s", // Nurse Joy
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5ymgO-66nRZS9gcstj6Dp5ayW61hRTnIu-w&s", // Meow meow
    "https://image1.gamme.com.tw/news2/2016/05/77/qZqYnaSYk6Kap6Q.jpg", // Musashi
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIwG39-AGz0YIc4wZsP-Y65yiBzXYS-H43dA&s", // James
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRH_keIoiDLL1bfJF2ZGTvFA6BvTvneJIFWAdafOurP_3qxj9qmWnoZIqMT97bnZtlkJU&usqp=CAU", // Wobbuffet
  ];

  const router = useRouter();

  // State for client-side only animations
  const [mounted, setMounted] = useState(false);
  const [orbs, setOrbs] = useState<React.CSSProperties[]>([]);
  const [cards, setCards] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * avatars.length);
    setAvatarUrl(avatars[randomIndex]);
  }, []);

  useEffect(() => {
    // Set mounted to true after component mounts
    setMounted(true);

    // Generate random pokemon IDs
    const id1 = Math.floor(Math.random() * 151) + 1;
    let id2;
    do {
      id2 = Math.floor(Math.random() * 151) + 1;
    } while (id2 === id1);

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
        console.error("Failed to fetch Pokemon sprites:", error);
      });

    // Generate random styles only on client side
    // Energy orbs
    const orbStyles = Array.from({ length: 15 }).map((_, i) => ({
      width: `${Math.random() * 20 + 8}px`,
      height: `${Math.random() * 20 + 8}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      background: [
        "radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,140,0,0.4) 50%, transparent)",
        "radial-gradient(circle, rgba(30,144,255,0.8) 0%, rgba(0,191,255,0.4) 50%, transparent)",
        "radial-gradient(circle, rgba(50,205,50,0.8) 0%, rgba(0,255,127,0.4) 50%, transparent)",
        "radial-gradient(circle, rgba(255,20,147,0.8) 0%, rgba(255,69,0,0.4) 50%, transparent)",
        "radial-gradient(circle, rgba(138,43,226,0.8) 0%, rgba(75,0,130,0.4) 50%, transparent)",
      ][i % 5],
      animationDelay: `${Math.random() * 4}s`,
      animationDuration: `${Math.random() * 6 + 4}s`,
    }));
    setOrbs(orbStyles);

    // TCG Cards
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

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          walletAddress,
          profilePicture: avatarUrl,
          country, // This is already included in your code
        }),
      });

      let data: any = {};

      try {
        data = await res.clone().json();
      } catch (err) {
        console.warn("Failed to parse JSON body");
      }

      if (!res.ok) {
        setError(data?.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      alert("Registration successful!");
      router.push("/login");
    } catch (err) {
      console.error("Network or server error:", err);
      setError("Something went wrong while registering.");
      setLoading(false);
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
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5),
              0 0 40px rgba(239, 68, 68, 0.3), 0 0 60px rgba(239, 68, 68, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8),
              0 0 60px rgba(239, 68, 68, 0.5), 0 0 90px rgba(239, 68, 68, 0.3);
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
        .holographic-bg {
          background: linear-gradient(
            135deg,
            rgba(255, 215, 0, 0.1) 0%,
            rgba(255, 20, 147, 0.1) 25%,
            rgba(0, 191, 255, 0.1) 50%,
            rgba(50, 205, 50, 0.1) 75%,
            rgba(255, 215, 0, 0.1) 100%
          );
          background-size: 200% 200%;
          animation: card-shine 4s ease-in-out infinite;
        }
        .tcg-card-border {
          border-image: linear-gradient(
              45deg,
              #ffd700,
              #ff6b6b,
              #4ecdc4,
              #45b7d1,
              #ffd700
            )
            1;
          border-width: 2px;
          border-style: solid;
        }
        .energy-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle, #ffd700, transparent);
          border-radius: 50%;
          animation: energy-orb 3s ease-in-out infinite;
        }
      `}</style>

      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 via-blue-900 to-indigo-900 overflow-hidden relative py-8">
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
                  className="absolute w-8 h-12 bg-gradient-to-b from-yellow-400/20 to-red-500/20 rounded-lg animate-float-slow tcg-card-border"
                  style={style}
                />
              ))}

              {/* Lightning Effects - Static positions to avoid hydration issues */}
              <div
                className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-yellow-400 to-transparent animate-lightning"
                style={{
                  top: "20%",
                  left: "15%",
                  animationDelay: "0s",
                  transform: "rotate(-15deg)",
                }}
              />
              <div
                className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-yellow-400 to-transparent animate-lightning"
                style={{
                  top: "40%",
                  left: "50%",
                  animationDelay: "1s",
                  transform: "rotate(10deg)",
                }}
              />
              <div
                className="absolute w-1 h-32 bg-gradient-to-b from-transparent via-yellow-400 to-transparent animate-lightning"
                style={{
                  top: "30%",
                  left: "85%",
                  animationDelay: "2s",
                  transform: "rotate(-20deg)",
                }}
              />
            </>
          )}
        </div>

        {/* Enhanced Floating Pokemon with Glow Effects */}
        {mounted && pokemonSprite && (
          <div className="absolute top-1/4 left-1/4 w-36 h-36 animate-float-slow">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse"></div>
              <img
                src={pokemonSprite}
                alt="Random Pokemon"
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
                className="absolute inset-0 bg-blue-400/30 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: "1s" }}
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
        <div className="relative z-10 w-full max-w-md mx-4 my-8">
          {/* Decorative Pokeball Elements with Enhanced Effects */}
          <div className="absolute -top-10 -left-10 w-20 h-20 opacity-40 animate-spin-slow">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-red-500/30 rounded-full blur-lg animate-pulse"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-full border-4 border-white/30">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-black/50"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-black/30"></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 opacity-40 animate-spin-slower">
            <div className="relative w-full h-full">
              <div
                className="absolute inset-0 bg-blue-500/30 rounded-full blur-lg animate-pulse"
                style={{ animationDelay: "2s" }}
              ></div>
              <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-full border-4 border-white/30">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-black/50"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full border-2 border-black/30"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-blue-500/20 rounded-3xl blur-2xl animate-glow-pulse"></div>

          {/* Enhanced Form Card */}
          <form
            onSubmit={handleSubmit}
            className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden p-8 holographic-bg"
          >
            {/* Enhanced Top Decorative Strip */}
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-600 via-yellow-500 via-white via-yellow-500 to-red-600"></div>
            <div className="absolute top-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>

            {/* Enhanced Logo Section */}
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative bg-gray-800/90 rounded-full p-4 border border-yellow-500/30">
                  <div className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
                    ⚡ TCG ⚡
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-white mb-6 flex items-center justify-center">
              <span className="bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 bg-clip-text text-transparent">
                Trainer Registration
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

            {/* Avatar Selection */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg cursor-pointer transition-all duration-300 hover:border-yellow-300 hover:shadow-yellow-500/50"
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                >
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="Trainer Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full transition-opacity duration-300">
                    <svg
                      className="w-8 h-8 text-yellow-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-sm text-yellow-400 font-medium">
                Click to change avatar
              </p>

              {/* Avatar Selector Modal */}
              {showAvatarSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                  <div className="relative bg-gray-800 rounded-2xl border border-yellow-500/30 shadow-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-yellow-400">
                        Choose Your Trainer Avatar
                      </h3>
                      <button
                        onClick={() => setShowAvatarSelector(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg
                          className="w-6 h-6"
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
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {avatars.map((avatar, index) => (
                        <div
                          key={index}
                          className={`relative rounded-full border-4 cursor-pointer transition-all duration-200 ${
                            avatarUrl === avatar
                              ? "border-yellow-400 scale-105"
                              : "border-transparent hover:border-yellow-300 hover:scale-105"
                          }`}
                          onClick={() => {
                            setAvatarUrl(avatar);
                            setShowAvatarSelector(false);
                          }}
                        >
                          <img
                            src={avatar}
                            alt={`Avatar ${index}`}
                            className="w-full h-full rounded-full object-cover aspect-square"
                          />
                          {avatarUrl === avatar && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                              <svg
                                className="w-8 h-8 text-yellow-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => setShowAvatarSelector(false)}
                        className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-bold rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300"
                      >
                        Confirm Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Enhanced Input Fields */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded flex items-center justify-center">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  Trainer Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your legendary trainer name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-300 backdrop-blur-sm group-hover:border-gray-500/70"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-500/0 to-yellow-500/0 group-focus-within:from-yellow-500/10 group-focus-within:to-orange-500/10 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
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
                    placeholder="trainer@pokemon-tcg.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm group-hover:border-gray-500/70"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-blue-500/0 group-focus-within:from-blue-500/10 group-focus-within:to-cyan-500/10 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 bg-gradient-to-r from-teal-400 to-green-500 rounded flex items-center justify-center">
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
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  Country
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 backdrop-blur-sm group-hover:border-gray-500/70 appearance-none"
                    required
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="JP">Japan</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="BR">Brazil</option>
                    <option value="IN">India</option>
                    <option value="SG">Singapore</option>
                    <option value="SG">Malaysia</option>
                    {/* Add more countries as needed */}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-500/0 to-teal-500/0 group-focus-within:from-teal-500/10 group-focus-within:to-green-500/10 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
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
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 backdrop-blur-sm group-hover:border-gray-500/70"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 to-green-500/0 group-focus-within:from-green-500/10 group-focus-within:to-emerald-500/10 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded flex items-center justify-center">
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 backdrop-blur-sm group-hover:border-gray-500/70"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 to-purple-500/0 group-focus-within:from-purple-500/10 group-focus-within:to-pink-500/10 transition-all duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 bg-gradient-to-r from-indigo-400 to-blue-500 rounded flex items-center justify-center">
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
                        d="M12 11c0-1.104.896-2 2-2h4a2 2 0 110 4h-4a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  Wallet Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0xYourWalletHere"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
                  <div className="w-5 h-5 mr-2 bg-gradient-to-r from-indigo-400 to-blue-500 rounded flex items-center justify-center">
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
                        d="M12 11c0-1.104.896-2 2-2h4a2 2 0 110 4h-4a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  Confirm Wallet Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0xYourWalletHere"
                    value={confirmWalletAddress}
                    onChange={(e) => setConfirmWalletAddress(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-800/90 border-2 border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 backdrop-blur-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-6 py-4 px-6 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 hover:from-red-500 hover:via-yellow-400 hover:to-red-500 text-white font-bold rounded-xl shadow-2xl transition-all duration-300 flex items-center justify-center text-lg border-2 border-yellow-400/30 backdrop-blur-sm relative overflow-hidden group ${
                loading
                  ? "opacity-80 cursor-not-allowed"
                  : "hover:shadow-yellow-500/25 transform hover:-translate-y-1 hover:scale-105"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {loading ? (
                <>
                  <div className="w-6 h-6 mr-3 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="relative z-10">Catching Your Data...</span>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 mr-3 bg-gradient-to-br from-red-500 to-red-700 rounded-full border-2 border-white/50 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black/50"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full border border-black/30"></div>
                  </div>
                  <span className="relative z-10">
                    ⚡ Begin Your TCG Journey ⚡
                  </span>
                </>
              )}
            </button>

            {/* Enhanced Footer */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-300">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-transparent bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text font-bold hover:from-yellow-300 hover:to-red-400 transition-all duration-300 hover:underline"
                >
                  Continue Your Adventure →
                </a>
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
