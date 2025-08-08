// battle/fight/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/../contexts/SocketContext";
import pokemonList from "@/app/lib/pokemon-list.json";
import { BattleData } from "@/types/Battle";
import { ethers } from "ethers";

// Smart Contract ABIs
const WAGER_CONTRACT_ABI = [
  "function resolveBattle(string calldata battleId, address winner) external",
  "function getWager(string calldata battleId) external view returns (tuple(string battleId, address player1, address player2, uint256 player1TokenId, uint256 player2TokenId, bool isActive, uint256 createdAt))",
  "event BattleResolved(string indexed battleId, address indexed winner, address indexed loser, uint256[] wonTokenIds)",
];

const POKEMON_CARD_ABI = [
  "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
];

// Contract addresses from environment
const WAGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_WAGER_CONTRACT_ADDRESS;
const POKEMON_CARD_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_POKEMON_CARD_CONTRACT_ADDRESS;

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
  owner?: string; // Add owner field
}

interface Energy {
  id: string;
  type: string;
  color: string;
  symbol: string;
}

interface PlayerState {
  active: Card | null;
  hand: Card[];
  deck: Card[];
  energy: number;
  bench: (Card | null)[];
}

interface BattleResult {
  winnerId: string;
  loserId: string;
  winnerCard: Card;
  loserCard: Card;
  transferStatus: "pending" | "success" | "failed";
  txHash?: string;
  error?: string;
}

interface WageredCard {
  tokenId: number;
  owner: string;
  name: string;
  imageUrl: string;
}

