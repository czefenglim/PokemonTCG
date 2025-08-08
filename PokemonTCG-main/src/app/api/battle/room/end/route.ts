// /pages/api/room/end.ts
import { prisma } from "@/app/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomId, winnerId } = req.body;

  try {
    const room = await prisma.room.update({
      where: { id: roomId },
      data: {
        isFinished: true,
        winnerId,
      },
    });

    return res.status(200).json(room);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to end game" });
  }
}
