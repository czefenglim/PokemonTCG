import { PrismaClient } from "@prisma/client";
import { AuthOptions, getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session?.user?.id;

  try {
    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        OR: [{ receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    return new Response(JSON.stringify(friendRequests), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
