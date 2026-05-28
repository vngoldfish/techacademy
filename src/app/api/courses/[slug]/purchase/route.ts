import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: { id: true, title: true, priceCredit: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Khóa học không tồn tại" }, { status: 404 });
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });

  if (existingEnrollment) {
    return NextResponse.json({ error: "Bạn đã mua khóa học này" }, { status: 409 });
  }

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: session.user.id },
  });

  if (!wallet || wallet.balance < course.priceCredit) {
    const needed = course.priceCredit - (wallet?.balance ?? 0);
    return NextResponse.json(
      { error: `Không đủ credit. Cần nạp thêm ${needed} credit.`, insufficient: true, needed },
      { status: 402 }
    );
  }

  await prisma.$transaction(async (tx) => {
    const lockedWallet = await tx.creditWallet.findUnique({
      where: { userId: session.user!.id },
    });

    if (!lockedWallet || lockedWallet.balance < course.priceCredit) {
      throw new Error("Insufficient balance");
    }

    await tx.creditWallet.update({
      where: { userId: session.user!.id },
      data: { balance: { decrement: course.priceCredit } },
    });

    await tx.transaction.create({
      data: {
        walletId: lockedWallet.id,
        amount: -course.priceCredit,
        type: "PURCHASE",
        description: `Mua khóa học: ${course.title}`,
        relatedCourseId: course.id,
      },
    });

    await tx.enrollment.create({
      data: {
        userId: session.user!.id,
        courseId: course.id,
        progress: 0,
      },
    });
  });

  return NextResponse.json({ success: true, message: "Mua khóa học thành công!" });
}
