// // app/api/battle/room/[id]/update/route.ts
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const { id } = params;
//   const { type, payload, playerId } = await request.json();

//   if (!rooms.has(id)) {
//     return NextResponse.json({ error: "Room not found" }, { status: 404 });
//   }

//   const room = rooms.get(id);
//   const isPlayer1 = room.player1?.id === playerId;
//   const isPlayer2 = room.player2?.id === playerId;

//   if (!isPlayer1 && !isPlayer2) {
//     return NextResponse.json({ error: "Player not in room" }, { status: 403 });
//   }

//   switch (type) {
//     case "SELECT_DECK":
//       if (isPlayer1) {
//         room.player1.deckId = payload.deckId;
//         room.player1.deckName = payload.deckName;
//       } else {
//         room.player2.deckId = payload.deckId;
//         room.player2.deckName = payload.deckName;
//       }
//       break;

//     case "CONFIRM_DECK":
//       if (isPlayer1) {
//         room.player1.confirmed = true;
//         room.player1.cards = payload.cards;
//       } else {
//         room.player2.confirmed = true;
//         room.player2.cards = payload.cards;
//       }

//       // Check if both players are ready
//       if (room.player1?.confirmed && room.player2?.confirmed) {
//         room.status = "ready";
//         room.timerActive = false;

//         // Start battle after 3 seconds
//         setTimeout(() => {
//           room.status = "battle";
//         }, 3000);
//       }
//       break;

//     default:
//       return NextResponse.json(
//         { error: "Unknown update type" },
//         { status: 400 }
//       );
//   }

//   return NextResponse.json(room);
// }
