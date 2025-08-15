"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const SOCKET_URL = "http://localhost:4000";

interface Card {
  tokenId: number;
  tcgId: string;
  name: string;
  imageUrl: string;
  maxHp: number;
  hp: number;
  attacks: Array<{
    name: string;
    damage: number;
    cost: string[];
  }>;
  type: string;
  rarity: string;
  owner?: string;
}

interface Energy {
  id: string;
  type: string;
}

interface BattleState {
  roomId: string;
  currentTurnPlayerId: string;
  turnNumber: number;
  gamePhase: string;
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
}

type RoomState = {
  id?: string;
  name?: string;
  status?: string;
  timer?: number;
  timerActive?: boolean;
  player1?: {
    id: string;
    name: string;
    avatar: string;
    confirmed: boolean;
    deckId?: string;
    present: boolean;
    walletAddress?: string;
  } | null;
  player2?: {
    id: string;
    name: string;
    avatar: string;
    confirmed: boolean;
    deckId?: string;
    present: boolean;
    walletAddress?: string;
  } | null;
};

type SocketContextType = {
  socket: Socket | null;
  battleState: BattleState | null;
  roomState: RoomState | null;
  isConnected: boolean;
  connectionError: string | null;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);

  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { userId: session.user.id },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Server disconnected the socket, try to reconnect manually
        socket.connect();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("🚨 Connection error:", error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Room management events
    socket.on("ROOM_STATE_SYNC", (data: RoomState) => {
      console.log("📦 ROOM_STATE_SYNC received:", data);
      setRoomState(data);
    });

    socket.on("ROOM_STATE_UPDATE", (data: RoomState) => {
      console.log("📥 ROOM_STATE_UPDATE received:", data);
      setRoomState(data);
    });

    socket.on("PLAYER_JOINED", (updatedState: RoomState) => {
      console.log("👥 PLAYER_JOINED event:", updatedState);
      setRoomState(updatedState);
    });

    socket.on("PLAYER_DISCONNECTED", ({ playerId }: { playerId: string }) => {
      console.log("👋 PLAYER_DISCONNECTED:", playerId);
    });

    // Battle events
    socket.on("BATTLE_START", (initialBattleState: BattleState) => {
      console.log("🏁 BATTLE_START received:", initialBattleState);
      setBattleState(initialBattleState);
    });

    socket.on("BATTLE_STATE_UPDATE", (updatedBattleState: BattleState) => {
      console.log("🔄 BATTLE_STATE_UPDATE received:", updatedBattleState);
      setBattleState(updatedBattleState);
    });

    socket.on("BATTLE_COMPLETED", (result: any) => {
      console.log("🏆 BATTLE_COMPLETED received:", result);
      // Battle state will be updated via BATTLE_STATE_UPDATE
    });

    socket.on("BATTLE_RESULT", (result: any) => {
      console.log("🎉 BATTLE_RESULT received:", result);
    });

    socket.on("BATTLE_ACTION_ERROR", ({ action, error }: any) => {
      console.error("❌ BATTLE_ACTION_ERROR:", error, action);
    });

    // Deck selection events
    socket.on("DECK_SELECTED", ({ playerId, deckId, deckName }: any) => {
      console.log("🃏 DECK_SELECTED:", { playerId, deckId, deckName });
    });

    socket.on("PLAYER_CONFIRMED", ({ playerId, deckId }: any) => {
      console.log("✅ PLAYER_CONFIRMED:", { playerId, deckId });
    });

    socket.on("AUTO_PICK_DECK", (deck: any) => {
      console.log("🎲 AUTO_PICK_DECK:", deck);
    });

    // Timer events
    socket.on("TIMER_TICK", (timeLeft: number) => {
      console.log("⏰ TIMER_TICK:", timeLeft);
      setRoomState((prev) => (prev ? { ...prev, timer: timeLeft } : null));
    });

    socket.on("TIMER_END", () => {
      console.log("⏰ TIMER_END");
      setRoomState((prev) => (prev ? { ...prev, timerActive: false } : null));
    });

    socket.on("TIMER_SYNC", ({ timer, timerActive }: any) => {
      console.log("⏰ TIMER_SYNC:", { timer, timerActive });
      setRoomState((prev) => (prev ? { ...prev, timer, timerActive } : null));
    });

    // Error handling
    socket.on("error", (error: string) => {
      console.error("🚨 Socket error:", error);
      setConnectionError(error);
    });

    return () => {
      console.log("🧹 Cleaning up socket connection");
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setBattleState(null);
      setRoomState(null);
    };
  }, [status, session]);

  // Helper function to send battle actions
  const sendBattleAction = (roomId: string, playerId: string, action: any) => {
    if (!socketRef.current || !isConnected) {
      console.warn("Socket not connected, cannot send battle action");
      return false;
    }

    console.log("🎮 Sending battle action:", { roomId, playerId, action });
    socketRef.current.emit("BATTLE_ACTION", {
      roomId,
      playerId,
      action,
    });
    return true;
  };

  // Helper function to join a room
  const joinRoom = (roomId: string, playerInfo: any) => {
    if (!socketRef.current || !isConnected) {
      console.warn("Socket not connected, cannot join room");
      return false;
    }

    console.log("🚪 Joining room:", roomId, playerInfo);
    socketRef.current.emit("joinRoom", {
      roomId,
      player: playerInfo,
    });
    return true;
  };

  // Helper function to select deck
  const selectDeck = (
    roomId: string,
    playerId: string,
    deckId: string,
    deckName: string
  ) => {
    if (!socketRef.current || !isConnected) {
      console.warn("Socket not connected, cannot select deck");
      return false;
    }

    console.log("🃏 Selecting deck:", { roomId, playerId, deckId, deckName });
    socketRef.current.emit("SELECT_DECK", {
      roomId,
      playerId,
      deckId,
      deckName,
    });
    return true;
  };

  // Helper function to confirm deck
  const confirmDeck = (
    roomId: string,
    playerId: string,
    deckId: string,
    cards: any[]
  ) => {
    if (!socketRef.current || !isConnected) {
      console.warn("Socket not connected, cannot confirm deck");
      return false;
    }

    console.log("✅ Confirming deck:", { roomId, playerId, deckId });
    socketRef.current.emit("CONFIRM_DECK", {
      roomId,
      playerId,
      deckId,
      cards,
    });
    return true;
  };

  // Helper function to request room state
  const requestRoomState = (roomId: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn("Socket not connected, cannot request room state");
      return false;
    }

    console.log("📋 Requesting room state:", roomId);
    socketRef.current.emit("REQUEST_ROOM_STATE", { roomId });
    return true;
  };

  // Helper function to request battle data
  const requestBattleData = (roomId: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn("Socket not connected, cannot request battle data");
      return false;
    }

    console.log("⚔️ Requesting battle data:", roomId);
    socketRef.current.emit("REQUEST_BATTLE_DATA", { roomId });
    return true;
  };

  const contextValue: SocketContextType = {
    socket: socketRef.current,
    battleState,
    roomState,
    isConnected,
    connectionError,
  };

  // Add helper functions to the socket object for easier access
  if (socketRef.current) {
    (socketRef.current as any).sendBattleAction = sendBattleAction;
    (socketRef.current as any).joinRoom = joinRoom;
    (socketRef.current as any).selectDeck = selectDeck;
    (socketRef.current as any).confirmDeck = confirmDeck;
    (socketRef.current as any).requestRoomState = requestRoomState;
    (socketRef.current as any).requestBattleData = requestBattleData;
  }

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

// Export helper functions for direct use
export const useBattleActions = () => {
  const { socket } = useSocket();

  return {
    sendBattleAction: (roomId: string, playerId: string, action: any) => {
      if (!socket) return false;
      return (socket as any).sendBattleAction(roomId, playerId, action);
    },
    joinRoom: (roomId: string, playerInfo: any) => {
      if (!socket) return false;
      return (socket as any).joinRoom(roomId, playerInfo);
    },
    selectDeck: (
      roomId: string,
      playerId: string,
      deckId: string,
      deckName: string
    ) => {
      if (!socket) return false;
      return (socket as any).selectDeck(roomId, playerId, deckId, deckName);
    },
    confirmDeck: (
      roomId: string,
      playerId: string,
      deckId: string,
      cards: any[]
    ) => {
      if (!socket) return false;
      return (socket as any).confirmDeck(roomId, playerId, deckId, cards);
    },
    requestRoomState: (roomId: string) => {
      if (!socket) return false;
      return (socket as any).requestRoomState(roomId);
    },
    requestBattleData: (roomId: string) => {
      if (!socket) return false;
      return (socket as any).requestBattleData(roomId);
    },
  };
};
