import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: session.user.id },
    select: { balance: true },
  });

  return NextResponse.json({ balance: wallet?.balance ?? 0 });
}
