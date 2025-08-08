// // app/api/battle/room/[id]/join/route.ts
// import { NextRequest, NextResponse } from 'next/server';

// // In-memory storage (replace with your database)
// const rooms = new Map();

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const { id } = params;
//   const { playerId, playerName, playerAvatar } = await request.json();

//   if (!rooms.has(id)) {
//     rooms.set(id, {
//       id,
//       name: `Room ${id}`,
//       player1: null,
//       player2: null,
//       status: 'waiting',
//       timer: 60,
//       timerActive: true,
//       createdAt: new Date(),
//     });
//   }

//   const room = rooms.get(id);

//   // Add player to room
//   if (!room.player1) {
//     room.player1 = {
//       id: playerId,
//       name: playerName,
//       avatar: playerAvatar,
//       confirmed: false,
//       present: true,
//       deckId: null,
//     };
//   } else if (!room.player2 && room.player1.id !== playerId) {
//     room.player2 = {
//       id: playerId,
//       name: playerName,
//       avatar: playerAvatar,
//       confirmed: false,
//       present: true,
//       deckId: null,
//     };
//     room.status = 'selecting';
//   } else if (room.player1.id === playerId) {
//     room.player1.present = true;
//   } else if (room.player2?.id === playerId) {
//     room.player2.present = true;
//   }

//   return NextResponse.json(room);
// }
