// battle/pvp/page.tsx

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { nanoid } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import abi from "@/app/lib/pokemonCardABI.json";
import pokemonList from "@/app/lib/pokemon-list.json";

type Room = {
  id: string;
  name: string;
  isPrivate: boolean;
  players: number;
  creatorId?: string;
  maxPlayers?: number;
};

type CardRarity = {
  id: string;
  name: string;
  color: string;
};

type OwnedCard = {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  amount: string;
  rarity?: string;
  type?: string;
};

const CARD_RARITIES: CardRarity[] = [
  { id: "common", name: "Common", color: "from-gray-400 to-gray-500" },
  { id: "uncommon", name: "Uncommon", color: "from-green-400 to-green-500" },
  { id: "rare", name: "Rare", color: "from-blue-400 to-blue-500" },
  { id: "rare_holo", name: "Rare Holo", color: "from-blue-500 to-cyan-500" },
  {
    id: "rare_ultra",
    name: "Rare Ultra",
    color: "from-purple-400 to-purple-600",
  },
  { id: "promo", name: "Promo", color: "from-yellow-400 to-yellow-500" },
  {
    id: "rare_holo_gx",
    name: "Rare Holo GX",
    color: "from-purple-500 to-pink-500",
  },
  { id: "rare_break", name: "Rare BREAK", color: "from-orange-400 to-red-500" },
  {
    id: "rare_holo_ex",
    name: "Rare Holo EX",
    color: "from-red-500 to-pink-500",
  },
  {
    id: "rare_rainbow",
    name: "Rare Rainbow",
    color: "from-pink-400 via-purple-500 to-blue-500",
  },
  {
    id: "rare_shiny",
    name: "Rare Shiny",
    color: "from-yellow-300 to-yellow-600",
  },
  {
    id: "classic_collection",
    name: "Classic Collection",
    color: "from-amber-400 to-orange-600",
  },
  { id: "rare_secret", name: "Rare Secret", color: "from-gray-600 to-black" },
  {
    id: "double_rare",
    name: "Double Rare",
    color: "from-emerald-400 to-teal-600",
  },
  {
    id: "illustration_rare",
    name: "Illustration Rare",
    color: "from-rose-400 to-pink-600",
  },
];

