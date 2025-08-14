// // /app/api/battle/room/ws/[id]/route.ts

// import { NextRequest, NextResponse } from "next/server";

// const rooms = new Map<string, WebSocket[]>();

// export const runtime = "edge";

// export async function GET(req: NextRequest) {
//   const pathname = req.nextUrl.pathname;

//   // Extract roomId from pathname
//   const match = pathname.match(/\/api\/battle\/room\/ws\/([^\/\?]+)/);
//   const roomId = match?.[1];

//   if (!roomId) {
//     console.error("Missing room ID in WebSocket connection");
//     return new NextResponse("Missing room ID", { status: 400 });
//   }

//   const { readable, writable } = new TransformStream();
//   const ws = new WebSocket(writable);
//   ws.accept();

//   if (!rooms.has(roomId)) {
//     rooms.set(roomId, []);
//   }

//   rooms.get(roomId)!.push(ws);
//   console.log(`✅ WebSocket connected to room: ${roomId}`);

//   ws.addEventListener("message", (event) => {
//     const message = event.data.toString();
//     console.log(`[Room ${roomId}] Received:`, message);

//     const roomClients = rooms.get(roomId) || [];
//     for (const client of roomClients) {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(message);
//       }
//     }
//   });

//   ws.addEventListener("close", () => {
//     const roomClients = rooms.get(roomId);
//     if (!roomClients) return;

//     rooms.set(
//       roomId,
//       roomClients.filter((client) => client !== ws)
//     );

//     console.log(`❌ WebSocket disconnected from room: ${roomId}`);
//   });

//   return new NextResponse(readable, {
//     status: 200,
//     headers: {
//       "Content-Type": "application/websocket",
//     },
//   });
// }
