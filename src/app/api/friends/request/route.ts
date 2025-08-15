import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, friendId } = body;

  if (!userId || !friendId) {
    return new Response("Missing userId or friendId", { status: 400 });
  }

  if (userId === friendId) {
    return new Response("Cannot send friend request to yourself", {
      status: 400,
    });
  }

  try {
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: { in: ["pending", "accepted"] },
      },
    });

    if (existingRequest) {
      return new Response("Friend request already exists", { status: 409 });
    }

    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: friendId,
      },
    });

    return new Response(JSON.stringify(friendRequest), { status: 201 });
  } catch (error) {
    console.error("Error creating friend request:", error);
    return new Response("Error creating friend request", { status: 500 });
  }
}
