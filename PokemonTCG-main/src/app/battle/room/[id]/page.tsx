// /battle/room/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
import { useSocket } from "@/../contexts/SocketContext";
import BattleWager from "@/components/wager/BattleWagerCard";
import { useAccount, useConnect } from "wagmi";
import abi from "@/app/lib/pokemonCardWagerABI.json";

// Contract addresses - Replace with your actual deployed contract addresses
const POKEMON_CARD_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const WAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS!;

type Card = {
  tokenId: number;
  tcgId?: string;
  name: string;
  imageUrl: string;
  amount?: string;
  rarity?: string;
  type?: string;
};

type Deck = {
  id: string;
  name: string;
  cards?: Card[];
};

type Player = {
  id: string;
  name: string;
  avatar: string;
  deckId?: string;
  confirmed: boolean;
  present: boolean;
};

type RoomState = {
  id: string;
  name: string;
  player1: Player | null;
  player2: Player | null;
  status: "waiting" | "selecting" | "ready" | "battle";
  timer: number;
  timerActive: boolean;
  contractLocked?: boolean;
  wagerLocked?: boolean;
  wagerCardId1?: string;
  wagerCardId2?: string;
  wagerRarity?: string;
};

type BattleWagerData = {
  roomId: string;
  player1: {
    id: string;
    name: string;
    avatar: string;
    cards: Card[];
  };
  player2: {
    id: string;
    name: string;
    avatar: string;
    cards: Card[];
  };
};

type BattleResult = {
  winnerId: string;
  loserId: string;
  battleWager: any;
  contractLocked: boolean;
  wagerId?: number;
  transferResult?: {
    success: boolean;
    txHash?: string;
    error?: string;
  };
  cardOwnership?: { [tokenId: number]: string };
  message: string;
};

