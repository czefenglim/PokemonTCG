// // app/api/battle/room/[id]/status/route.ts
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   const { id } = params;
//   const room = rooms.get(id);

//   if (!room) {
//     return NextResponse.json({ error: "Room not found" }, { status: 404 });
//   }

//   return NextResponse.json(room);
// }
