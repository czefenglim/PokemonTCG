"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/../contexts/SocketProviderWrapper";
import CoinFlip from "@/components/fight/CoinFlip";

import pokemonList from "@/app/lib/pokemon-list.json";
import WinnerReward from "@/components/fight/WinnerReward";

interface Attack {
  name: string;
  damage: number;
  cost: string[];
}

interface Card {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  maxHp: number;
  hp: number;
  attacks: Attack[];
  type: string;
  rarity: string;
  attachedEnergy?: number;
  owner?: string;
}

interface Energy {
  id: string;
  type: string;
  color: string;
  symbol: string;
}

interface BattleState {
  roomId: string;
  currentTurnPlayerId: string;
  turnNumber: number;
  gamePhase: string; // "waiting", "coin_flip", "playing", "finished"
  lastAction: any;
  winner?: string;
  players: {
    [playerId: string]: {
      id: string;
      name: string;
      avatar: string;
      deckId: string;
      active: Card | null;
      hand: Card[];
      deck: Card[];
      bench: (Card | null)[];
      energy: number;
      attachedEnergies: { [cardId: string]: Energy[] };
    };
  };
  knockouts: { [playerId: string]: number };
}

export default function PvPBattlePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const { data: session, status } = useSession();
  const socket = useSocket();

  // Battle States
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // Coin flip states
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [coinFlipStarter, setCoinFlipStarter] = useState<"player" | "opponent">(
    "player"
  );
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [hasShownCoinFlip, setHasShownCoinFlip] = useState(false);

  // UI States
  const [availableEnergies, setAvailableEnergies] = useState<Energy[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [draggedEnergy, setDraggedEnergy] = useState<Energy | null>(null);
  const [hoveredBenchIndex, setHoveredBenchIndex] = useState<number | null>(
    null
  );
  const [isOverActiveSlot, setIsOverActiveSlot] = useState(false);
  const [isOverEnergySlot, setIsOverEnergySlot] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [previewType, setPreviewType] = useState<"player" | "opponent">(
    "player"
  );
  const [previewPosition, setPreviewPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(
    null
  );
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isRetreating, setIsRetreating] = useState(false);

  const [lastAction, setLastAction] = useState<string>("");

  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const battleMusicRef = useRef<HTMLAudioElement | null>(null);

  const energyTypes = [
    { type: "Fire", color: "from-red-500 to-orange-600", symbol: "🔥" },
    { type: "Water", color: "from-blue-500 to-cyan-600", symbol: "💧" },
    { type: "Grass", color: "from-green-500 to-emerald-600", symbol: "🌿" },
    { type: "Lightning", color: "from-yellow-400 to-amber-500", symbol: "⚡" },
    { type: "Psychic", color: "from-purple-500 to-pink-600", symbol: "🔮" },
    { type: "Fighting", color: "from-orange-600 to-red-700", symbol: "👊" },
    { type: "Colorless", color: "from-gray-400 to-slate-500", symbol: "⭐" },
    { type: "Darkness", color: "from-gray-700 to-gray-900", symbol: "🌑" },
  ];

  const [shakeOwnActiveCard, setShakeOwnActiveCard] = useState(false);
  const [shakeOpponentActiveCard, setShakeOpponentActiveCard] = useState(false);
  const [blinkOwnActiveCard, setBlinkOwnActiveCard] = useState(false);
  const [blinkOpponentActiveCard, setBlinkOpponentActiveCard] = useState(false);

  // damage sound effect
  const playDamageSound = () => {
    const audio = new Audio("/sounds/attack.mp3");
    audio.play();
  };

  const triggerDamageEffect = (isOwn: boolean) => {
    if (isOwn) {
      setShakeOwnActiveCard(true);
      setBlinkOwnActiveCard(true);
    } else {
      setShakeOpponentActiveCard(true);
      setBlinkOpponentActiveCard(true);
    }
    playDamageSound();

    setTimeout(() => {
      if (isOwn) {
        setShakeOwnActiveCard(false);
        setBlinkOwnActiveCard(false);
      } else {
        setShakeOpponentActiveCard(false);
        setBlinkOpponentActiveCard(false);
      }
    }, 600);
  };

  // Handle starting the battle music
  const handleBattleMusicStart = () => {
    battleMusicRef.current = new Audio("/sounds/battle-music.mp3");
    battleMusicRef.current
      .play()
      .catch((err) => console.warn("Battle music play failed:", err));
  };

  useEffect(() => {
    if (!socket) return;

    const onDamageEffect = ({ targetPlayerId }: { targetPlayerId: string }) => {
      if (targetPlayerId === myPlayerId) {
        triggerDamageEffect(true);
      } else {
        triggerDamageEffect(false);
      }
    };

    socket.on("DAMAGE_EFFECT", onDamageEffect);

    return () => {
      socket.off("DAMAGE_EFFECT", onDamageEffect);
    };
  }, [socket, myPlayerId]);

  // Initialize player IDs when session is ready
  useEffect(() => {
    if (session?.user?.id) {
      setMyPlayerId(session.user.id);
    }
  }, [session]);

  // Cleanup effect to stop music when leaving the page
  useEffect(() => {
    return () => {
      if (battleMusicRef.current) {
        battleMusicRef.current.pause();
        battleMusicRef.current.currentTime = 0;
      }
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleBattleStart = (initialBattleState: BattleState) => {
      setBattleState(initialBattleState);

      if (myPlayerId) {
        const opponent = Object.keys(initialBattleState.players).find(
          (id) => id !== myPlayerId
        );
        setOpponentId(opponent || null);
        setIsMyTurn(initialBattleState.currentTurnPlayerId === myPlayerId);

        if (initialBattleState.gamePhase === "coin_flip" && !hasShownCoinFlip) {
          const startsFirst =
            initialBattleState.currentTurnPlayerId === myPlayerId
              ? "player"
              : "opponent";
          setCoinFlipStarter(startsFirst);
          setShowCoinFlip(true);
          setHasShownCoinFlip(true); // ✅ Mark that we've shown coin flip
        }
      }
    };

    const handleBattleStateUpdate = async (updatedBattleState: BattleState) => {
      console.log("🔄 Battle State Update:", updatedBattleState.gamePhase);

      setBattleState(updatedBattleState);

      if (myPlayerId) {
        setIsMyTurn(updatedBattleState.currentTurnPlayerId === myPlayerId);
      }

      // Handle phase transitions
      if (updatedBattleState.gamePhase === "playing") {
        setShowCoinFlip(false);
        setWaitingForOpponent(false);
      }

      if (updatedBattleState.gamePhase === "finished") {
        setGameOver(true);
        setWinner(updatedBattleState.winner || null);

        // Save to DB
        if (updatedBattleState.roomId && updatedBattleState.winner) {
          try {
            console.log("🔍 Room ID type:", typeof updatedBattleState.roomId);
            console.log(
              "🔍 Room ID value:",
              JSON.stringify(updatedBattleState.roomId)
            );
            console.log(
              "🔍 updatedBattleState.winner:",
              updatedBattleState.winner
            );

            const res = await fetch("/api/battle/end", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomId: updatedBattleState.roomId,
                winnerId: updatedBattleState.winner,
              }),
            });

            if (!res.ok) {
              console.error("❌ Failed to update room in DB");
            } else {
              console.log("✅ Room updated in DB");
            }
          } catch (err) {
            console.error("❌ Error updating room in DB:", err);
          }
        }
      }
    };

    const handleWaitingForOpponent = () => {
      setWaitingForOpponent(true);
      setShowCoinFlip(false);
    };

    const handleBattlePhaseUpdate = ({
      gamePhase,
      battleState: newBattleState,
    }: any) => {
      if (gamePhase === "playing") {
        setShowCoinFlip(false);
        setWaitingForOpponent(false);
        setBattleState(newBattleState);
      }
    };

    const handleBattleCompleted = ({ winner, battleState }: any) => {
      setGameOver(true);
      setWinner(winner);
    };

    const handleBattleActionError = ({ action, error }: any) => {
      console.error("❌ Battle action error:", error, action);
    };

    socket.on("BATTLE_START", handleBattleStart);
    socket.on("BATTLE_STATE_UPDATE", handleBattleStateUpdate);
    socket.on("BATTLE_COMPLETED", handleBattleCompleted);
    socket.on("BATTLE_ACTION_ERROR", handleBattleActionError);
    socket.on("WAITING_FOR_OPPONENT", handleWaitingForOpponent);
    socket.on("BATTLE_PHASE_UPDATE", handleBattlePhaseUpdate);

    // Request current battle state when joining
    if (id) {
      socket.emit("REQUEST_BATTLE_DATA", { roomId: id });
    }

    return () => {
      socket.off("BATTLE_START", handleBattleStart);
      socket.off("BATTLE_STATE_UPDATE", handleBattleStateUpdate);
      socket.off("BATTLE_COMPLETED", handleBattleCompleted);
      socket.off("BATTLE_ACTION_ERROR", handleBattleActionError);
      socket.off("WAITING_FOR_OPPONENT", handleWaitingForOpponent);
      socket.off("BATTLE_PHASE_UPDATE", handleBattlePhaseUpdate);
    };
  }, [socket, id, myPlayerId, hasShownCoinFlip]); // ✅ Include hasShownCoinFlip in dependencies

  // Handle coin flip completion
  const handleCoinFlipStart = () => {
    console.log("🪙 Coin flip completed by user");

    if (!socket || !id) return;

    // Emit to server that this player has completed coin flip
    socket.emit("COIN_FLIP_COMPLETE", { roomId: id });
  };

  const getPlayerName = (playerId: string) => {
    if (!battleState) return "Unknown";
    return battleState.players[playerId]?.name || "Player";
  };

  const getMyPlayer = () => {
    if (!battleState || !myPlayerId) {
      return null;
    }
    const player = battleState.players[myPlayerId];
    return player;
  };

  const getOpponent = () => {
    if (!battleState || !opponentId) {
      return null;
    }
    const opponent = battleState.players[opponentId];
    return opponent;
  };

  useEffect(() => {
    if (!socket) return;

    socket.on("BATTLE_ACTION_ERROR", ({ error }) => {
      alert(`Action failed: ${error}`);
    });

    return () => {
      socket.off("BATTLE_ACTION_ERROR");
    };
  }, []);

  // Debug battleState whenever it changes
  useEffect(() => {
    if (battleState) {
      if (myPlayerId && !opponentId) {
        const newOpponentId = Object.keys(battleState.players).find(
          (id) => id !== myPlayerId
        );
        setOpponentId(newOpponentId || null);
      }
    }
  }, [battleState, myPlayerId, opponentId]);

  // Battle action functions
  const sendBattleAction = (action: any) => {
    if (!socket || !id || !myPlayerId) return;

    socket.emit("BATTLE_ACTION", {
      roomId: id,
      playerId: myPlayerId,
      action,
    });
  };

  // attack
  const handleAttack = (attackIndex: number) => {
    if (!isMyTurn || gameOver || !myPlayerId) return;

    // Check if have an active pokemon
    const myActive = battleState?.players?.[myPlayerId]?.active;
    if (!myActive) return;

    // Check if enemy has an active pokemon
    const enemyPlayerId = Object.keys(battleState?.players || {}).find(
      (id) => id !== myPlayerId
    );
    const enemyActive = enemyPlayerId
      ? battleState?.players?.[enemyPlayerId]?.active
      : null;
    if (!enemyActive) return;

    // Check if the attack exists
    if (!myActive.attacks?.[attackIndex]) return;

    sendBattleAction({
      type: "ATTACK",
      data: { attackIndex },
    });

    sendBattleAction({
      type: "END_TURN",
      data: {},
    });

    const myPlayer = getMyPlayer();
    if (myPlayer?.active) {
      const newEnergy = generateEnergyForTurn(myPlayer.active.type);
      setAvailableEnergies([newEnergy]);
    }
  };

  // move card to bench
  const handlePlayCard = (cardIndex: number, targetSlot: string | number) => {
    if (!isMyTurn || gameOver) return;

    sendBattleAction({
      type: "PLAY_CARD",
      data: { cardIndex, targetSlot },
    });
  };

  // attach pokemon energy
  const handleAttachEnergy = (energyType: string, targetCardId: string) => {
    if (!isMyTurn || gameOver || !myPlayerId) return;

    // Find target card
    const targetCard =
      battleState?.players?.[myPlayerId]?.active?.tcgId === targetCardId
        ? battleState.players[myPlayerId].active
        : battleState?.players?.[myPlayerId]?.bench?.find(
            (card) => card?.tcgId === targetCardId
          );

    // Validate before doing anything
    if (
      !targetCard ||
      (energyType !== targetCard.type && energyType !== "Colorless")
    ) {
      return;
    }

    // Remove energy and send action
    setAvailableEnergies((prev) => prev.filter((e) => e.type !== energyType));

    sendBattleAction({
      type: "ATTACH_ENERGY",
      data: { energyType, targetCardId },
    });
  };

  // put pokemon on active from bench
  const handleSwitchActive = (benchIndex: number) => {
    if (!isMyTurn || gameOver) return;

    sendBattleAction({
      type: "SWITCH_ACTIVE",
      data: { benchIndex },
    });
  };

  // end turn
  const handleEndTurn = () => {
    if (!isMyTurn || gameOver) return;

    sendBattleAction({
      type: "END_TURN",
      data: {},
    });

    const myPlayer = getMyPlayer();
    if (myPlayer?.active) {
      const newEnergy = generateEnergyForTurn(myPlayer.active.type);
      setAvailableEnergies([newEnergy]);
    }
  };

  // surrender
  const handleSurrender = () => {
    const confirmSurrender = window.confirm(
      "Are you sure you want to surrender?"
    );
    if (!confirmSurrender) return;

    sendBattleAction({
      type: "SURRENDER",
      data: {},
    });
  };

  // retreat
  const handleRetreat = (benchIndex: number) => {
    if (!isMyTurn || gameOver || !myPlayerId) return;

    sendBattleAction({
      type: "RETREAT",
      data: { targetBenchIndex: benchIndex },
    });

    setIsRetreating(false); // Exit retreat mode after action
  };

  const getRetreatCost = (pokemon: any) => {
    if (!pokemon) return 0;
    const currentHp = pokemon.currentHp || pokemon.hp;
    if (currentHp >= 200) return 3;
    if (currentHp >= 100) return 2;
    return 1;
  };

  const canRetreat = (pokemon: any) => {
    if (!pokemon || !myPlayerId) return false;
    const retreatCost = getRetreatCost(pokemon);
    const attachedEnergies =
      battleState?.players?.[myPlayerId]?.attachedEnergies?.[pokemon.tcgId] ||
      [];
    const hasAvailableBench = battleState?.players?.[myPlayerId]?.bench?.some(
      (benchPokemon) => benchPokemon !== null
    );
    return attachedEnergies.length >= retreatCost && hasAvailableBench;
  };

  // generate energy
  const generateEnergyForTurn = (pokemonType: string): Energy => {
    const otherEnergyTypes = energyTypes.filter((e) => e.type !== pokemonType);

    const getRandomItems = (arr: any[], count: number) => {
      const shuffled = arr
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
      return shuffled.slice(0, count);
    };

    const randomOthers = getRandomItems(otherEnergyTypes, 2);

    const pool = [
      energyTypes.find((e) => e.type === pokemonType),
      ...randomOthers,
    ].filter(Boolean) as Energy[];

    const chosenEnergy = pool[Math.floor(Math.random() * pool.length)];

    return {
      id: `energy-${chosenEnergy.type}-${Date.now()}-${Math.floor(
        Math.random() * 10000
      )}`,
      type: chosenEnergy.type,
      color: chosenEnergy.color,
      symbol: chosenEnergy.symbol,
    };
  };

  // Drag & Drop Functions
  const handleDropOnActive = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const cardData = e.dataTransfer.getData("application/json");
    const energyData = e.dataTransfer.getData("energy");

    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    if (energyData && myPlayer.active) {
      const energy = JSON.parse(energyData);
      handleAttachEnergy(energy.type, myPlayer.active.tcgId);
      setDraggedEnergy(null);
      setIsOverEnergySlot(null);
      return;
    }

    if (myPlayer.active) return; // Already has active card
    if (!cardData) return;

    const card = JSON.parse(cardData);
    const cardIndex = myPlayer.hand.findIndex((c) => c.tcgId === card.tcgId);
    if (cardIndex !== -1) {
      handlePlayCard(cardIndex, "active");
    }

    setIsDragging(false);
    setIsOverActiveSlot(false);
    setDraggedCard(null);
  };

  const handleDropOnBench = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    const cardData = e.dataTransfer.getData("application/json");
    const energyData = e.dataTransfer.getData("energy");

    const myPlayer = getMyPlayer();
    if (!myPlayer) return;

    if (energyData && myPlayer.bench[index]) {
      const energy = JSON.parse(energyData);
      const card = myPlayer.bench[index]!;
      handleAttachEnergy(energy.type, card.tcgId);
      setDraggedEnergy(null);
      setIsOverEnergySlot(null);
      return;
    }

    if (myPlayer.bench[index]) return; // Slot occupied
    if (!cardData) return;

    const card = JSON.parse(cardData);
    const cardIndex = myPlayer.hand.findIndex((c) => c.tcgId === card.tcgId);
    if (cardIndex !== -1) {
      handlePlayCard(cardIndex, index);
    }

    setIsDragging(false);
    setHoveredBenchIndex(null);
    setDraggedCard(null);
  };

  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const startHoverTimer = (
    card: Card,
    type: "player" | "opponent" = "player",
    element: HTMLElement
  ) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    setPreviewPosition({ x: centerX, y: centerY });

    hoverTimer.current = setTimeout(() => {
      setPreviewCard(card);
      setPreviewType(type);
    }, 300);
  };

  const cancelHoverTimer = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setPreviewCard(null);
  };

  function hasEnoughEnergy(
    attachedEnergies: Energy[],
    attackCost: string[],
    pokemonType: string
  ) {
    const energiesCopy = [...attachedEnergies];

    for (const costType of attackCost) {
      if (costType === "Colorless") {
        // Colorless cost can be paid by any energy
        if (energiesCopy.length === 0) return false;
        energiesCopy.shift(); // use any energy
      } else if (costType === pokemonType) {
        // Must use an energy of the Pokémon's type if cost type matches pokemon type
        const index = energiesCopy.findIndex((e) => e.type === pokemonType);
        if (index === -1) return false;
        energiesCopy.splice(index, 1);
      } else {
        // For other specific costs (like "Fire", "Water" if not Pokémon type)
        const index = energiesCopy.findIndex((e) => e.type === costType);
        if (index === -1) return false;
        energiesCopy.splice(index, 1);
      }
    }

    return true;
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-xl">Authenticating...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl text-red-400">
            Please log in to access the battle
          </p>
        </div>
      </main>
    );
  }

  if (!battleState || !myPlayerId) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Waiting for battle to start...</p>
          <p className="text-sm text-gray-400 mt-2">
            {!battleState
              ? "Waiting for battle initialization..."
              : "Getting player data..."}
          </p>
        </div>
      </main>
    );
  }

  const myPlayer = getMyPlayer();
  const opponent = getOpponent();

  if (!myPlayer) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-400 mx-auto mb-4"></div>
          <p className="text-xl">Cannot find your player data</p>
          <button
            onClick={() => router.push("/user/battle/pvp")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Lobby
          </button>
        </div>
      </main>
    );
  }

  if (!opponent) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-xl">Waiting for opponent...</p>
          <p className="text-sm text-gray-400 mt-2">
            Looking for second player
          </p>
        </div>
      </main>
    );
  }

  // coinflip only at the start of fight page
  if (showCoinFlip) {
    return (
      <CoinFlip
        starter={coinFlipStarter}
        onStart={handleCoinFlipStart}
        onMusicStart={handleBattleMusicStart}
      />
    );
  }

  // Show waiting screen if needed
  if (waitingForOpponent) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-white text-2xl font-bold animate-pulse mb-4">
            ⏳ Waiting for Opponent
          </div>
          <div className="text-yellow-400 text-lg">
            Your opponent is entering the battle...
          </div>
          <div className="mt-6">
            <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-screen h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url('/images/battle-bg.jpg')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      {/* Battle Info Panel */}
      <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              gameOver
                ? "bg-red-400"
                : isMyTurn
                ? "bg-green-400"
                : "bg-yellow-400"
            }`}
          />
          <div>
            <div className="text-white text-sm font-bold">
              {gameOver
                ? "Battle Ended"
                : isMyTurn
                ? "Your Turn"
                : `${opponent.name}'s Turn`}
            </div>
            <div className="text-yellow-400 text-xs">
              Turn {battleState.turnNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        {isMyTurn && !gameOver && (
          <>
            <button
              onClick={handleEndTurn}
              className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg backdrop-blur-md hover:from-green-700 hover:to-emerald-700 hover:scale-105 transition-all duration-200 border border-white/20"
            >
              End Turn
            </button>
            <button
              onClick={handleSurrender}
              className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg shadow-lg backdrop-blur-md hover:from-red-700 hover:to-red-800 hover:scale-105 transition-all duration-200 border border-white/20"
            >
              Surrender
            </button>
          </>
        )}
      </div>

      {/* Player Info */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 bg-black/70 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-blue-400 text-lg font-bold">
              {myPlayer.hand.length}
            </div>
            <div className="text-white text-xs">Hand</div>
          </div>
          <div className="w-full h-px bg-white/20"></div>
          <div className="text-center">
            <div className="text-green-400 text-lg font-bold">
              {myPlayer.deck.length}
            </div>
            <div className="text-white text-xs">Deck</div>
          </div>
          <div className="w-full h-px bg-white/20"></div>
          <div className="text-center">
            <div className="text-yellow-400 text-lg font-bold">
              {battleState?.knockouts?.[myPlayer.id] ?? 0}
            </div>
            <div className="text-white text-xs">Your KO</div>
          </div>
          <div className="w-full h-px bg-white/20"></div>
          <div className="text-center">
            <div className="text-red-400 text-lg font-bold">
              {battleState?.knockouts?.[opponent.id] ?? 0}
            </div>
            <div className="text-white text-xs">Opp KO</div>
          </div>
        </div>
      </div>

      {/* Energy Area */}
      <div className="absolute bottom-4 right-4 z-40">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-full border-2 border-yellow-400/40 backdrop-blur-md shadow-2xl">
            <div className="absolute inset-1 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 rounded-full border border-yellow-300/30">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-yellow-400 text-[8px] font-bold">
                  ENERGY
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            {availableEnergies.length > 0 && (
              <div
                className="cursor-grab hover:cursor-grabbing transition-all duration-300 hover:scale-110"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    "energy",
                    JSON.stringify(availableEnergies[0])
                  );
                  setDraggedEnergy(availableEnergies[0]);
                }}
                onDragEnd={() => {
                  setDraggedEnergy(null);
                }}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${availableEnergies[0].color} rounded-full border-2 border-white/50 shadow-lg flex items-center justify-center text-white text-lg font-bold`}
                >
                  {availableEnergies[0].symbol}
                </div>
              </div>
            )}
          </div>

          <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
            {availableEnergies.length}
          </div>
        </div>
      </div>

      {/* Opponent Section */}
      <div className="absolute -top-[7%] left-1/2 -translate-x-1/2 w-full max-w-5xl">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(opponent.hand.length)].map((_, i) => (
            <div
              key={`opp-hand-${i}`}
              className="relative"
              style={{
                transform: `rotate(${
                  (i - (opponent.hand.length - 1) / 2) * 5
                }deg) translateY(${
                  Math.abs(i - (opponent.hand.length - 1) / 2) * 3
                }px)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent rounded-lg blur-sm" />
              <img
                src="https://images.pokemontcg.io/base1/back.jpg"
                alt="opponent-card"
                className="relative w-[50px] h-[70px] object-cover rounded-lg shadow-xl border border-red-500/30"
              />
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="flex justify-center gap-[4.5rem] mb-6">
            {opponent.bench.map((card, i) => (
              <div
                key={`opp-bench-${i}`}
                className="relative group w-[88px] h-[126px]"
              >
                {card && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-red-500/10 to-red-700/10 rounded-xl blur-md scale-110" />
                    <div
                      className="relative w-full h-full bg-black/40 backdrop-blur-sm rounded-xl border-2 border-red-500/40 shadow-xl overflow-hidden transition-all duration-300 group-hover:border-red-400/60 group-hover:scale-105"
                      onMouseEnter={(e) =>
                        startHoverTimer(card, "opponent", e.currentTarget)
                      }
                      onMouseLeave={cancelHoverTimer}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="absolute inset-0 w-full h-full object-contain p-1"
                      />

                      {/* Energy indicators */}
                      {opponent.attachedEnergies[card.tcgId] && (
                        <div className="absolute top-1 left-1 flex flex-wrap gap-0.5">
                          {opponent.attachedEnergies[card.tcgId].map(
                            (energy, idx) => (
                              <div
                                key={`${energy.id}-${idx}`}
                                className={`w-3 h-3 bg-gradient-to-br ${
                                  energyTypes.find(
                                    (e) => e.type === energy.type
                                  )?.color || "from-gray-400 to-slate-500"
                                } rounded-full border border-white/50 flex items-center justify-center text-[6px]`}
                              >
                                {energyTypes.find((e) => e.type === energy.type)
                                  ?.symbol || "⭐"}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <div className="text-white text-[10px] font-semibold text-center">
                          Bench
                        </div>
                        <div className="text-red-300 text-[8px] text-center">
                          HP: {card.hp}/{card.maxHp}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-red-700/20 rounded-xl blur-xl scale-110 animate-pulse" />
              <div
                className={`relative w-32 h-44 bg-black/50 backdrop-blur-md rounded-xl border-2 border-red-500/60 shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 ${
                  shakeOpponentActiveCard ? "animate-shake" : ""
                } ${blinkOpponentActiveCard ? "blink-red-font" : ""}`}
                onMouseEnter={(e) =>
                  opponent.active &&
                  startHoverTimer(opponent.active, "opponent", e.currentTarget)
                }
                onMouseLeave={cancelHoverTimer}
              >
                {opponent.active && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent" />
                    <img
                      src={opponent.active.imageUrl}
                      alt={opponent.active.name}
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />

                    {/* Energy indicators */}
                    {opponent.attachedEnergies[opponent.active.tcgId] && (
                      <div className="absolute top-1 left-1 flex flex-wrap gap-1">
                        {opponent.attachedEnergies[opponent.active.tcgId].map(
                          (energy, idx) => (
                            <div
                              key={`${energy.id}-${idx}`}
                              className={`w-4 h-4 bg-gradient-to-br ${
                                energyTypes.find((e) => e.type === energy.type)
                                  ?.color || "from-gray-400 to-slate-500"
                              } rounded-full border border-white/50 flex items-center justify-center text-[8px]`}
                            >
                              {energyTypes.find((e) => e.type === energy.type)
                                ?.symbol || "⭐"}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="absolute top-0 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      Active
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <div className="text-white text-xs font-bold text-center">
                        {opponent.active.name}
                      </div>
                      <div className="text-red-300 text-xs text-center">
                        HP: {opponent.active.hp}/{opponent.active.maxHp}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Section */}
      <div className="absolute -bottom-[1%] left-1/2 -translate-x-1/2 w-full max-w-5xl">
        <div className="relative mb-6">
          <div className="flex justify-center mb-6">
            {isDragging && !myPlayer.active && (
              <div
                onDrop={handleDropOnActive}
                onDragOver={(e) => {
                  allowDrop(e);
                  setIsOverActiveSlot(true);
                }}
                onDragLeave={() => setIsOverActiveSlot(false)}
                className="relative group"
              >
                <div
                  className={`absolute inset-0 rounded-xl blur-xl scale-110 transition-all duration-300 ${
                    isOverActiveSlot
                      ? "bg-yellow-400/30 animate-pulse"
                      : "bg-blue-500/10"
                  }`}
                />
                <div
                  className={`relative w-32 h-44 rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-300 ${
                    isOverActiveSlot
                      ? "border-yellow-400 bg-yellow-400/20 backdrop-blur-md scale-105"
                      : "border-blue-500/40 bg-black/40 backdrop-blur-sm border-dashed"
                  } `}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-6xl mb-2 opacity-20">⚔️</div>
                    <div className="text-blue-300 text-sm font-medium">
                      {isOverActiveSlot ? "Drop Here" : "Active Slot"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {myPlayer.active && (
              <div className="flex items-start gap-8">
                {/* Battle Actions - Left Side */}
                {!gameOver && isMyTurn && (
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {myPlayer.active.attacks.map((atk, i) => {
                      const attachedEnergies =
                        myPlayer.attachedEnergies[myPlayer.active.tcgId] || [];
                      const pokemonType = myPlayer.active.type;

                      const enoughEnergy = hasEnoughEnergy(
                        attachedEnergies,
                        atk.cost || [],
                        pokemonType
                      );

                      // Helper function to render energy cost with emojis
                      const renderEnergyCost = (cost) => {
                        if (!cost || cost.length === 0) return "Free";

                        const costMap = {};
                        cost.forEach((energyType) => {
                          costMap[energyType] = (costMap[energyType] || 0) + 1;
                        });

                        return Object.entries(costMap)
                          .map(([type, count]) => {
                            const energyType = energyTypes.find(
                              (e) => e.type === type
                            );
                            const symbol = energyType?.symbol || "⭐";
                            return symbol.repeat(count);
                          })
                          .join("");
                      };

                      return (
                        <button
                          key={i}
                          onClick={() => handleAttack(i)}
                          disabled={!enoughEnergy}
                          className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all ${
                            enoughEnergy
                              ? "bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] shadow-md"
                              : "bg-gray-700 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">⚔️ {atk.name}</span>
                            <span className="ml-2 font-bold">{atk.damage}</span>
                          </div>
                          <div className="text-xs opacity-75 mt-0.5">
                            {renderEnergyCost(atk.cost)}
                          </div>
                        </button>
                      );
                    })}

                    {/* Retreat Section */}
                    {(() => {
                      const myActive =
                        battleState?.players?.[myPlayerId]?.active;
                      const retreatCost = getRetreatCost(myActive);
                      const canRetreatNow = canRetreat(myActive);

                      const renderRetreatCost = (cost) => {
                        if (cost === 0) return "Free";
                        return "⭐".repeat(cost);
                      };

                      return (
                        <div className="border-t border-gray-600 pt-3 mt-2">
                          {!isRetreating ? (
                            // Retreat button
                            <button
                              onClick={() => setIsRetreating(true)}
                              disabled={!canRetreatNow}
                              className={`group relative overflow-hidden rounded-lg border-2 w-full transition-all duration-200 ${
                                canRetreatNow
                                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.02] shadow-lg hover:shadow-blue-400/25"
                                  : "bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <div className="px-4 py-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-base">
                                    🏃 Retreat
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">
                                    {renderRetreatCost(retreatCost)}
                                  </span>
                                </div>
                              </div>
                              {!canRetreatNow && (
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
                              )}
                            </button>
                          ) : (
                            // Retreat selection mode
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white text-sm font-semibold">
                                  Choose Pokémon:
                                </h4>
                                <button
                                  onClick={() => setIsRetreating(false)}
                                  className="text-xs bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-500 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div className="space-y-2">
                                {battleState?.players?.[myPlayerId]?.bench?.map(
                                  (benchPokemon, index) => {
                                    if (!benchPokemon) return null;

                                    return (
                                      <button
                                        key={index}
                                        onClick={() => handleRetreat(index)}
                                        className="group relative overflow-hidden rounded-lg border-2 w-full bg-gradient-to-r from-green-600 to-emerald-600 border-green-500 text-white hover:from-green-500 hover:to-emerald-500 hover:scale-[1.02] shadow-lg hover:shadow-green-400/25 transition-all duration-200"
                                      >
                                        <div className="px-4 py-3">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-base">
                                              ✅ {benchPokemon.name}
                                            </span>
                                          </div>
                                          <div className="text-sm opacity-90">
                                            HP:{" "}
                                            {benchPokemon.hp || benchPokemon.hp}
                                            /{benchPokemon.hp}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  }
                                )}
                              </div>

                              {!battleState?.players?.[myPlayerId]?.bench?.some(
                                (p) => p !== null
                              ) && (
                                <div className="text-gray-400 text-sm italic text-center py-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                  No Pokémon on bench to retreat to
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Active Pokemon - Center */}
                <div
                  onDrop={handleDropOnActive}
                  onDragOver={(e) => {
                    allowDrop(e);
                    if (draggedEnergy)
                      setIsOverEnergySlot(myPlayer.active.tcgId);
                  }}
                  onDragLeave={() => setIsOverEnergySlot(null)}
                  onMouseEnter={(e) =>
                    startHoverTimer(myPlayer.active, "player", e.currentTarget)
                  }
                  onMouseLeave={cancelHoverTimer}
                  className="relative group"
                >
                  <div
                    className={`absolute inset-0 rounded-xl blur-xl scale-110 animate-pulse ${
                      isOverEnergySlot === myPlayer.active.tcgId
                        ? "bg-yellow-400/30"
                        : "bg-blue-500/20"
                    }`}
                  />
                  <div
                    className={`relative w-32 h-44 bg-black/50 backdrop-blur-md rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 ${
                      isOverEnergySlot === myPlayer.active.tcgId
                        ? "border-yellow-400"
                        : "border-blue-500/60"
                    } ${shakeOwnActiveCard ? "animate-shake" : ""} ${
                      blinkOwnActiveCard ? "blink-red-font" : ""
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                    <img
                      src={myPlayer.active.imageUrl}
                      alt={myPlayer.active.name}
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />

                    {/* Energy indicators */}
                    {myPlayer.attachedEnergies[myPlayer.active.tcgId] && (
                      <div className="absolute top-1 left-1 flex flex-wrap gap-1">
                        {myPlayer.attachedEnergies[myPlayer.active.tcgId].map(
                          (energy, idx) => (
                            <div
                              key={`${energy.id}-${idx}`}
                              className={`w-4 h-4 bg-gradient-to-br ${
                                energyTypes.find((e) => e.type === energy.type)
                                  ?.color || "from-gray-400 to-slate-500"
                              } rounded-full border border-white/50 flex items-center justify-center text-[8px]`}
                            >
                              {energyTypes.find((e) => e.type === energy.type)
                                ?.symbol || "⭐"}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="absolute top-0 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                      Active
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                      <div className="text-white text-xs font-bold text-center">
                        {myPlayer.active.name}
                      </div>
                      <div className="text-blue-300 text-xs text-center">
                        HP: {myPlayer.active.hp}/{myPlayer.active.maxHp}
                      </div>
                      {!gameOver && isMyTurn && (
                        <div className="text-green-300 text-xs text-center mt-1">
                          Energy:{" "}
                          {myPlayer.attachedEnergies[myPlayer.active.tcgId]
                            ?.length || 0}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-[4.5rem]">
            {myPlayer.bench.map((card, index) => (
              <div
                key={`player-bench-${index}`}
                className="relative w-[88px] h-[126px]"
              >
                {isDragging && !card && (
                  <div
                    onDrop={(e) => handleDropOnBench(e, index)}
                    onDragOver={(e) => {
                      allowDrop(e);
                      setHoveredBenchIndex(index);
                    }}
                    onDragLeave={() => setHoveredBenchIndex(null)}
                    className="relative group w-full h-full"
                  >
                    <div
                      className={`absolute inset-0 rounded-xl blur-md scale-110 transition-all duration-300 ${
                        hoveredBenchIndex === index ? "bg-yellow-400/20" : ""
                      }`}
                    />
                    <div
                      className={`relative w-full h-full rounded-xl border-2 shadow-xl overflow-hidden transition-all duration-300 ${
                        hoveredBenchIndex === index
                          ? "border-yellow-400 bg-yellow-400/20 backdrop-blur-md scale-105"
                          : "border-blue-500/40 bg-black/40 backdrop-blur-sm border-dashed"
                      }`}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-3xl mb-1 opacity-20">🪑</div>
                        <div className="text-blue-300/50 text-xs font-medium">
                          {hoveredBenchIndex === index ? "Drop" : "Bench"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {card && (
                  <div
                    onDrop={(e) => handleDropOnBench(e, index)}
                    onDragOver={(e) => {
                      allowDrop(e);
                      if (draggedEnergy) setIsOverEnergySlot(card.tcgId);
                    }}
                    onDragLeave={() => setIsOverEnergySlot(null)}
                    onMouseEnter={(e) =>
                      startHoverTimer(card, "player", e.currentTarget)
                    }
                    onMouseLeave={cancelHoverTimer}
                    onClick={() =>
                      isMyTurn && !gameOver && handleSwitchActive(index)
                    }
                    className="relative group w-full h-full cursor-pointer"
                  >
                    <div
                      className={`absolute inset-0 rounded-xl blur-md scale-110 ${
                        isOverEnergySlot === card.tcgId
                          ? "bg-yellow-400/20"
                          : "bg-blue-500/10"
                      }`}
                    />
                    <div
                      className={`relative w-full h-full bg-black/50 backdrop-blur-md rounded-xl border-2 shadow-xl overflow-hidden transition-all duration-300 group-hover:scale-105 ${
                        isOverEnergySlot === card.tcgId
                          ? "border-yellow-400"
                          : "border-blue-500/60"
                      }`}
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-contain p-1"
                      />

                      {/* Energy indicators */}
                      {myPlayer.attachedEnergies[card.tcgId] && (
                        <div className="absolute top-1 left-1 flex flex-wrap gap-0.5">
                          {myPlayer.attachedEnergies[card.tcgId].map(
                            (energy, idx) => (
                              <div
                                key={`${energy.id}-${idx}`}
                                className={`w-3 h-3 bg-gradient-to-br ${
                                  energyTypes.find(
                                    (e) => e.type === energy.type
                                  )?.color || "from-gray-400 to-slate-500"
                                } rounded-full border border-white/50 flex items-center justify-center text-[6px]`}
                              >
                                {energyTypes.find((e) => e.type === energy.type)
                                  ?.symbol || "⭐"}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <div className="text-white text-[10px] font-semibold text-center">
                          Bench
                        </div>
                        <div className="text-blue-300 text-[8px] text-center">
                          HP: {card.hp}/{card.maxHp}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {myPlayer.hand.map((card, index) => (
            <div
              key={`hand-${card.tokenId}-${index}`}
              className={`relative transition-all duration-300 ${
                selectedHandIndex === index ? "z-20" : "z-10"
              }`}
              style={{
                transform: `
                  translateY(${selectedHandIndex === index ? -30 : 0}px)
                  rotate(${(index - myPlayer.hand.length / 2) * 4}deg)
                  translateX(${(index - myPlayer.hand.length / 2) * 5}px)
                `,
              }}
            >
              <div
                className={`absolute inset-0 rounded-xl blur-lg transition-all duration-300 ${
                  selectedHandIndex === index
                    ? "bg-blue-400/40 scale-110"
                    : "bg-blue-600/20 scale-95"
                }`}
              />
              <img
                draggable={isMyTurn && !gameOver}
                onDragStart={(e) => {
                  if (!isMyTurn || gameOver) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify(card)
                  );
                  setIsDragging(true);
                  setDraggedCard(card);
                  setSelectedHandIndex(index);
                  cancelHoverTimer();
                }}
                onDragEnd={() => {
                  setIsDragging(false);
                  setDraggedCard(null);
                  setSelectedHandIndex(null);
                }}
                onMouseEnter={(e) => {
                  startHoverTimer(card, "player", e.currentTarget);
                  setSelectedHandIndex(index);
                }}
                onMouseLeave={() => {
                  cancelHoverTimer();
                  setSelectedHandIndex(null);
                }}
                src={card.imageUrl}
                alt={card.name}
                className={`relative w-24 h-32 object-cover rounded-xl shadow-2xl border-2 transition-all duration-300 ${
                  isMyTurn && !gameOver
                    ? "cursor-grab"
                    : "cursor-not-allowed opacity-75"
                } ${
                  selectedHandIndex === index
                    ? "border-yellow-400 shadow-yellow-400/30"
                    : "border-blue-500/50 hover:border-blue-400"
                } ${
                  draggedCard?.tokenId === card.tokenId
                    ? "opacity-50 rotate-12"
                    : ""
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <>
          {winner === myPlayerId ? (
            // Winner gets full-screen reward experience
            <WinnerReward
              onClose={() => router.push("/user/battle/pvp")}
              isFullScreen={true}
            />
          ) : (
            // Loser gets the regular modal
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center max-w-md">
                <div className="text-6xl mb-4 text-red-400">💀</div>
                <div className="text-3xl font-bold mb-4 text-red-400">
                  Defeat!
                </div>
                <div className="text-white text-lg mb-6">
                  {`${getPlayerName(winner || "")} won the battle!`}
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => router.push("/user/battle/pvp")}
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white"
                  >
                    Back to Lobby
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview Card */}
      {previewCard && (
        <div
          className="fixed z-50 pointer-events-none animate-fadeIn"
          style={{
            left: `${previewPosition.x}px`,
            top:
              previewType === "player"
                ? `${previewPosition.y - 350}px`
                : `${previewPosition.y + 50}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="relative">
            <div
              className={`absolute inset-0 rounded-2xl blur-2xl scale-110 animate-pulse ${
                previewType === "player"
                  ? "bg-gradient-to-t from-blue-600/40 to-purple-600/40"
                  : "bg-gradient-to-t from-red-600/40 to-orange-600/40"
              }`}
            />
            <img
              src={previewCard.imageUrl}
              alt={previewCard.name}
              className="relative w-48 h-auto object-contain drop-shadow-2xl rounded-2xl border-2 border-white/50"
            />
            <div
              className={`absolute left-0 right-0 text-center ${
                previewType === "player" ? "-bottom-8" : "-top-8"
              }`}
            >
              <div className="bg-black/90 backdrop-blur-md rounded-lg mx-4 px-4 py-2 inline-block">
                <div className="text-white font-bold text-lg">
                  {previewCard.name}
                </div>
                <div className="text-gray-300 text-sm">
                  HP: {previewCard.hp}/{previewCard.maxHp}
                </div>
                {previewCard.attacks && previewCard.attacks.length > 0 && (
                  <div className="text-yellow-300 text-sm mt-1">
                    {previewCard.attacks.map((attack, i) => (
                      <div key={i}>
                        {attack.name}: {attack.damage} dmg
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
