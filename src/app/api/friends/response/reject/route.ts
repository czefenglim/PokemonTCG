import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { senderId, receiverId } = body;

  if (!senderId || !receiverId) {
    return new Response("Missing senderId or receiverId", { status: 400 });
  }

  try {
    // Add mutual friendship
    const friendResponse = await prisma.friend.createMany({
      data: [
        { userId: senderId, friendId: receiverId },
        { userId: receiverId, friendId: senderId },
      ],
      skipDuplicates: true,
    });

    // Find the original friend request
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId,
        receiverId,
      },
    });

    if (!existingRequest) {
      return new Response("Friend request not found", { status: 404 });
    }

    // Update the friend request status to 'rejected'
    const friendRequest = await prisma.friendRequest.update({
      where: { id: existingRequest.id },
      data: { status: "rejected" },
    });

    return new Response(JSON.stringify({ friendResponse, friendRequest }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return new Response("Error accepting friend request", { status: 500 });
  }
}
