import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";
import type { AuthOptions } from "next-auth";

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions as AuthOptions);
  console.log("Session in inventory route:", session);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session?.user?.id;

  try {
    const inventory = await prisma.userCard.findMany({
      where: {
        userId: userId,
      },
      include: {
        pokemon: true,
      },
    });

    return new Response(JSON.stringify(inventory), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
