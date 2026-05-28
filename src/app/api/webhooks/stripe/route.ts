import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const creditAmount = parseInt(session.metadata?.creditAmount ?? "0");

    if (!userId || !creditAmount) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const existing = await prisma.transaction.findFirst({
      where: { stripePaymentId: session.id },
    });
    if (existing) {
      return NextResponse.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      const wallet = await tx.creditWallet.findUnique({ where: { userId } });
      if (!wallet) {
        await tx.creditWallet.create({
          data: { userId, balance: creditAmount, transactions: {
            create: { amount: creditAmount, type: "TOPUP", description: `Nạp ${creditAmount} credit qua Stripe`, stripePaymentId: session.id },
          }},
        });
      } else {
        await tx.creditWallet.update({
          where: { userId },
          data: { balance: { increment: creditAmount } },
        });
        await tx.transaction.create({
          data: { walletId: wallet.id, amount: creditAmount, type: "TOPUP", description: `Nạp ${creditAmount} credit qua Stripe`, stripePaymentId: session.id },
        });
      }
    });
  }

  return NextResponse.json({ received: true });
}