export default function ArenaPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("common");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinPassword, setJoinPassword] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Collection states (same as CollectionPage)
  const [address, setAddress] = useState<string | null>(null);
  const [cards, setCards] = useState<OwnedCard[]>([]);
  const [loadingCollection, setLoadingCollection] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id;
  const [avatarUrl, setAvatarUrl] = useState(
    "https://images.pokemontcg.io/base1/58.png"
  );

  useEffect(() => {
    const stored = localStorage.getItem("selectedAvatar");
    if (stored) {
      setAvatarUrl(stored);
    }
  }, []);

  // Load collection (exactly same as CollectionPage)
  // const loadCollection = async (userAddress: string) => {
  //   setLoadingCollection(true);
  //   setCards([]);
  //   try {
  //     const provider = new ethers.BrowserProvider(window.ethereum);
  //     const signer = await provider.getSigner();
  //     const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  //     if (!contractAddress) {
  //       throw new Error("Contract address not configured.");
  //     }

  //     const contract = new ethers.Contract(contractAddress, abi, signer);

  //     const ids = pokemonList.map((p) => BigInt(p.tokenId));
  //     const addresses = ids.map(() => userAddress);

  //     const balances: bigint[] = await contract.balanceOfBatch(addresses, ids);

  //     const owned: OwnedCard[] = balances.flatMap((b, i) => {
  //       const info = pokemonList[i];

  //       if (b > 0n && info?.largeImage && info?.name) {
  //         return [
  //           {
  //             tokenId: info.tokenId,
  //             tcgId: info.tcgId,
  //             name: info.name,
  //             imageUrl: info.largeImage,
  //             amount: b.toString(),
  //             rarity: info.rarity ?? "Common",
  //             type: info.type ?? "Unknown",
  //           },
  //         ];
  //       }

  //       return [];
  //     });

  //     const cleaned = owned.filter(
  //       (c) => !!c.imageUrl && !!c.name && !!c.tokenId
  //     );
  //     setCards(cleaned);
  //   } catch (err) {
  //     console.error(err);
  //     // Don't show alert in arena
  //     console.error(`Error loading collection: ${(err as any).message}`);
  //   }
  //   setLoadingCollection(false);
  // };

  // Check connection (same as CollectionPage)
  const checkConnection = async () => {
    if (!window.ethereum) {
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_accounts", []);
    if (accounts.length > 0) {
      setAddress(accounts[0]);
    } else {
      setAddress(null);
    }
  };

  // // Connect wallet
  // const connectWallet = async () => {
  //   if (!window.ethereum) {
  //     alert("Please install MetaMask to connect your wallet");
  //     return;
  //   }

  //   try {
  //     const provider = new ethers.BrowserProvider(window.ethereum);
  //     await provider.send("eth_requestAccounts", []);
  //     await checkConnection();
  //   } catch (error) {
  //     console.error("Error connecting wallet:", error);
  //     alert("Failed to connect wallet. Please try again.");
  //   }
  // };

  useEffect(() => {
    checkConnection();
  }, []);

  // Fetch rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("/api/battle/room/list", {
          method: "GET",
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        } else {
          console.error("Failed to fetch rooms");
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert("Please enter a room name");
      return;
    }

    if (isPrivate && !password.trim()) {
      alert("Please set a password for private room");
      return;
    }

    if (!currentUserId) {
      alert("User not authenticated.");
      return;
    }

    if (!address) {
      alert(
        "Please connect your wallet to verify card ownership for room creation."
      );
      return;
    }

    if (loadingCollection) {
      alert("Still loading your card collection. Please wait a moment.");
      return;
    }

    setCreating(true);

    try {
      const newRoom = {
        id: nanoid(6),
        name: roomName.trim(),
        isPrivate,
        password: isPrivate ? password : null,
        creatorId: currentUserId,
        player1Id: currentUserId,
        player1DeckId: "default-deck",
        player1Avatar: avatarUrl,
        player1Address: address,
      };

      const res = await fetch("/api/battle/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.error || result.details || "Failed to create room"
        );
      }

      router.push(`/user/battle/room/${result.id}`);
    } catch (error: any) {
      alert(`Failed to create room: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = (room: Room) => {
    if (room.players >= (room.maxPlayers || 2)) {
      alert("Room is full!");
      return;
    }

    if (room.isPrivate) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      joinRoom(room.id);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const res = await fetch("/api/battle/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          userId: currentUserId,
          userAvatar: avatarUrl,
          userDeckId: "default-deck",
          userAddress: address,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || "Failed to join room.");
        return;
      }

      router.push(`/user/battle/room/${roomId}`);
    } catch (error: any) {
      alert(`An error occurred while joining the room: ${error.message}`);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!joinPassword.trim()) {
      alert("Please enter the password");
      return;
    }

    if (!selectedRoom) return;

    try {
      const res = await fetch("/api/battle/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          password: joinPassword,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.error || "Password verification failed.");
        return;
      }

      setShowPasswordModal(false);
      setJoinPassword("");
      joinRoom(selectedRoom.id);
    } catch (err) {
      alert("An error occurred while verifying the password.");
    }
  };

  const getRoomStatusColor = (room: Room) => {
    const playerCount = room.players;
    const maxPlayers = room.maxPlayers || 2;

    if (playerCount === 0)
      return "from-gray-500/20 to-gray-600/20 border-gray-400/30";
    if (playerCount === 1)
      return "from-yellow-500/20 to-orange-500/20 border-yellow-400/30";
    if (playerCount >= maxPlayers)
      return "from-red-500/20 to-red-600/20 border-red-400/30";
    return "from-green-500/20 to-emerald-500/20 border-green-400/30";
  };

  const getRoomStatusText = (room: Room) => {
    const playerCount = room.players;
    const maxPlayers = room.maxPlayers || 2;

    if (playerCount === 0) return "Empty";
    if (playerCount === 1) return "Waiting";
    if (playerCount >= maxPlayers) return "Full";
    return "Available";
  };

  const getRarityInfo = (rarityId: string) => {
    return CARD_RARITIES.find((r) => r.id === rarityId) || CARD_RARITIES[0];
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-lg">Loading Arena...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">🔒</div>
          <p className="text-xl mb-4">Please login to enter the arena</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors font-semibold"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 px-6 py-6 border-b border-white/10 backdrop-blur-xl bg-black/20"
      >
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚔️</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">
                Battle Arena
              </h1>
              <p className="text-white/60">Find opponents and battle!</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <span>➕</span> Create Room
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <span>🔄</span> Refresh
            </span>
          </motion.button>
        </motion.div>

        {/* Create Room Panel */}
        <AnimatePresence>
          {showCreateRoom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                  Create New Battle Room
                </h2>

                {/* Wallet Warning */}
                {!address && (
                  <div className="mb-6 p-4 bg-orange-500/20 border border-orange-400/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 text-xl">⚠️</span>
                      <div>
                        <p className="text-orange-300 font-medium">
                          Wallet not connected
                        </p>
                        <p className="text-orange-200/80 text-sm">
                          Connect your wallet to verify card ownership and
                          create rooms.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading Collection */}
                {loadingCollection && (
                  <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      <span className="text-blue-300">
                        Loading your card collection...
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white/80">
                      Room Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter an epic room name..."
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-green-400/50 focus:ring-2 focus:ring-green-400/20 transition-all"
                      maxLength={30}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white/80">
                      Room Settings
                    </label>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPrivate}
                          onChange={(e) => setIsPrivate(e.target.checked)}
                          className="w-4 h-4 text-green-400 bg-transparent border-2 border-white/30 rounded focus:ring-green-400 focus:ring-2"
                        />
                        <span className="text-white/80">🔒 Private Room</span>
                      </label>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isPrivate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4"
                    >
                      <label className="block text-sm font-semibold mb-2 text-white/80">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Set a secure password..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateRoom}
                    disabled={creating || loadingCollection || !address}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:from-gray-500 disabled:to-gray-600 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg"
                  >
                    {creating ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Creating...
                      </span>
                    ) : loadingCollection ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Loading Cards...
                      </span>
                    ) : !address ? (
                      "Connect Wallet First"
                    ) : (
                      "🚀 Create & Enter Room"
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateRoom(false)}
                    className="px-6 py-4 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Available Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent">
              Available Battle Rooms
            </h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white/60">Live</span>
            </div>
          </div>

          {rooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-xl text-white/70 mb-2">No active rooms</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateRoom(true)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-lg font-semibold transition-all duration-300"
              >
                Create First Room
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room, index) => {
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white">
                            {room.name}
                          </h3>
                          <span className="text-xs font-medium text-white/50 bg-white/10 px-2 py-0.5 rounded">
                            {room.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {room.isPrivate ? "🔒" : "🌐"}
                          </span>
                          <span className="text-sm text-white/70">
                            {room.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-white/90">
                          {getRoomStatusText(room)}
                        </div>
                        <div className="text-xs text-white/60">
                          {room.players}/{room.maxPlayers || 2} players
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-4">
                      {Array.from({ length: room.maxPlayers || 2 }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={`flex-1 h-2 rounded-full ${
                              i < room.players ? "bg-green-400" : "bg-white/20"
                            }`}
                          />
                        )
                      )}
                    </div>

                    <motion.button
                      onClick={() => handleJoinRoom(room)}
                      disabled={room.players >= (room.maxPlayers || 2)}
                      className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                        room.players >= (room.maxPlayers || 2)
                          ? "bg-gray-500/30 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-400 hover:to-cyan-500 text-white shadow-lg"
                      }`}
                    >
                      {room.players >= (room.maxPlayers || 2)
                        ? "⚠️ Room Full"
                        : "🎮 Join Battle"}
                    </motion.button>

                    {room.isPrivate && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-black text-xs">🔑</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🔐</div>
                <h3 className="text-xl font-bold mb-2">Private Room</h3>
                <p className="text-white/70">
                  Enter password to join "{selectedRoom.name}"
                </p>
              </div>

              <input
                type="password"
                placeholder="Enter room password..."
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-yellow-400/50 focus:ring-2 focus:ring-yellow-400/20 transition-all mb-6"
                autoFocus
              />

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordSubmit}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded-xl font-bold transition-all duration-300"
                >
                  Join Room
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setJoinPassword("");
                  }}
                  className="px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
