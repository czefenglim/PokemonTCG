import { PrismaClient } from "@prisma/client";
import { AuthOptions, getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions as AuthOptions);
  console.log("Session inside getFriends route:", session);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session?.user?.id;

  try {
    const friends = await prisma.friend.findMany({
      where: {
        OR: [{ userId: userId }],
      },
      include: {
        friend: true,
      },
    });

    return new Response(JSON.stringify(friends), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
