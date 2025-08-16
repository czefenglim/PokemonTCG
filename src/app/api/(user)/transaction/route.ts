import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const transactions = await prisma.transaction.findMany();
    return new Response(JSON.stringify(transactions), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return new Response("Error fetching transactions", { status: 500 });
  }
}
