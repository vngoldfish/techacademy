import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

const topupSchema = z.object({
  amount: z.number().int().min(100, "Tối thiểu 100 credit").max(10000, "Tối đa 10.000 credit"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = topupSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const creditPriceVnd = 1000;
  const amountVnd = result.data.amount * creditPriceVnd;

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "vnd",
          product_data: {
            name: `${result.data.amount} credit - BawuiAcademy`,
            description: `Nạp ${result.data.amount} credit vào ví BawuiAcademy`,
          },
          unit_amount: amountVnd,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?canceled=true`,
    metadata: {
      userId: session.user.id,
      creditAmount: String(result.data.amount),
    },
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}
