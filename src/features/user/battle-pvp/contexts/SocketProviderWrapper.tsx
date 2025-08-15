"use client";
import { createContext, useContext, useMemo } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error("useSocket must be used inside SocketProviderWrapper");
  return context;
}

export function SocketProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const socket = useMemo(() => {
    const url =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:4000";

    const s = io(url, {
      transports: ["websocket"],
    });

    s.on("connect", () => {
      console.log("✅ Connected to Socket.IO server:", s.id);
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket.IO connect error:", err);
    });

    s.on("disconnect", (reason) => {
      console.log("⚠️ Socket.IO disconnected:", reason);
    });

    return s;
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
