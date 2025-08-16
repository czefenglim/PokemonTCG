import { PrismaClient } from "@prisma/client";

export async function POST(req: Request) {
  const body = await req.json();
  const { senderId, receiverId, offeredCardId } = body;
  const prisma = new PrismaClient();
  if (!senderId || !receiverId || !offeredCardId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const newRequest = await prisma.tradeRequest.create({
      data: {
        senderId,
        receiverId,
        offeredCardId,
      },
    });

    return Response.json(
      { message: "Trade request sent", tradeRequest: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending trade request:", error);
    return Response.json(
      { error: "Failed to send trade request" },
      { status: 500 }
    );
  }
}
