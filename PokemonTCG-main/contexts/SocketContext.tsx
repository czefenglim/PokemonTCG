//SocketContext.tsx

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
import { BattleData } from "@/types/Battle";

const SOCKET_URL = "http://localhost:4000";

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
  } | null;
  player2?: {
    id: string;
    name: string;
    avatar: string;
    confirmed: boolean;
    deckId?: string;
    present: boolean;
  } | null;
};

type SocketContextType = {
  socket: Socket | null;
  battleData: BattleData | null;
  roomState: RoomState | null;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);

  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { userId: session.user.id },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    // Room sync
    socket.on("ROOM_STATE_SYNC", (data) => {
      console.log("📦 ROOM_STATE_SYNC received:", data);
      setRoomState(data);
    });

    socket.on("ROOM_STATE_UPDATE", (data) => {
      console.log("📥 ROOM_STATE_UPDATE received in context:", data);
      setRoomState(data);
    });

    // Optional: still useful if you're sending "PLAYER_JOINED"
    socket.on("PLAYER_JOINED", (updatedState) => {
      console.log("👥 PLAYER_JOINED event:", updatedState);
      setRoomState(updatedState);
    });

    socket.on("battle-data", (data) => {
      console.log("🔥 battle-data received:", data);
      setBattleData(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [status, session]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        battleData,
        roomState,
      }}
    >
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