export default function IntegratedBattlePage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const { socket, battleData, roomState } = useSocket();

  // Battle States
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [opponent, setOpponent] = useState<PlayerState | null>(null);
  const [turn, setTurn] = useState<"player" | "opponent" | null>("player");
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "opponent" | null>(null);
  const [playerTurnCount, setPlayerTurnCount] = useState(0);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [showTransferResult, setShowTransferResult] = useState(false);

  // Wager and Transfer States
  const [wagerCards, setWagerCards] = useState<{
    player: WageredCard | null;
    opponent: WageredCard | null;
  }>({
    player: null,
    opponent: null,
  });
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  // UI States (keep existing ones)
  const [availableEnergies, setAvailableEnergies] = useState<Energy[]>([
    {
      id: "energy-1",
      type: "Fire",
      color: "from-red-500 to-orange-600",
      symbol: "🔥",
    },
  ]);
  const [cardEnergies, setCardEnergies] = useState<Record<string, Energy[]>>(
    {}
  );
  const [isDrawingCards, setIsDrawingCards] = useState(false);
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
  const [turnNumber, setTurnNumber] = useState(1);
  const [avatarUrl, setAvatarUrl] = useState(
    "https://www.freeiconspng.com/thumbs/pokeball-png/file-pokeball-png-0.png"
  );

  const hasInitialized = useRef(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const battleResultReported = useRef(false);

  // Initialize Web3
  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    try {
      if (typeof window !== "undefined" && window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        setProvider(web3Provider);
        setSigner(web3Signer);
        console.log("✅ Web3 initialized");
      }
    } catch (error) {
      console.error("Failed to initialize Web3:", error);
    }
  };

  // Get wallet address for user ID
  const getWalletAddress = async (userId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/user/wallet/${userId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.address || null;
    } catch (error) {
      console.error("Error fetching wallet address:", error);
      return null;
    }
  };

  // Process card transfer on blockchain
  const processCardTransfer = async (
    winnerId: string,
    loserId: string
  ): Promise<BattleResult> => {
    if (!signer || !wagerCards.player || !wagerCards.opponent) {
      throw new Error("Missing required data for transfer");
    }

    setIsProcessingTransfer(true);

    try {
      // Get wallet addresses
      const [winnerWallet, loserWallet] = await Promise.all([
        getWalletAddress(winnerId),
        getWalletAddress(loserId),
      ]);

      if (!winnerWallet || !loserWallet) {
        throw new Error("Could not fetch wallet addresses");
      }

      // Determine which card goes to which player
      const winnerCard =
        winnerId === session?.user?.id
          ? wagerCards.player
          : wagerCards.opponent;
      const loserCard =
        loserId === session?.user?.id ? wagerCards.player : wagerCards.opponent;

      if (!winnerCard || !loserCard) {
        throw new Error("Could not determine wagered cards");
      }

      let txHash: string | undefined;

      // Only process transfer if contracts are available
      if (WAGER_CONTRACT_ADDRESS && POKEMON_CARD_CONTRACT_ADDRESS) {
        console.log("🔗 Processing blockchain transfer...");

        // Check if wager contract exists and is active
        const wagerContract = new ethers.Contract(
          WAGER_CONTRACT_ADDRESS,
          WAGER_CONTRACT_ABI,
          signer
        );

        try {
          // Get wager details
          const wagerData = await wagerContract.getWager(id);

          if (wagerData.isActive) {
            console.log("📋 Active wager found, resolving battle...");

            // Resolve battle on smart contract
            const tx = await wagerContract.resolveBattle(id, winnerWallet);
            const receipt = await tx.wait();
            txHash = receipt.hash;

            console.log("✅ Battle resolved on blockchain:", txHash);

            return {
              winnerId,
              loserId,
              winnerCard,
              loserCard,
              transferStatus: "success",
              txHash,
            };
          } else {
            console.log(
              "⚠️ No active wager found, processing manual transfer..."
            );
          }
        } catch (contractError) {
          console.warn(
            "Contract resolution failed, falling back to manual transfer:",
            contractError
          );
        }

        // Fallback: Manual card transfer
        console.log("🔄 Processing manual card transfer...");

        const cardContract = new ethers.Contract(
          POKEMON_CARD_CONTRACT_ADDRESS,
          POKEMON_CARD_ABI,
          signer
        );

        // Check if loser has approved the current user to transfer
        const currentAddress = await signer.getAddress();
        const isApproved = await cardContract.isApprovedForAll(
          loserWallet,
          currentAddress
        );

        if (!isApproved) {
          throw new Error("Card transfer not pre-approved by loser");
        }

        // Check if loser owns the card
        const balance = await cardContract.balanceOf(
          loserWallet,
          loserCard.tokenId
        );
        if (balance < 1) {
          throw new Error("Loser does not own the wagered card");
        }

        // Transfer the card
        const transferTx = await cardContract.safeTransferFrom(
          loserWallet,
          winnerWallet,
          loserCard.tokenId,
          1,
          "0x"
        );

        const transferReceipt = await transferTx.wait();
        txHash = transferReceipt.hash;

        console.log("✅ Manual card transfer completed:", txHash);
      }

      return {
        winnerId,
        loserId,
        winnerCard,
        loserCard,
        transferStatus: "success",
        txHash,
      };
    } catch (error) {
      console.error("❌ Card transfer failed:", error);

      return {
        winnerId,
        loserId,
        winnerCard: wagerCards.player!,
        loserCard: wagerCards.opponent!,
        transferStatus: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    } finally {
      setIsProcessingTransfer(false);
    }
  };

  // Handle battle completion with card transfer
  const handleBattleCompletion = async (
    battleWinner: "player" | "opponent"
  ) => {
    if (battleResultReported.current || !session?.user?.id) return;

    battleResultReported.current = true;
    const userId = session.user.id;
    const opponentId = getOpponentId();

    if (!opponentId) {
      console.error("Could not determine opponent ID");
      return;
    }

    const winnerId = battleWinner === "player" ? userId : opponentId;
    const loserId = battleWinner === "player" ? opponentId : userId;

    console.log("🏆 Processing battle completion:", { winnerId, loserId });

    try {
      // Process the card transfer
      const result = await processCardTransfer(winnerId, loserId);
      setBattleResult(result);
      setShowTransferResult(true);

      // Notify server about battle completion
      if (socket && id) {
        const battleCompletionData = {
          roomId: id,
          winnerId,
          loserId,
          battleData: {
            turnNumber,
            finalPlayerState: player,
            finalOpponentState: opponent,
            timestamp: new Date().toISOString(),
            wagerCards,
            transferResult: result,
          },
        };

        console.log(
          "📡 Reporting battle completion to server:",
          battleCompletionData
        );
        socket.emit("BATTLE_COMPLETED", battleCompletionData);
      }

      // Update local storage or state if needed
      if (result.transferStatus === "success") {
        // Refresh user's collection
        console.log("🔄 Battle completed successfully, cards transferred");
      }
    } catch (error) {
      console.error("Error processing battle completion:", error);

      // Still report completion but with error
      const errorResult: BattleResult = {
        winnerId,
        loserId,
        winnerCard: wagerCards.player!,
        loserCard: wagerCards.opponent!,
        transferStatus: "failed",
        error:
          error instanceof Error ? error.message : "Transfer processing failed",
      };

      setBattleResult(errorResult);
      setShowTransferResult(true);
    }
  };

  // Socket event handlers for battle results
  useEffect(() => {
    if (!socket) return;

    const handleBattleResult = (result: BattleResult) => {
      console.log("🏆 Battle result received from server:", result);
      setBattleResult(result);
      setShowTransferResult(true);
    };

    socket.on("BATTLE_RESULT", handleBattleResult);

    return () => {
      socket.off("BATTLE_RESULT", handleBattleResult);
    };
  }, [socket]);

  // Extract wager cards from battle data
  useEffect(() => {
    if (battleData?.wagers && session?.user?.id) {
      const userId = session.user.id;
      const opponentId = getOpponentId();

      if (battleData.wagers[userId] && battleData.wagers[opponentId]) {
        setWagerCards({
          player: {
            tokenId: battleData.wagers[userId].tokenId,
            owner: userId,
            name: battleData.wagers[userId].name || "Your Card",
            imageUrl: battleData.wagers[userId].imageUrl || "/placeholder.png",
          },
          opponent: {
            tokenId: battleData.wagers[opponentId].tokenId,
            owner: opponentId,
            name: battleData.wagers[opponentId].name || "Opponent Card",
            imageUrl:
              battleData.wagers[opponentId].imageUrl || "/placeholder.png",
          },
        });
      }
    }
  }, [battleData, session?.user?.id]);

  const getOpponentId = () => {
    if (!session?.user?.id || !roomState) return null;
    const userId = session.user.id;
    return roomState.player1?.id === userId
      ? roomState.player2?.id
      : roomState.player1?.id;
  };

  // Modified game over effect to trigger card transfer
  useEffect(() => {
    if (gameOver && winner && !battleResultReported.current) {
      handleBattleCompletion(winner);
    }
  }, [gameOver, winner]);

  // Rest of your existing code remains the same...
  // (keeping all the existing battle logic, UI states, initialization, etc.)

  const energyTypes = [
    { type: "Fire", color: "from-red-500 to-orange-600", symbol: "🔥" },
    { type: "Water", color: "from-blue-500 to-cyan-600", symbol: "💧" },
    { type: "Grass", color: "from-green-500 to-emerald-600", symbol: "🌿" },
    { type: "Electric", color: "from-yellow-400 to-amber-500", symbol: "⚡" },
    { type: "Psychic", color: "from-purple-500 to-pink-600", symbol: "🔮" },
    { type: "Fighting", color: "from-orange-600 to-red-700", symbol: "👊" },
    { type: "Colorless", color: "from-gray-400 to-slate-500", symbol: "⭐" },
  ];

  useEffect(() => {
    const stored = localStorage.getItem("selectedAvatar");
    if (stored) setAvatarUrl(stored);
  }, []);

  const validateBattleData = (data: any, userId: string): boolean => {
    console.log("🔍 Validating battle data:", data);

    if (!data || !data.players || typeof data.players !== "object") {
      console.warn("❌ Invalid data structure:", data);
      return false;
    }

    const playerKeys = Object.keys(data.players);
    if (playerKeys.length !== 2) {
      console.warn("❌ Need exactly 2 players, got:", playerKeys.length);
      return false;
    }

    if (!data.players[userId]) {
      console.warn("❌ Current user not found in players data:", userId);
      return false;
    }

    for (const [playerId, deckId] of Object.entries(data.players)) {
      if (!deckId || deckId === "undefined") {
        console.warn(`❌ Invalid deckId for player ${playerId}:`, deckId);
        return false;
      }
    }

    console.log("✅ Battle data validation passed");
    return true;
  };

  const initializeBattleIfReady = async () => {
    if (!session?.user?.id || status !== "authenticated") {
      console.log("⏳ Waiting for authentication...");
      return;
    }

    if (player) {
      console.log("⏳ Battle already initialized");
      return;
    }

    const userId = session.user.id;
    let playersData: Record<string, string> | null = null;

    if (roomState?.player1?.id && roomState?.player2?.id) {
      const player1 = roomState.player1;
      const player2 = roomState.player2;

      if (player1.deckId && player2.deckId) {
        playersData = {
          [player1.id]: player1.deckId,
          [player2.id]: player2.deckId,
        };
        console.log("📊 Using roomState data:", playersData);
      }
    }

    if (!playersData && battleData?.players) {
      playersData = battleData.players;
      console.log("📊 Using battleData:", playersData);
    }

    if (playersData && validateBattleData({ players: playersData }, userId)) {
      console.log("🚀 Initializing battle...");
      await initializeBattle({ players: playersData });
    } else {
      console.log("⏳ Waiting for complete player data...");
    }
  };

  useEffect(() => {
    initializeBattleIfReady();
  }, [roomState, battleData, session?.user?.id, status, player]);

  useEffect(() => {
    if (!socket || status !== "authenticated" || !session?.user?.id || !id) {
      return;
    }

    const playerInfo = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      avatar: avatarUrl,
    };

    console.log("🔌 Joining room:", id);
    socket.emit("joinRoom", { roomId: id, player: playerInfo });

    const onRoomUpdate = (room: any) => {
      console.log("📢 ROOM_STATE_UPDATE received:", room);
    };

    const onBattleStart = (data: BattleData | undefined) => {
      console.log("⚔️ BATTLE_START event received:", data);
    };

    socket.on("ROOM_STATE_UPDATE", onRoomUpdate);
    socket.on("BATTLE_START", onBattleStart);

    return () => {
      socket.off("ROOM_STATE_UPDATE", onRoomUpdate);
      socket.off("BATTLE_START", onBattleStart);
    };
  }, [socket, session, status, id, avatarUrl]);

  useEffect(() => {
    const enterFullScreen = async () => {
      const elem = document.documentElement;
      try {
        await (elem.requestFullscreen?.() ||
          (elem as any).webkitRequestFullscreen?.() ||
          (elem as any).mozRequestFullScreen?.() ||
          (elem as any).msRequestFullscreen?.());
      } catch (e) {
        console.warn("Fullscreen error:", e);
      }
    };
    enterFullScreen();

    if (!hasInitialized.current && player && player.deck.length > 0) {
      hasInitialized.current = true;
      setTimeout(() => {
        drawInitialHand();
      }, 1000);
    }
  }, [player]);

  type BattleInitData = {
    players: Record<string, string>;
  };

  const initializeBattle = async ({ players }: BattleInitData) => {
    try {
      const userId = session?.user?.id;
      if (!userId) {
        console.error("❌ No user ID available");
        return;
      }

      const myDeckId = players[userId];
      const opponentId = Object.keys(players).find((id) => id !== userId);
      const opponentDeckId = opponentId ? players[opponentId] : null;

      console.log("🎯 My deck ID:", myDeckId);
      console.log("🎯 Opponent deck ID:", opponentDeckId);

      // My deck
      const myRes = await fetch("/api/battle/use-deck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ deckId: myDeckId }),
      });

      if (!myRes.ok) {
        throw new Error(`Failed to fetch my deck: ${myRes.status}`);
      }

      const myDeck = await myRes.json();
      console.log("🃏 My deck loaded:", myDeck);

      const enrichedPlayerCards: Card[] = myDeck.cards
        .slice(0, 10)
        .map((sel: any, i: number) => {
          const data = pokemonList.find(
            (p) => p.tokenId === Number(sel.tokenId)
          );
          return {
            tokenId: data?.tokenId ?? i,
            tcgId: data?.tcgId ?? `user-${i}`,
            name: data?.name ?? `MyMon ${i + 1}`,
            imageUrl:
              data?.largeImage ??
              "https://www.freeiconspng.com/thumbs/pokeball-png/file-pokeball-png-0.png",
            type: data?.type ?? "Normal",
            rarity: data?.rarity ?? "Common",
            maxHp: Number(data?.hp ?? 100),
            hp: Number(data?.hp ?? 100),
            attacks: data?.attacks ?? [
              { name: "Tackle", damage: 10, cost: [] },
              { name: "Slam", damage: 20, cost: [] },
            ],
            attachedEnergy: 0,
            owner: userId,
          };
        });

      const shuffle = (arr: Card[]) => [...arr].sort(() => Math.random() - 0.5);
      const shuffled = shuffle(enrichedPlayerCards);

      const initialPlayer: PlayerState = {
        active: null,
        hand: [],
        deck: shuffled,
        energy: 0,
        bench: [null, null, null],
      };

      // Opponent's deck
      let opponentDeck: Card[] = [];

      if (opponentId && opponentDeckId) {
        try {
          const opRes = await fetch("/api/battle/use-deck", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": opponentId,
            },
            body: JSON.stringify({ deckId: opponentDeckId }),
          });

          if (opRes.ok) {
            const opDeck = await opRes.json();
            opponentDeck = opDeck.cards
              .slice(0, 10)
              .map((sel: any, i: number) => ({
                tokenId: 100 + i,
                tcgId: `op-${i}`,
                name: sel.name ?? `EnemyMon ${i + 1}`,
                imageUrl: sel.imageUrl ?? "/placeholder.png",
                maxHp: 100,
                hp: 100,
                attacks: [
                  { name: "Scratch", damage: 10, cost: [] },
                  { name: "Bite", damage: 15, cost: [] },
                ],
                type: sel.type ?? "Normal",
                rarity: sel.rarity ?? "Common",
                attachedEnergy: 0,
                owner: opponentId,
              }));
            console.log("🃏 Opponent deck loaded:", opponentDeck);
          } else {
            console.warn("⚠️ Failed to load opponent deck, using dummy data");
            throw new Error("Opponent deck fetch failed");
          }
        } catch (error) {
          console.warn(
            "⚠️ Error loading opponent deck, using dummy data:",
            error
          );
        }
      }

      const initialOpponent: PlayerState = {
        active: null,
        hand: opponentDeck.slice(1),
        deck: [],
        energy: 0,
        bench: [],
      };

      setPlayer(initialPlayer);
      setOpponent(initialOpponent);
      console.log("✅ Battle initialization complete!");
    } catch (error) {
      console.error("❌ Error initializing battle:", error);
    }
  };

  const drawInitialHand = async () => {
    if (!player || player.deck.length === 0) return;

    setIsDrawingCards(true);

    const cardsToMove = player.deck.slice(0, 5);
    const remainingDeck = player.deck.slice(5);

    setPlayer((prev) => (prev ? { ...prev, deck: remainingDeck } : null));

    for (let i = 0; i < cardsToMove.length; i++) {
      setIsDrawingCards(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setIsDrawingCards(false);

      await new Promise((resolve) => setTimeout(resolve, 300));
      setPlayer((prev) =>
        prev ? { ...prev, hand: [...prev.hand, cardsToMove[i]] } : null
      );
    }

    setIsDrawingCards(false);
  };

  const replaceWithRandomEnergy = () => {
    const randomEnergyType =
      energyTypes[Math.floor(Math.random() * energyTypes.length)];
    const newEnergy: Energy = {
      id: `energy-${Date.now()}`,
      type: randomEnergyType.type,
      color: randomEnergyType.color,
      symbol: randomEnergyType.symbol,
    };

    setAvailableEnergies([newEnergy]);
  };

  const handleAttack = (atk: Attack) => {
    if (
      !player ||
      !opponent ||
      !player.active ||
      !opponent.active ||
      gameOver ||
      turn !== "player"
    )
      return;

    const requiredEnergy = cardEnergies[player.active.tcgId]?.length || 0;
    if (requiredEnergy < 1) {
      return;
    }

    const damageDealt = atk.damage;
    const newHP = Math.max(0, opponent.active.hp - damageDealt);

    const updatedActive = { ...opponent.active, hp: newHP };
    setOpponent((prev) => (prev ? { ...prev, active: updatedActive } : null));

    // Check for game over condition
    if (newHP === 0) {
      setGameOver(true);
      setWinner("player");
      return;
    }

    if (cardEnergies[player.active.tcgId]) {
      const updatedEnergies = { ...cardEnergies };
      updatedEnergies[player.active.tcgId] =
        updatedEnergies[player.active.tcgId].slice(1);
      setCardEnergies(updatedEnergies);
    }

    setTurn("opponent");
    setTimeout(() => handleOpponentTurn(), 1500);
  };

  const handleSwitchActive = (
    card: Card,
    fromBench: boolean = false,
    benchIndex?: number
  ) => {
    if (!player) return;

    if (fromBench && benchIndex !== undefined) {
      const newBench = [...player.bench];
      newBench[benchIndex] = player.active;

      setPlayer({
        ...player,
        active: card,
        bench: newBench,
      });
    } else {
      const updatedHand = player.hand.filter((c) => c.tokenId !== card.tokenId);
      if (player.active) {
        updatedHand.push(player.active);
      }

      setPlayer({
        ...player,
        active: card,
        hand: updatedHand,
      });
    }
  };

  const nextTurn = async () => {
    setTurnNumber((prev) => prev + 1);
    replaceWithRandomEnergy();

    if (player && player.deck.length > 0) {
      setIsDrawingCards(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsDrawingCards(false);

      const cardToDraw = player.deck[0];
      setPlayer((prev) =>
        prev
          ? {
              ...prev,
              deck: prev.deck.slice(1),
              hand: [...prev.hand, cardToDraw],
            }
          : null
      );
    }
  };

  const handlePass = () => {
    setTurn("opponent");
    setTimeout(() => handleOpponentTurn(), 1500);
  };

  const handleSurrender = () => {
    const confirmSurrender = window.confirm(
      "Are you sure you want to surrender?"
    );
    if (!confirmSurrender) return;

    setGameOver(true);
    setWinner("opponent");
  };

  const handleOpponentTurn = () => {
    if (!opponent || !player || !opponent.active || gameOver) return;

    const energy = opponent.energy + 1;
    const atk = opponent.active.attacks[0];
    const damage = atk.damage;
    const newHP = Math.max(0, player.active!.hp - damage);

    let updatedPlayer = { ...player };

    // Check for game over condition
    if (newHP === 0) {
      setGameOver(true);
      setWinner("opponent");
      return;
    } else {
      updatedPlayer = {
        ...updatedPlayer,
        active: { ...player.active!, hp: newHP },
      };
    }

    const newTurnCount = playerTurnCount + 1;

    if (newTurnCount % 2 === 0 && updatedPlayer.deck.length > 0) {
      const [drawnCard, ...restDeck] = updatedPlayer.deck;
      updatedPlayer = {
        ...updatedPlayer,
        hand: [...updatedPlayer.hand, drawnCard],
        deck: restDeck,
      };
    }

    setPlayer({
      ...updatedPlayer,
      energy: updatedPlayer.energy + 1,
    });

    setOpponent((prev) => (prev ? { ...prev, energy } : null));
    setPlayerTurnCount(newTurnCount);
    setTurn("player");
  };

  // Drag & Drop Functions (keeping all existing functions for brevity)
  const handleDropOnActive = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const cardData = e.dataTransfer.getData("application/json");
    const energyData = e.dataTransfer.getData("energy");

    if (energyData && player?.active) {
      const energy = JSON.parse(energyData);
      setCardEnergies((prev) => ({
        ...prev,
        [player.active!.tcgId]: [...(prev[player.active!.tcgId] || []), energy],
      }));
      setAvailableEnergies((prev) => prev.filter((e) => e.id !== energy.id));
      setDraggedEnergy(null);
      setIsOverEnergySlot(null);
      return;
    }

    if (player?.active) return;
    if (!cardData) return;
    const card = JSON.parse(cardData);

    setPlayer((prev) =>
      prev
        ? {
            ...prev,
            active: card,
            hand: prev.hand.filter((c) => c.tokenId !== card.tokenId),
          }
        : null
    );

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

    if (energyData && player?.bench[index]) {
      const energy = JSON.parse(energyData);
      const card = player.bench[index]!;
      setCardEnergies((prev) => ({
        ...prev,
        [card.tcgId]: [...(prev[card.tcgId] || []), energy],
      }));
      setAvailableEnergies((prev) => prev.filter((e) => e.id !== energy.id));
      setDraggedEnergy(null);
      setIsOverEnergySlot(null);
      return;
    }

    if (player?.bench[index]) return;
    if (!cardData) return;
    const card = JSON.parse(cardData);

    setPlayer((prev) =>
      prev
        ? {
            ...prev,
            bench: prev.bench.map((benchCard, i) =>
              i === index ? card : benchCard
            ),
            hand: prev.hand.filter((c) => c.tokenId !== card.tokenId),
          }
        : null
    );

    setIsDragging(false);
    setHoveredBenchIndex(null);
    setDraggedCard(null);
  };

  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleManualFullscreen = async () => {
    const elem = document.documentElement;
    try {
      await (elem.requestFullscreen?.() ||
        (elem as any).webkitRequestFullscreen?.() ||
        (elem as any).mozRequestFullScreen?.() ||
        (elem as any).msRequestFullscreen?.());
    } catch (e) {
      console.warn("Fullscreen error:", e);
    }
  };

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

  if (!player || !opponent) {
    return (
      <main className="min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading battle...</p>
          <p className="text-sm text-gray-400 mt-2">
            Waiting for players and deck data...
          </p>
        </div>
      </main>
    );
  }

  return (
    <div
      className="relative w-screen h-screen bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url('/images/battle-bg.jpg')` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-yellow-400/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full filter blur-3xl animate-pulse animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
      </div>

      {/* UI Buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleManualFullscreen}
          className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg backdrop-blur-md hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all duration-200 border border-white/20"
        >
          Full Screen
        </button>
        <button
          onClick={nextTurn}
          className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg backdrop-blur-md hover:from-green-700 hover:to-emerald-700 hover:scale-105 transition-all duration-200 border border-white/20"
        >
          Next Turn
        </button>
      </div>

      {/* Game Info Panel */}
      <div className="absolute top-4 left-4 z-40 bg-black/60 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              gameOver ? "bg-red-400" : "bg-green-400"
            }`}
          />
          <div>
            <div className="text-white text-sm font-bold">
              {gameOver ? "Battle Ended" : "Battle in Progress"}
            </div>
            <div className="text-yellow-400 text-xs">
              {gameOver
                ? winner === "player"
                  ? "Victory!"
                  : "Defeat!"
                : `Turn ${turnNumber} - ${
                    turn === "player" ? "Your Move" : "Opponent's Turn"
                  }`}
            </div>
          </div>
        </div>
      </div>

      {/* Game Counter */}
      <div className="absolute bottom-4 left-4 z-40 bg-black/60 backdrop-blur-md rounded-xl px-6 py-2 border border-white/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="text-white text-sm">
            Hand:{" "}
            <span className="text-blue-400 font-bold">
              {player.hand.length}
            </span>
          </div>
          <div className="w-px h-4 bg-white/30" />
          <div className="text-white text-sm">
            Deck:{" "}
            <span className="text-green-400 font-bold">
              {player.deck.length}
            </span>
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

      {/* Rest of the battle interface - keeping existing UI components */}
      {/* Opponent Section */}
      <div className="absolute -top-[7%] left-1/2 -translate-x-1/2 w-full max-w-5xl">
        <div className="flex justify-center gap-1 mb-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={`opp-hand-${i}`}
              className="relative"
              style={{
                transform: `rotate(${(i - 1.5) * 5}deg) translateY(${
                  Math.abs(i - 1.5) * 3
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
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <div className="text-white text-[10px] font-semibold text-center">
                          Bench
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
                className="relative w-32 h-44 bg-black/50 backdrop-blur-md rounded-xl border-2 border-red-500/60 shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-105"
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
            {isDragging && !player.active && (
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
                  }`}
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

            {player.active && (
              <div className="flex items-center gap-6">
                {/* Battle Actions - Left Side */}
                {!gameOver && turn === "player" && (
                  <div className="flex flex-col gap-2">
                    {player.active.attacks.map((atk, i) => (
                      <button
                        key={i}
                        onClick={() => handleAttack(atk)}
                        disabled={!cardEnergies[player.active.tcgId]?.length}
                        className={`px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                          cardEnergies[player.active.tcgId]?.length
                            ? "bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-105 shadow-lg"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        ⚔️ {atk.name}
                        <div className="text-xs opacity-80">
                          ({atk.damage} dmg)
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Active Pokemon - Center */}
                <div
                  onDrop={handleDropOnActive}
                  onDragOver={(e) => {
                    allowDrop(e);
                    if (draggedEnergy) setIsOverEnergySlot(player.active.tcgId);
                  }}
                  onDragLeave={() => setIsOverEnergySlot(null)}
                  onMouseEnter={(e) =>
                    startHoverTimer(player.active, "player", e.currentTarget)
                  }
                  onMouseLeave={cancelHoverTimer}
                  className="relative group"
                >
                  <div
                    className={`absolute inset-0 rounded-xl blur-xl scale-110 animate-pulse ${
                      isOverEnergySlot === player.active.tcgId
                        ? "bg-yellow-400/30"
                        : "bg-blue-500/20"
                    }`}
                  />
                  <div
                    className={`relative w-32 h-44 bg-black/50 backdrop-blur-md rounded-xl border-2 shadow-2xl overflow-hidden transition-all duration-300 group-hover:scale-105 ${
                      isOverEnergySlot === player.active.tcgId
                        ? "border-yellow-400"
                        : "border-blue-500/60"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                    <img
                      src={player.active.imageUrl}
                      alt={player.active.name}
                      className="absolute inset-0 w-full h-full object-contain p-2"
                    />

                    {cardEnergies[player.active.tcgId] && (
                      <div className="absolute top-1 left-1 flex flex-wrap gap-1">
                        {cardEnergies[player.active.tcgId].map(
                          (energy, idx) => (
                            <div
                              key={`${energy.id}-${idx}`}
                              className={`w-4 h-4 bg-gradient-to-br ${energy.color} rounded-full border border-white/50 flex items-center justify-center text-[8px]`}
                            >
                              {energy.symbol}
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
                        {player.active.name}
                      </div>
                      <div className="text-blue-300 text-xs text-center">
                        HP: {player.active.hp}/{player.active.maxHp}
                      </div>
                      {!gameOver && turn === "player" && (
                        <div className="text-green-300 text-xs text-center mt-1">
                          Energy:{" "}
                          {cardEnergies[player.active.tcgId]?.length || 0}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Surrender Action - Right Side */}
                {!gameOver && turn === "player" && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSurrender}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-500 hover:scale-105 transition-all shadow-lg"
                    >
                      🏳️ Surrender
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-[4.5rem]">
            {player.bench.map((card, index) => (
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
                    onClick={() => handleSwitchActive(card, true, index)}
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

                      {cardEnergies[card.tcgId] && (
                        <div className="absolute top-1 left-1 flex flex-wrap gap-0.5">
                          {cardEnergies[card.tcgId].map((energy, idx) => (
                            <div
                              key={`${energy.id}-${idx}`}
                              className={`w-3 h-3 bg-gradient-to-br ${energy.color} rounded-full border border-white/50 flex items-center justify-center text-[6px]`}
                            >
                              {energy.symbol}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <div className="text-white text-[10px] font-semibold text-center">
                          Bench
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
          {player.hand.map((card, index) => (
            <div
              key={`hand-${card.tokenId}-${index}`}
              className={`relative transition-all duration-300 ${
                selectedHandIndex === index ? "z-20" : "z-10"
              }`}
              style={{
                transform: `
                  translateY(${selectedHandIndex === index ? -30 : 0}px)
                  rotate(${(index - player.hand.length / 2) * 4}deg)
                  translateX(${(index - player.hand.length / 2) * 5}px)
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
                draggable
                onDragStart={(e) => {
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
                className={`relative w-24 h-32 object-cover rounded-xl shadow-2xl cursor-grab border-2 transition-all duration-300 ${
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

      {/* Game Over Screen with Transfer Result */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl text-center max-w-md">
            <div
              className={`text-6xl mb-4 ${
                winner === "player" ? "text-green-400" : "text-red-400"
              }`}
            >
              {winner === "player" ? "🏆" : "💀"}
            </div>
            <div
              className={`text-3xl font-bold mb-4 ${
                winner === "player" ? "text-green-400" : "text-red-400"
              }`}
            >
              {winner === "player" ? "Victory!" : "Defeat!"}
            </div>
            <div className="text-white text-lg mb-6">
              {winner === "player"
                ? "You won the battle!"
                : "Better luck next time!"}
            </div>

            {/* Show wagered cards result */}
            {battleResult && (
              <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/10">
                <h4 className="text-yellow-400 font-bold mb-3">
                  Card Transfer Result
                </h4>
                <div className="flex justify-center gap-4 mb-3">
                  <div className="text-center">
                    <div className="w-20 h-28 bg-black/50 rounded-lg mb-2 overflow-hidden">
                      <img
                        src={battleResult.winnerCard.imageUrl}
                        alt="Winner's card"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-green-300 text-xs">Winner keeps</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-28 bg-black/50 rounded-lg mb-2 overflow-hidden">
                      <img
                        src={battleResult.loserCard.imageUrl}
                        alt="Loser's card"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-red-300 text-xs">
                      Transferred to winner
                    </p>
                  </div>
                </div>

                <div
                  className={`text-sm ${
                    battleResult.transferStatus === "success"
                      ? "text-green-400"
                      : battleResult.transferStatus === "pending"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {battleResult.transferStatus === "success" && (
                    <>
                      ✅ Card transfer completed successfully!
                      {battleResult.txHash && (
                        <div className="text-xs text-gray-300 mt-1 break-all">
                          TX: {battleResult.txHash}
                        </div>
                      )}
                    </>
                  )}
                  {battleResult.transferStatus === "pending" && (
                    <>
                      🔄 Processing card transfer...
                      <div className="text-xs text-gray-300 mt-1">
                        Please wait while we transfer the cards on blockchain
                      </div>
                    </>
                  )}
                  {battleResult.transferStatus === "failed" && (
                    <>
                      ❌ Transfer failed: {battleResult.error}
                      <div className="text-xs text-gray-300 mt-1">
                        Cards will remain with original owners
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!battleResult && isProcessingTransfer && (
              <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-2"></div>
                <p className="text-yellow-400 text-sm">
                  Processing card transfer on blockchain...
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  This may take a few moments
                </p>
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6">
              <button
                onClick={() => (window.location.href = "/battle/pvp")}
                disabled={isProcessingTransfer}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  isProcessingTransfer
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white"
                }`}
              >
                {isProcessingTransfer ? "Processing..." : "Back to Lobby"}
              </button>
            </div>
          </div>
        </div>
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

        @keyframes drawCard {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-100px) translateX(-200px) scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-300px) translateX(-400px) scale(0.8);
            opacity: 0;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-drawCard {
          animation: drawCard 0.5s ease-in-out;
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
