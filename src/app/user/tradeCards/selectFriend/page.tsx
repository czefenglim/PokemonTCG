"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { UserPlus, Users, Search, ArrowRight, Sparkles } from "lucide-react";

export default function SelectFriendPage() {
  const [friendList, setFriendList] = useState<any[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const router = useRouter();

  const handleTradeClick = (walletAddress: string, username: string) => {
    setSelectedFriend(username);
    setTimeout(() => {
      router.push(`/user/tradeCards/selectCard?friendWallet=${walletAddress}`);
    }, 500);
  };

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch("/api/friends/getFriendList");
        if (!res.ok) throw new Error("Failed to fetch friend list");
        const data = await res.json();
        setFriendList(data);
        setFilteredFriends(data);
      } catch (error) {
        console.error("Error fetching friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  useEffect(() => {
    const filtered = friendList.filter((friend) =>
      friend.friend?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFriends(filtered);
  }, [searchTerm, friendList]);

  const getRandomColor = (index: number) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-emerald-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-pink-500 to-rose-500",
      "from-cyan-500 to-blue-500",
      "from-teal-500 to-emerald-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 py-12 px-6 text-white">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl mb-6">
              <Users className="w-6 h-6 text-purple-400" />
              <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="text-purple-300 font-semibold">
                Friend Selection
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in">
              Choose Your Trading Partner
            </h1>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Select a friend from your network to start an exciting NFT card
              trade
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mt-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 backdrop-blur-xl border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-400 shadow-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-4 mb-6">
                  <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                  <p className="text-xl text-slate-300 font-semibold">
                    Loading your friend network...
                  </p>
                </div>
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <UserPlus className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-300 mb-4">
                  {searchTerm ? "No friends found" : "No friends yet"}
                </h3>
                <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? `No friends match "${searchTerm}". Try a different search term.`
                    : "Start building your trading network by adding friends to unlock amazing card exchanges!"}
                </p>
                {!searchTerm && (
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                    Add Your First Friend
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    Your Trading Network
                  </h2>
                  <p className="text-slate-400">
                    {filteredFriends.length} friend
                    {filteredFriends.length !== 1 ? "s" : ""} available for
                    trading
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFriends.map((friend, index) => (
                    <div
                      key={index}
                      className={`group relative bg-gradient-to-br from-slate-700/20 to-slate-600/20 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-white/30 ${
                        selectedFriend === friend.friend?.username
                          ? "ring-4 ring-purple-500 scale-105"
                          : ""
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Gradient Background Effect */}
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r ${getRandomColor(
                          index
                        )} rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-1000 group-hover:duration-200`}
                      ></div>

                      <div className="relative z-10">
                        {/* Avatar */}
                        <div
                          className={`w-20 h-20 bg-gradient-to-r ${getRandomColor(
                            index
                          )} rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300`}
                        >
                          <span className="text-2xl font-bold text-white">
                            {friend.friend?.username?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>

                        {/* Friend Info */}
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                            {friend.friend?.username || "Unnamed Trader"}
                          </h3>
                          <p className="text-slate-400 text-sm font-mono bg-slate-800/50 px-3 py-1 rounded-lg inline-block">
                            {friend.friend?.walletAddress
                              ? `${friend.friend.walletAddress.slice(
                                  0,
                                  6
                                )}...${friend.friend.walletAddress.slice(-4)}`
                              : "No wallet"}
                          </p>
                        </div>

                        {/* Trade Button */}
                        <button
                          onClick={() =>
                            handleTradeClick(
                              friend.friend?.walletAddress,
                              friend.friend?.username
                            )
                          }
                          disabled={selectedFriend === friend.friend?.username}
                          className={`w-full bg-gradient-to-r ${getRandomColor(
                            index
                          )} text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 group-hover:gap-4 ${
                            selectedFriend === friend.friend?.username
                              ? "animate-pulse cursor-not-allowed opacity-75"
                              : "hover:shadow-purple-500/30"
                          }`}
                        >
                          {selectedFriend === friend.friend?.username ? (
                            <>
                              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                              Connecting...
                            </>
                          ) : (
                            <>
                              Start Trading
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                            </>
                          )}
                        </button>

                        {/* Status Indicator */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-semibold">
                            Available for Trading
                          </span>
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-purple-500/10 transition-all duration-500"></div>
                    </div>
                  ))}
                </div>

                {/* Stats Bar */}
                <div className="mt-12 bg-slate-700/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div className="space-y-2">
                      <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {friendList.length}
                      </div>
                      <div className="text-slate-400 font-semibold">
                        Total Friends
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {filteredFriends.length}
                      </div>
                      <div className="text-slate-400 font-semibold">
                        Available Now
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                        ∞
                      </div>
                      <div className="text-slate-400 font-semibold">
                        Trade Potential
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
