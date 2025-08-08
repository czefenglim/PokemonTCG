// /pages/api/battle/room/ready.ts
import { prisma } from "@/app/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomId, playerId } = req.body;

  try {
    const updateData: any = {};
    if (playerId === "player1") updateData.player1Ready = true;
    if (playerId === "player2") updateData.player2Ready = true;

    const room = await prisma.room.update({
      where: { id: roomId },
      data: updateData,
    });

    return res.status(200).json(room);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update readiness" });
  }
}
