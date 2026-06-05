import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(["ADMIN", "AUTHOR", "INSTRUCTOR", "STUDENT"]).optional(),
  name: z.string().nullable().optional(),
  email: z.string().email("Email không hợp lệ").optional(),
  phone: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  isLocked: z.boolean().optional(),
  walletBalance: z.number().int().min(0, "Số dư không thể là số âm").optional(),
  instructorActive: z.boolean().optional(),
  instructorExpiresAt: z.string().nullable().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      dateOfBirth: true,
      isLocked: true,
      instructorActive: true,
      instructorExpiresAt: true,
      createdAt: true,
      wallet: { select: { balance: true } }
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user, isSelf: id === session.user.id });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  if (id === session.user.id && body.role && body.role !== "ADMIN") {
    return NextResponse.json({ error: "Bạn không thể tự hạ quyền của chính mình" }, { status: 400 });
  }
  const result = updateSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const { walletBalance, ...otherData } = result.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { ...otherData };
  if (updateData.dateOfBirth !== undefined) {
    updateData.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
  }
  if (updateData.instructorExpiresAt !== undefined) {
    updateData.instructorExpiresAt = updateData.instructorExpiresAt ? new Date(updateData.instructorExpiresAt) : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalUser: any = null;

  await prisma.$transaction(async (tx) => {
    // 1. Update basic user data
    await tx.user.update({
      where: { id },
      data: updateData,
    });

    if (walletBalance !== undefined) {
      // Find current wallet balance or default to 0
      const currentWallet = await tx.creditWallet.findUnique({
        where: { userId: id },
      });
      const oldBalance = currentWallet?.balance ?? 0;
      const difference = walletBalance - oldBalance;

      if (difference !== 0) {
        // Upsert CreditWallet
        const wallet = await tx.creditWallet.upsert({
          where: { userId: id },
          update: { balance: walletBalance },
          create: { userId: id, balance: walletBalance },
        });

        // Create Transaction
        const txType = difference > 0 ? "TOPUP" : "REFUND";
        const sign = difference > 0 ? "+" : "";
        const description = `Được điều chỉnh bởi Quản trị viên (${sign}${difference} credits)`;

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            amount: Math.abs(difference),
            type: txType,
            description,
          },
        });
      }
    }
  });

  // Re-fetch user with final values to return
  finalUser = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      dateOfBirth: true,
      isLocked: true,
      instructorActive: true,
      instructorExpiresAt: true,
      createdAt: true,
      wallet: { select: { balance: true } }
    }
  });

  return NextResponse.json({ user: finalUser });
}
