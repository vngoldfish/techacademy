import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get monthly fee setting
    const feeSetting = await prisma.setting.findUnique({
      where: { key: "INSTRUCTOR_MONTHLY_FEE" },
    });
    const monthlyFee = feeSetting ? parseInt(feeSetting.value, 10) : 200;

    // 2. Get instructor's wallet
    const instructorWallet = await prisma.creditWallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructorWallet || instructorWallet.balance < monthlyFee) {
      return NextResponse.json(
        { error: `Không đủ credit trong ví. Cần ít nhất ${monthlyFee} credit để gia hạn.` },
        { status: 402 }
      );
    }

    // 3. Find first Admin user for receiving fees
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Hệ thống chưa có tài khoản Admin nhận phí." }, { status: 500 });
    }

    // Ensure Admin has a wallet
    let adminWallet = await prisma.creditWallet.findUnique({
      where: { userId: adminUser.id },
    });
    if (!adminWallet) {
      adminWallet = await prisma.creditWallet.create({
        data: { userId: adminUser.id, balance: 0 },
      });
    }

    // 4. Get current user's expiration
    const instructorUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { instructorExpiresAt: true },
    });

    const now = new Date();
    const currentExpiry = instructorUser?.instructorExpiresAt;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const nextExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000); // add 30 days

    // 5. Execute transaction
    await prisma.$transaction(async (tx) => {
      // Deduct fee from instructor
      await tx.creditWallet.update({
        where: { id: instructorWallet.id },
        data: { balance: { decrement: monthlyFee } },
      });

      // Deposit to admin
      await tx.creditWallet.update({
        where: { id: adminWallet.id },
        data: { balance: { increment: monthlyFee } },
      });

      // Record transaction for instructor
      await tx.transaction.create({
        data: {
          walletId: instructorWallet.id,
          amount: -monthlyFee,
          type: "INSTRUCTOR_FEE",
          description: "Thanh toán phí gia hạn Giảng viên hàng tháng",
        },
      });

      // Record transaction for admin
      await tx.transaction.create({
        data: {
          walletId: adminWallet.id,
          amount: monthlyFee,
          type: "TOPUP",
          description: `Phí duy trì tài khoản giảng viên từ: ${session.user!.name || session.user!.email}`,
        },
      });

      // Update user details
      await tx.user.update({
        where: { id: session.user!.id },
        data: {
          instructorActive: true,
          instructorExpiresAt: nextExpiry,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Gia hạn tài khoản Giảng viên thành công!",
      expiresAt: nextExpiry.toLocaleDateString("vi-VN"),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Đã xảy ra lỗi khi gia hạn" }, { status: 500 });
  }
}
