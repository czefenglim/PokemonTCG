import { cancelTrade } from "../../../../lib/contract/cancelTrade";

export async function POST(req: Request) {
  const body = await req.json();
  const { sender, receiver } = body;

  if (!sender || !receiver) {
    return new Response(
      JSON.stringify({ error: "Missing sender or receiver address" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    await cancelTrade(sender, receiver);
    return new Response(
      JSON.stringify({ message: "Trade cancelled successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Cancel trade failed:", err);
    return new Response(JSON.stringify({ error: "Failed to cancel trade" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
