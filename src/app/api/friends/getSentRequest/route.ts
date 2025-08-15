import { PrismaClient } from "@prisma/client";
import { AuthOptions, getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const sentRequests = await prisma.friendRequest.findMany({
      where: {
        senderId: session.user.id,
      },
      select: {
        status: true,
        createdAt: true,
        receiver: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(sentRequests), { status: 200 });
  } catch (error) {
    console.error("Error fetching sent friend requests:", error);
    return new Response("Failed to fetch sent friend requests", {
      status: 500,
    });
  }
}
