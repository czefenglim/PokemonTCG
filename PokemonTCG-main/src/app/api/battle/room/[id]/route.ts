// // // /src/app/api/battle/room/[id]/route.ts
// // import { prisma } from "@/app/lib/prisma";
// // import { NextResponse } from "next/server";

// // export async function GET(
// //   req: Request,
// //   { params }: { params: { id: string } }
// // ) {
// //   const { id } = params;

// //   try {
// //     const room = await prisma.room.findUnique({
// //       where: { id },
// //     });

// //     if (!room) {
// //       return NextResponse.json({ error: "Room not found" }, { status: 404 });
// //     }

// //     return NextResponse.json(room);
// //   } catch (err) {
// //     console.error(err);
// //     return NextResponse.json(
// //       { error: "Failed to fetch room" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // pages/api/battle/room/[id].ts
// import { NextApiRequest, NextApiResponse } from "next";
// import { PrismaClient } from "@prisma/client";
// import { getToken } from "next-auth/jwt";

// const prisma = new PrismaClient();

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== "GET") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   try {
//     const token = await getToken({ req });
//     if (!token) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const { id } = req.query;

//     if (!id || typeof id !== "string") {
//       return res.status(400).json({ error: "Invalid room ID" });
//     }

//     // Check if room exists
//     const room = await prisma.room.findUnique({
//       where: { id },
//       include: {
//         player1: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//         player2: {
//           select: {
//             id: true,
//             name: true,
//             email: true,
//           },
//         },
//       },
//     });

//     if (!room) {
//       return res.status(404).json({ error: "Room not found" });
//     }

//     // Check if the requesting user is part of this room
//     const userId = token.id;
//     if (room.player1Id !== userId && room.player2Id !== userId) {
//       return res.status(403).json({ error: "Access denied" });
//     }

//     // Return room data
//     return res.status(200).json({
//       id: room.id,
//       name: room.name,
//       status: room.isFinished ? "finished" : "active",
//       player1: room.player1
//         ? {
//             id: room.player1.id,
//             name: room.player1.name,
//             avatar: room.player1Avatar,
//           }
//         : null,
//       player2: room.player2
//         ? {
//             id: room.player2.id,
//             name: room.player2.name,
//             avatar: room.player2Avatar,
//           }
//         : null,
//       createdAt: room.createdAt,
//       updatedAt: room.updatedAt,
//     });
//   } catch (error) {
//     console.error("Error fetching room:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// }
