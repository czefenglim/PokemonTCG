

import { NextRequest } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function POST(req: NextRequest) {
  const rawBody = await req.arrayBuffer();
  const sig = (await headers()).get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log("✅ Webhook verified:", event.type);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle successful checkout
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const purchaseType = session.metadata?.purchaseType;

    if (!purchaseType) {
      console.error("❌ Missing purchaseType in metadata");
      return new Response("Missing metadata", { status: 400 });
    }

    try {
      if (purchaseType === "gems") {
        // 💎 Existing gem purchase logic
        const userId = session.metadata?.userId;
        const priceId = session.metadata?.priceId;

        if (!userId || !priceId) {
          throw new Error("Missing gem purchase metadata");
        }

        const gemPackage = await prisma.gemPackage.findUnique({
          where: { stripeId: priceId },
        });

        if (!gemPackage) throw new Error("Gem package not found");

        await prisma.gemPurchase.create({
          data: {
            userId,
            packageId: gemPackage.id,
            amount: gemPackage.amount,
            priceCents: gemPackage.priceCents,
            currency: gemPackage.currency,
            stripeId: session.payment_intent?.toString(),
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            gems: { increment: gemPackage.amount },
          },
        });

        console.log(`✅ Gems added: ${gemPackage.amount} to user ${userId}`);
      }

      if (purchaseType === "product") {
        // 📦 New product purchase logic
        const userId = session.metadata?.userId;
        const productId = session.metadata?.productId;
        const quantity = parseInt(session.metadata?.quantity || "1", 10);

        if (!userId || !productId) {
          throw new Error("Missing product purchase metadata");
        }

        // Reduce inventory
        await prisma.merchandise.update({
          where: { id: productId },
          data: {
            quantity: { decrement: quantity },
          },
        });

        // Save transaction
        await prisma.transaction.create({
          data: {
            merchandiseId: productId,
            quantity,
            totalAmount: (session.amount_total ?? 0) / 100, // Stripe sends cents
            currency: session.currency?.toUpperCase() || "USD",
            location: session.metadata?.location || "",
            phoneNumber: session.metadata?.phoneNumber || "",
            email: session.customer_email || null,
            status: "COMPLETED",
            paymentRef: session.payment_intent?.toString(),
            userId: userId,
          },
        });

        console.log(
          `✅ Inventory reduced and transaction saved for product ${productId}`
        );
      }
    } catch (err: any) {
      console.error("❌ Error processing webhook logic:", err);
      return new Response("Internal server error", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}