type WagerCardData = {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  amount: string;
  rarity: string;
  type: string;
  owner: string;
  walletAddress: string;
};

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Wagmi hooks for wallet connection
  const { socket } = useSocket();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // Basic component state
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [selectedDeckCards, setSelectedDeckCards] = useState<Card[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  // Battle Wager States
  const [showBattleWager, setShowBattleWager] = useState(false);
  const [battleWagerData, setBattleWagerData] =
    useState<BattleWagerData | null>(null);
  const [wagerLocked, setWagerLocked] = useState(false);
  const [lockedBattleData, setLockedBattleData] = useState<any>(null);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  // Synchronized wager card states
  const [wagerCards, setWagerCards] = useState<{
    player1Card: WagerCardData | null;
    player2Card: WagerCardData | null;
  }>({
    player1Card: null,
    player2Card: null,
  });

  // Server timer state
  const [serverTimer, setServerTimer] = useState<number>(60);
  const [serverTimerActive, setServerTimerActive] = useState<boolean>(false);

  // Wallet states
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(
    "https://www.freeiconspng.com/thumbs/pokeball-png/file-pokeball-png-0.png"
  );

  const id = params?.id as string | undefined;
  const userId = session?.user?.id;

  // Helper functions
  const isValidPlayer = (player: any): player is Player => {
    return (
      player &&
      typeof player.id === "string" &&
      typeof player.name === "string" &&
      typeof player.avatar === "string" &&
      typeof player.confirmed === "boolean" &&
      typeof player.present === "boolean"
    );
  };

  const currentPlayer =
    isValidPlayer(roomState?.player1) && roomState.player1.id === userId
      ? roomState.player1
      : isValidPlayer(roomState?.player2) && roomState.player2.id === userId
      ? roomState.player2
      : null;

  const opponent =
    currentPlayer === roomState?.player1
      ? roomState?.player2
      : currentPlayer === roomState?.player2
      ? roomState?.player1
      : null;

  // Create a new wager on the blockchain
  const createWager = async (
    tokenIds: number[],
    amounts: number[]
  ): Promise<{
    success: boolean;
    wagerId?: number;
    txHash?: string;
    error?: string;
  }> => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check if we need approval
      const cardContract = new ethers.Contract(
        POKEMON_CARD_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const isApproved = await cardContract.isApprovedForAll(
        address,
        WAGER_CONTRACT_ADDRESS
      );

      if (!isApproved) {
        console.log("🔓 Approving contract for card transfers...");
        const approveTx = await cardContract.setApprovalForAll(
          WAGER_CONTRACT_ADDRESS,
          true
        );
        await approveTx.wait();
        console.log("✅ Approval completed");
      }

      // Create the wager
      const wagerContract = new ethers.Contract(
        WAGER_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const createTx = await wagerContract.createWager(tokenIds, amounts);

      console.log("📤 Create wager transaction sent:", createTx.hash);
      const receipt = await createTx.wait();

      if (receipt.status === 0) {
        throw new Error("Create wager transaction failed");
      }

      // Parse the WagerCreated event to get the wagerId
      const wagerCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = wagerContract.interface.parseLog(log);
          return parsedLog?.name === "WagerCreated";
        } catch {
          return false;
        }
      });

      let wagerId;
      if (wagerCreatedEvent) {
        const parsedLog = wagerContract.interface.parseLog(wagerCreatedEvent);
        wagerId = Number(parsedLog?.args?.wagerId);
      }

      return {
        success: true,
        wagerId,
        txHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("❌ Error creating wager:", error);
      return {
        success: false,
        error: error?.message || "Failed to create wager",
      };
    }
  };

  // Get wallet address for user ID
  const getWalletAddressFromUserId = (userId: string): string | null => {
    if (userId === session?.user?.id && address) {
      return address;
    }
    return null;
  };

  // **END OF SMART CONTRACT FUNCTIONS**///////////////////////////////////////////////////////////////////////////////////////////////////

  // Update wallet address when connection changes
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      console.log("💳 Wallet connected:", address);
    } else {
      setWalletAddress(null);
    }
  }, [isConnected, address]);

  const handleWagerConfirmed = async (battleData: any) => {
    console.log("🔒 Wager confirmed:", battleData);

    // Get current wallet addresses
    const walletAddresses: Record<string, string> = {};

    if (roomState?.player1?.id && roomState?.player2?.id) {
      // For the current user, use their connected wallet
      if (isConnected && walletAddress) {
        walletAddresses[userId || ""] = walletAddress;
      }

      // For other players
      const otherPlayerId =
        userId === roomState.player1.id
          ? roomState.player2.id
          : roomState.player1.id;

      const otherPlayerWallet = getWalletAddressFromUserId(otherPlayerId);
      if (otherPlayerWallet) {
        walletAddresses[otherPlayerId] = otherPlayerWallet;
      }
    }

    // Create the wager on-chain
    if (battleData.contractLocked) {
      // Create wager for player 1's card
      if (battleData.player1Card && userId === roomState?.player1?.id) {
        const tokenIds = [battleData.player1Card.tokenId];
        const amounts = [1]; // Assuming 1 card per wager

        const wagerResult = await createWager(tokenIds, amounts);
        if (wagerResult.success && wagerResult.wagerId) {
          battleData.wagerId = wagerResult.wagerId;
          battleData.txHash = wagerResult.txHash;
          console.log("✅ Wager created on blockchain:", wagerResult);
        } else {
          throw new Error(`Failed to create wager: ${wagerResult.error}`);
        }
      }
    }

    // Add wallet addresses to battle data
    const enhancedBattleData = {
      ...battleData,
      walletAddresses,
      timestamp: Date.now(),
      connectedWallet: walletAddress,
    };

    // Send confirmation to server
    sendWebSocketMessage("BATTLE_WAGER_CONFIRMED", {
      roomId: id,
      battleData: enhancedBattleData,
    });

    console.log("✅ Wager confirmed with wallet data:", enhancedBattleData);
  };

  // Enhanced Battle Results Modal with blockchain transfer details
  const renderBattleResultsModal = () => {
    if (!battleResult) return null;

    const isWinner = battleResult.winnerId === userId;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-50"
        >
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl border-2 border-yellow-400/50 p-8 text-center max-w-lg shadow-2xl">
            <div className="text-6xl mb-4">{isWinner ? "🏆" : "💀"}</div>

            <h3
              className={`battle-title text-3xl font-black mb-4 ${
                isWinner ? "text-green-400" : "text-red-400"
              }`}
            >
              {isWinner ? "VICTORY!" : "DEFEAT!"}
            </h3>

            <p className="text-white text-lg mb-6">{battleResult.message}</p>

            {/* Blockchain Transfer Results */}
            {battleResult.contractLocked && (
              <div className="mb-6 p-4 bg-black/40 rounded-lg border border-white/20">
                <h4 className="text-yellow-400 font-bold mb-3 flex items-center justify-center gap-2">
                  🔗 Blockchain Resolution
                </h4>

                {battleResult.transferResult ? (
                  <>
                    {battleResult.transferResult.success ? (
                      <div className="text-green-400 space-y-2">
                        <div className="text-sm">
                          ✅ Cards transferred successfully!
                        </div>
                        {battleResult.transferResult.txHash && (
                          <div className="text-xs text-gray-300 break-all p-2 bg-black/20 rounded">
                            <strong>Transaction:</strong>
                            <br />
                            {battleResult.transferResult.txHash}
                          </div>
                        )}
                        {battleResult.cardOwnership && (
                          <div className="text-xs text-gray-300">
                            <strong>Cards now owned by winner:</strong>
                            <br />
                            {Object.entries(battleResult.cardOwnership).map(
                              ([tokenId, amount]) => (
                                <span key={tokenId}>
                                  Token #{tokenId}: {amount}{" "}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-400 space-y-2">
                        <div className="text-sm">❌ Transfer failed</div>
                        <div className="text-xs text-gray-300">
                          {battleResult.transferResult.error}
                        </div>
                        <div className="text-xs text-yellow-300 mt-2">
                          💡 Cards may still be locked in the wager contract
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-yellow-400">
                    <div className="text-sm">
                      ⏳ Processing blockchain transfer...
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      This may take a few moments
                    </div>
                  </div>
                )}

                {/* Wager Details */}
                {battleResult.wagerId && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-400">
                      Wager ID: #{battleResult.wagerId}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Demo Mode Notice */}
            {!battleResult.contractLocked && (
              <div className="mb-6 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                <div className="text-blue-300 text-sm">
                  🎮 Demo Battle Completed
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  No blockchain transfer - this was a demonstration battle
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setBattleResult(null);
                  // Optionally refresh user's collection or redirect
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => {
                  setBattleResult(null);
                  router.push("/battle/pvp");
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white rounded-lg font-semibold transition-all duration-300"
              >
                Back to Lobby
              </button>

              {/* View Collection Button for Winner */}
              {isWinner && (
                <button
                  onClick={() => {
                    setBattleResult(null);
                    router.push("/collection");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all duration-300"
                >
                  View Collection
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Add this effect to handle wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      console.log("💳 Wallet connected successfully:", address);
      // Optionally notify other players or update room state
      sendWebSocketMessage("WALLET_CONNECTED", {
        roomId: id,
        playerId: userId,
        walletAddress: address,
      });
    }
  }, [isConnected, address, id, userId]);

  useEffect(() => {
    const stored = localStorage.getItem("selectedAvatar");
    if (stored) setAvatarUrl(stored);
  }, []);

  // Socket connection and event handlers
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id || !id || !socket) {
      return;
    }

    const playerData = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      avatar: avatarUrl,
      deckChoices: decks,
      walletAddress: walletAddress,
    };

    console.log("📨 Emitting joinRoom", { roomId: id, player: playerData });
    socket.emit("joinRoom", { roomId: id, player: playerData });

    // Timer event handlers
    const handleTimerTick = (timer: number) => {
      console.log("🕒 TIMER_TICK:", timer);

      setServerTimer(timer);
      setServerTimerActive(true);
    };

    const handleTimerEnd = () => {
      setServerTimer(0);
      setServerTimerActive(false);
    };

    const handleTimerSync = ({
      timer,
      timerActive,
    }: {
      timer: number;
      timerActive: boolean;
    }) => {
      setServerTimer(timer);
      setServerTimerActive(timerActive);
    };

    const handleAutoPickDeck = (deck: Deck) => {
      setSelectedDeck(deck);
      setSelectedDeckCards(deck.cards || []);
    };

    const handleBattleStart = () => {
      router.push(`/battle/fight/${id}`);
    };

    // Battle Wager Event Handlers
    const handleBattleWagerTrigger = (wagerData: BattleWagerData) => {
      setBattleWagerData(wagerData);
      setShowBattleWager(true);
    };

    const handleBattleWagerLocked = ({
      battleData,
      message,
      contractLocked,
      syncData,
    }: any) => {
      console.log("🔒 Battle wager locked:", message);
      setLockedBattleData(battleData);
      setWagerLocked(true);
      setShowBattleWager(false);

      // Update wager cards from sync data
      if (syncData && syncData.player1Card && syncData.player2Card) {
        setWagerCards({
          player1Card: syncData.player1Card,
          player2Card: syncData.player2Card,
        });
        console.log("🔄 Synchronized wager cards:", {
          player1: syncData.player1Card.name,
          player2: syncData.player2Card.name,
        });
      }

      // Show notification
      alert(message);
    };

    // Handle wager cards synchronization
    const handleWagerCardsSync = ({
      roomId: syncRoomId,
      player1Card,
      player2Card,
      contractLocked,
      wagerId,
    }: {
      roomId: string;
      player1Card: WagerCardData;
      player2Card: WagerCardData;
      contractLocked: boolean;
      wagerId?: number;
    }) => {
      if (syncRoomId === id) {
        console.log("🔄 Received wager cards sync:", {
          player1: player1Card?.name,
          player2: player2Card?.name,
          wagerId,
        });

        setWagerCards({
          player1Card,
          player2Card,
        });

        setWagerLocked(true);
        setLockedBattleData({
          player1Card,
          player2Card,
          contractLocked,
          wagerId,
          roomId: syncRoomId,
        });
      }
    };

    // Handle existing wager data when joining
    const handleBattleWagerExisting = (existingWagerData: any) => {
      console.log("📋 Received existing wager data:", existingWagerData);
      if (existingWagerData.player1Card && existingWagerData.player2Card) {
        setWagerCards({
          player1Card: existingWagerData.player1Card,
          player2Card: existingWagerData.player2Card,
        });
        setWagerLocked(true);
        setLockedBattleData(existingWagerData);
      }
    };

    // Register event listeners
    socket.on("TIMER_TICK", handleTimerTick);
    socket.on("TIMER_END", handleTimerEnd);
    socket.on("TIMER_SYNC", handleTimerSync);
    socket.on("AUTO_PICK_DECK", handleAutoPickDeck);
    socket.on("BATTLE_START", handleBattleStart);
    socket.on("BATTLE_WAGER_TRIGGER", handleBattleWagerTrigger);
    socket.on("BATTLE_WAGER_LOCKED", handleBattleWagerLocked);
    socket.on("BATTLE_WAGER_EXISTING", handleBattleWagerExisting);
    socket.on("WAGER_CARDS_SYNCED", handleWagerCardsSync); // BATTLE_WAGER_CONFIRMED socket

    socket.on("ROOM_STATE_UPDATE", (data: RoomState) => {
      setRoomState(data);
      setWagerLocked(data.wagerLocked || false);
    });

    // Request current timer state
    socket.emit("REQUEST_TIMER", { roomId: id });

    return () => {
      socket.off("TIMER_TICK", handleTimerTick);
      socket.off("TIMER_END", handleTimerEnd);
      socket.off("TIMER_SYNC", handleTimerSync);
      socket.off("AUTO_PICK_DECK", handleAutoPickDeck);
      socket.off("BATTLE_START", handleBattleStart);
      socket.off("BATTLE_WAGER_TRIGGER", handleBattleWagerTrigger);
      socket.off("BATTLE_WAGER_LOCKED", handleBattleWagerLocked);
      socket.off("BATTLE_WAGER_EXISTING", handleBattleWagerExisting);
      socket.off("WAGER_CARDS_SYNCED", handleWagerCardsSync);

      socket.off("ROOM_STATE_UPDATE");
    };
  }, [status, session?.user?.id, id, socket, avatarUrl, decks, router, userId]);

  const sendWebSocketMessage = (type: string, payload: any) => {
    if (socket?.connected) {
      socket.emit(type, payload);
    } else {
      console.warn("Socket not connected. Cannot send:", type);
    }
  };

  // Fetch decks
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const fetchDecks = async () => {
      try {
        const res = await fetch("/api/battle/get-deck", {
          headers: {
            "x-user-id": session.user.id,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch decks");
        const data = await res.json();
        setDecks(data);
      } catch (err) {
        console.error("Failed to fetch decks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, [status, session?.user?.id]);

  // Deck selection logic
  const selectDeck = (deck: Deck) => {
    if (confirmed) return;

    // Check if wager is locked (either traditionally or via contract)
    if (!wagerLocked && !roomState?.contractLocked) {
      alert("Please wait for card wager to be confirmed first.");
      return;
    }

    if (selectedDeck?.id === deck.id) {
      setSelectedDeck(null);
      setSelectedDeckCards([]);
    } else {
      setSelectedDeck(deck);
      setSelectedDeckCards(deck.cards || []);

      sendWebSocketMessage("SELECT_DECK", {
        roomId: id,
        playerId: session?.user?.id,
        deckId: deck.id,
        deckName: deck.name,
      });
    }
  };

  const confirmDeck = () => {
    if (!selectedDeck || confirmed) return;

    // Check for either traditional or contract lock
    if (!wagerLocked && !roomState?.contractLocked) {
      alert("Please wait for card wager to be confirmed first.");
      return;
    }

    if (selectedDeckCards.length !== 10) {
      alert("Deck must contain exactly 10 cards.");
      return;
    }

    setConfirmed(true);

    sendWebSocketMessage("CONFIRM_DECK", {
      roomId: id,
      playerId: session?.user?.id,
      deckId: selectedDeck.id,
      cards: selectedDeckCards,
    });
  };

  const getTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "electric":
        return "from-yellow-400 to-orange-500";
      case "fire":
        return "from-red-500 to-pink-500";
      case "water":
        return "from-blue-400 to-cyan-500";
      case "grass":
        return "from-green-400 to-emerald-500";
      case "psychic":
        return "from-purple-400 to-indigo-500";
      case "fighting":
        return "from-orange-500 to-red-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  // Battle wager component renderer
  const renderBattleWager = () => {
    if (!battleWagerData) return null;

    return (
      <BattleWager
        isOpen={showBattleWager}
        onClose={() => setShowBattleWager(false)}
        roomId={id || ""}
        roomRarity={battleWagerData.player1?.cards?.[0]?.rarity || "common"}
        player1={battleWagerData.player1}
        player2={battleWagerData.player2}
        onCardsLocked={handleWagerConfirmed}
        currentUserId={userId || ""}
        isPlayer1={userId === battleWagerData.player1?.id}
      />
    );
  };

  // Helper variables for conditions
  const canSelectDeck =
    (wagerLocked || roomState?.contractLocked) && !confirmed;
  const canConfirmDeck =
    selectedDeck &&
    !confirmed &&
    (wagerLocked || roomState?.contractLocked) &&
    selectedDeckCards.length === 10;

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p>Room not found or connection failed</p>
          <button
            onClick={() => router.push("/battle/pvp")}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white">
      {/* Custom Styles */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap");

        .pokemon-card {
          background: linear-gradient(145deg, #1a1a2e, #16213e);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          transform-style: preserve-3d;
        }

        .pokemon-card:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4),
            0 0 0 2px rgba(255, 215, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .pokemon-card.selected {
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 20px 40px rgba(255, 215, 0, 0.4),
            0 0 0 3px rgba(255, 215, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .deck-card {
          background: linear-gradient(145deg, #1a1a2e, #16213e);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .deck-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .deck-card.selected {
          background: linear-gradient(145deg, #2d3748, #4a5568);
          border: 2px solid rgba(255, 215, 0, 0.5);
          box-shadow: 0 15px 35px rgba(255, 215, 0, 0.2);
        }

        .battle-title {
          font-family: "Orbitron", sans-serif;
          background: linear-gradient(45deg, #ffd700, #ffed4e, #ff6b6b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .vs-text {
          font-family: "Orbitron", sans-serif;
          background: linear-gradient(45deg, #ff6b6b, #ffd700, #4ecdc4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
      `}</style>

      {/* Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="battle-title text-2xl font-black">
              POKEMON TCG BATTLE ARENA
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full border border-yellow-400/30">
              <span className="text-yellow-300 font-mono font-semibold">
                {id}
              </span>
            </div>
            {/* Wager Status Indicator */}
            {(wagerLocked || roomState?.contractLocked) &&
              (wagerCards.player1Card || wagerCards.player2Card) && (
                <div className="px-3 py-1 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full border border-green-400/30">
                  <span className="text-green-300 text-sm font-semibold">
                    🔒 Cards Locked{" "}
                    {roomState?.contractLocked ? "(Blockchain)" : ""}
                  </span>
                </div>
              )}
          </div>

          <button
            onClick={() => router.push("/battle/pvp")}
            className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-400/30 rounded-lg transition-all duration-300"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="flex flex-grow">
        {/* Sidebar - Deck Selection */}
        <motion.div
          animate={{ width: sidebarCollapsed ? 60 : 320 }}
          className="bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            {!sidebarCollapsed && (
              <h3 className="font-bold text-lg text-cyan-300">Your Decks</h3>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle Sidebar"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <span className="text-xl">{sidebarCollapsed ? "→" : "←"}</span>
            </button>
          </div>

          {/* Wallet Connection & Timer Section */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-white/10 space-y-6">
              {/* Wager Status */}
              {!wagerLocked && !roomState?.contractLocked ? (
                <div className="text-center text-sm text-yellow-400">
                  ⏳ Waiting for card selection...
                </div>
              ) : roomState?.player1?.present && roomState?.player2?.present ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <div
                    className={`w-16 h-16 mx-auto rounded-full border-4 flex items-center justify-center shadow-inner ${
                      serverTimerActive
                        ? "border-red-400 bg-red-500/10 animate-pulse"
                        : "border-gray-600 bg-gray-500/10"
                    }`}
                  >
                    <span
                      className={`text-xl font-extrabold ${
                        serverTimerActive ? "text-red-300" : "text-gray-400"
                      }`}
                    >
                      {serverTimer}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide">
                    Time Left
                  </p>
                </motion.div>
              ) : (
                <div className="text-center text-sm text-gray-500 mt-4">
                  Waiting for both players to join...
                </div>
              )}

              {/* Confirm Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{
                  scale: canConfirmDeck ? 1.02 : 1,
                }}
                disabled={!canConfirmDeck}
                onClick={confirmDeck}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-300 text-center text-sm ${
                  canConfirmDeck
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg"
                    : "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                }`}
              >
                {!(wagerLocked || roomState?.contractLocked)
                  ? "CARDS LOCKED FIRST"
                  : confirmed
                  ? "✓ DECK LOCKED"
                  : roomState?.contractLocked
                  ? "CONFIRM DECK (BLOCKCHAIN)"
                  : "CONFIRM DECK"}
              </motion.button>
            </div>
          )}

          {/* Deck List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {decks.map((deck) => (
              <motion.div
                key={deck.id}
                whileHover={{
                  scale: sidebarCollapsed ? 1 : canSelectDeck ? 1.02 : 1,
                }}
                whileTap={{ scale: 0.98 }}
                className={`deck-card p-4 rounded-xl ${
                  canSelectDeck
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                } ${selectedDeck?.id === deck.id ? "selected" : ""}`}
                onClick={() => selectDeck(deck)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🔹</div>
                  {!sidebarCollapsed && (
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{deck.name}</h4>
                      <p className="text-xs text-cyan-300">
                        {deck.cards?.length || 0} cards ready
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Main Battle Area */}
        <div className="flex-1 flex flex-col">
          {/* Player Status Bar */}
          <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              {/* Current Player Info */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-full border-4 p-1 ${
                    currentPlayer?.confirmed
                      ? "border-green-400"
                      : "border-yellow-400"
                  }`}
                >
                  <img
                    src={currentPlayer?.avatar || avatarUrl}
                    alt="Your Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-cyan-300 text-lg">
                    {currentPlayer?.name || "You"}
                  </h3>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      currentPlayer?.confirmed
                        ? "bg-green-500/20 text-green-300"
                        : wagerLocked || roomState?.contractLocked
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {currentPlayer?.confirmed
                      ? "READY FOR BATTLE!"
                      : wagerLocked || roomState?.contractLocked
                      ? "Selecting Deck..."
                      : "Waiting for Wager..."}
                  </div>
                </div>
              </div>

              {/* VS Section */}
              <div className="text-center">
                <div className="vs-text text-4xl font-black mb-2">VS</div>
                <div className="text-sm text-gray-400">Battle Arena</div>
              </div>

              {/* Opponent Info */}
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-bold text-red-300 text-lg text-right">
                    {opponent?.name || "Waiting for opponent..."}
                  </h3>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-semibold text-right ${
                      opponent?.confirmed
                        ? "bg-green-500/20 text-green-300"
                        : opponent?.present
                        ? wagerLocked || roomState?.contractLocked
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-gray-500/20 text-gray-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {!opponent?.present
                      ? "Waiting to join..."
                      : opponent?.confirmed
                      ? "READY FOR BATTLE!"
                      : wagerLocked || roomState?.contractLocked
                      ? "Selecting Deck..."
                      : "Waiting for Wager..."}
                  </div>
                </div>
                <div
                  className={`w-16 h-16 rounded-full border-4 p-1 ${
                    opponent?.confirmed
                      ? "border-green-400"
                      : opponent?.present
                      ? "border-yellow-400"
                      : "border-gray-400"
                  }`}
                >
                  <img
                    src={
                      opponent?.avatar ||
                      "https://www.freeiconspng.com/thumbs/pokeball-png/file-pokeball-png-0.png"
                    }
                    alt="Opponent Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Battle Table */}
          <div className="flex-1 p-8 relative">
            <div className="max-w-6xl mx-auto h-full flex flex-col justify-between">
              {/* Player's Side */}
              <div>
                <h4 className="text-center text-cyan-300 font-bold mb-6 text-lg">
                  YOUR POKEMON
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-center px-2">
                  {[...Array(10)].map((_, index) => {
                    const card = selectedDeckCards[index];
                    return (
                      <motion.div
                        key={`player-${index}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-[3/4] relative group rounded-xl shadow-xl"
                      >
                        <div className="absolute inset-0 p-3 flex flex-col justify-between bg-zinc-900 rounded-xl">
                          {card ? (
                            <>
                              {/* Card Header */}
                              <div className="flex justify-between items-start mb-2">
                                <div className="battle-title font-black text-sm text-white truncate">
                                  {card.name}
                                </div>
                                <div
                                  className={`px-2 py-0.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${getTypeColor(
                                    card.type
                                  )}`}
                                >
                                  {card.type}
                                </div>
                              </div>

                              {/* Image */}
                              <div className="flex-1 flex items-center justify-center mb-2">
                                <img
                                  src={card.imageUrl}
                                  alt={card.name}
                                  className="max-h-50 max-w-full object-contain rounded-md"
                                />
                              </div>

                              {/* Rarity */}
                              <div className="bg-white/5 rounded-lg p-1 backdrop-blur-xl border border-white/10">
                                <div className="text-xs text-cyan-300 font-semibold text-center truncate">
                                  {card.rarity}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-black/20 backdrop-blur-xl rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                              <div className="text-gray-500 text-center">
                                <div className="text-xs font-semibold">
                                  EMPTY
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Battle Arena Center with Wager Cards Display */}
              <div className="py-8 text-center">
                <div className="inline-flex items-center gap-6 px-8 py-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20">
                  <span className="battle-title font-black text-xl">VS</span>
                </div>
              </div>

              {/* Opponent's Side */}
              <div>
                <h4 className="text-center text-red-300 font-bold mb-6 text-lg">
                  OPPONENT'S POKEMON
                </h4>
                <div className="grid grid-cols-10 gap-4 justify-center">
                  {[...Array(10)].map((_, index) => (
                    <motion.div
                      key={`opponent-${index}`}
                      initial={{ y: 0 }}
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 2,
                        ease: "easeInOut",
                      }}
                      className="aspect-[2.5/3.5] rounded-xl shadow-xl"
                    >
                      <img
                        src="https://i.ebayimg.com/00/s/MTU5OVgxMTMw/z/ROoAAOSw~7Nf7ibu/$_57.JPG?set_id=8800005007"
                        alt="Card Back"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Wager Modal */}
      {renderBattleWager()}

      {/* Battle Ready Notification */}
      <AnimatePresence>
        {currentPlayer?.confirmed && opponent?.confirmed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-50"
          >
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl border-2 border-yellow-400/50 p-12 text-center max-w-md shadow-2xl">
              <div className="text-8xl mb-6">⚔️</div>
              <h3 className="battle-title text-4xl font-black mb-4">
                BATTLE READY!
              </h3>
              <p className="text-cyan-300 mb-8 text-lg">Feel The Wrath!</p>
              {(wagerLocked || roomState?.contractLocked) &&
                (wagerCards.player1Card || wagerCards.player2Card) && (
                  <div className="mb-6 p-4 bg-black/40 rounded-lg border border-yellow-400/30">
                    <div className="text-sm text-yellow-300 mb-2">
                      Wagered Cards:
                    </div>
                    <div className="text-xs text-gray-300">
                      {wagerCards.player1Card?.name} vs{" "}
                      {wagerCards.player2Card?.name}
                    </div>
                    {roomState?.contractLocked && (
                      <div className="text-xs text-green-400 mt-1">
                        🔗 Locked on Blockchain
                      </div>
                    )}
                  </div>
                )}
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-400"></div>
              </div>
              <p className="text-sm text-gray-400">
                Initializing battle arena...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Results Modal */}
      {renderBattleResultsModal()}
    </div>
  );
}
