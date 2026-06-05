import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInstructorRankAndCommission } from "@/lib/rewards";

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const acceptHeader = req.headers.get("accept") || "";
  const isHtmlRequest = acceptHeader.includes("text/html");

  if (!session?.user?.id) {
    if (isHtmlRequest) {
      return NextResponse.redirect(new URL("/signin", req.url), 303);
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: {
      id: true,
      title: true,
      priceCredit: true,
      creatorId: true,
      creator: { select: { id: true, role: true, name: true, email: true } },
    },
  });

  if (!course) {
    if (isHtmlRequest) {
      return NextResponse.redirect(new URL("/", req.url), 303);
    }
    return NextResponse.json({ error: "Khóa học không tồn tại" }, { status: 404 });
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
  });

  if (existingEnrollment) {
    if (isHtmlRequest) {
      return NextResponse.redirect(new URL(`/courses/${slug}`, req.url), 303);
    }
    return NextResponse.json({ error: "Bạn đã mua khóa học này" }, { status: 409 });
  }

  // Parse coupon code from body or query
  const urlObj = new URL(req.url);
  let couponCode = urlObj.searchParams.get("coupon") || null;
  if (!couponCode && req.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = await req.json();
      couponCode = body.couponCode || null;
    } catch (e) {
      // Ignore body parse errors
    }
  }

  let coupon = null;
  let discountAmount = 0;
  let finalPrice = course.priceCredit;

  if (couponCode) {
    const uppercaseCode = couponCode.trim().toUpperCase();
    coupon = await prisma.coupon.findUnique({
      where: { code: uppercaseCode },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Mã giảm giá không tồn tại" }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Mã giảm giá đã hết hạn sử dụng" }, { status: 400 });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Mã giảm giá đã hết lượt sử dụng" }, { status: 400 });
    }

    if (coupon.courseId && coupon.courseId !== course.id) {
      return NextResponse.json({ error: "Mã giảm giá không áp dụng cho khóa học này" }, { status: 400 });
    }

    const existingUsage = await prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId: session.user.id,
        },
      },
    });

    if (existingUsage) {
      return NextResponse.json({ error: "Bạn đã sử dụng mã giảm giá này rồi" }, { status: 400 });
    }

    discountAmount = Math.floor(course.priceCredit * (coupon.discountPercent / 100));
    finalPrice = Math.max(0, course.priceCredit - discountAmount);
  }

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: session.user.id },
  });

  if (!wallet || wallet.balance < finalPrice) {
    const needed = finalPrice - (wallet?.balance ?? 0);
    if (isHtmlRequest) {
      return NextResponse.redirect(
        new URL(`/profile?error=insufficient_credits&needed=${needed}`, req.url),
        303
      );
    }
    return NextResponse.json(
      { error: `Không đủ credit. Cần nạp thêm ${needed} credit.`, insufficient: true, needed },
      { status: 402 }
    );
  }

  // Get revenue share setting
  const shareSetting = await prisma.setting.findUnique({
    where: { key: "ADMIN_REVENUE_SHARE_PERCENT" },
  });
  const adminSharePercent = shareSetting ? parseInt(shareSetting.value, 10) : 30;

  // Find admin user for revenue share
  const adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true, email: true },
  });

  const creatorTier = await getInstructorRankAndCommission(course.creatorId);

  await prisma.$transaction(async (tx) => {
    // 1. Lock and verify student wallet
    const lockedWallet = await tx.creditWallet.findUnique({
      where: { userId: session.user!.id },
    });

    if (!lockedWallet || lockedWallet.balance < finalPrice) {
      throw new Error("Insufficient balance");
    }

    // 2. Deduct amount from student
    await tx.creditWallet.update({
      where: { id: lockedWallet.id },
      data: { balance: { decrement: finalPrice } },
    });

    // 3. Create purchase transaction for student
    await tx.transaction.create({
      data: {
        walletId: lockedWallet.id,
        amount: -finalPrice,
        type: "PURCHASE",
        description: coupon
          ? `Mua khóa học: ${course.title} (Áp dụng mã ${coupon.code} giảm ${coupon.discountPercent}%)`
          : `Mua khóa học: ${course.title}`,
        relatedCourseId: course.id,
      },
    });

    // 4. Distribute revenue if actual paid price is > 0
    if (finalPrice > 0) {
      const isCreatorAdmin = course.creator.role === "ADMIN";

      if (isCreatorAdmin) {
        // All money goes to creator admin
        let creatorAdminWallet = await tx.creditWallet.findUnique({
          where: { userId: course.creator.id },
        });
        if (!creatorAdminWallet) {
          creatorAdminWallet = await tx.creditWallet.create({
            data: { userId: course.creator.id, balance: 0 },
          });
        }

        await tx.creditWallet.update({
          where: { id: creatorAdminWallet.id },
          data: { balance: { increment: finalPrice } },
        });

        await tx.transaction.create({
          data: {
            walletId: creatorAdminWallet.id,
            amount: finalPrice,
            type: "TOPUP",
            description: `Doanh thu bán khóa học: ${course.title} (100% - Áp dụng giảm giá)`,
            relatedCourseId: course.id,
          },
        });
      } else {
        // Share split between Instructor and Admin based on Instructor Tier
        const adminShare = Math.floor(finalPrice * (creatorTier.adminSharePercent / 100));
        const instructorShare = finalPrice - adminShare;

        // Credit to Instructor
        let instructorWallet = await tx.creditWallet.findUnique({
          where: { userId: course.creator.id },
        });
        if (!instructorWallet) {
          instructorWallet = await tx.creditWallet.create({
            data: { userId: course.creator.id, balance: 0 },
          });
        }

        await tx.creditWallet.update({
          where: { id: instructorWallet.id },
          data: { balance: { increment: instructorShare } },
        });

        await tx.transaction.create({
          data: {
            walletId: instructorWallet.id,
            amount: instructorShare,
            type: "TOPUP",
            description: `Doanh thu bán khóa học: ${course.title} (${creatorTier.rankName} - ${creatorTier.commissionPercent}%, sau giảm giá)`,
            relatedCourseId: course.id,
          },
        });

        // Credit to Admin
        if (adminUser) {
          let adminWallet = await tx.creditWallet.findUnique({
            where: { userId: adminUser.id },
          });
          if (!adminWallet) {
            adminWallet = await tx.creditWallet.create({
              data: { userId: adminUser.id, balance: 0 },
            });
          }

          await tx.creditWallet.update({
            where: { id: adminWallet.id },
            data: { balance: { increment: adminShare } },
          });

          await tx.transaction.create({
            data: {
              walletId: adminWallet.id,
              amount: adminShare,
              type: "TOPUP",
              description: `Phí chia sẻ doanh thu từ khóa học: ${course.title} (${creatorTier.rankName} - ${creatorTier.adminSharePercent}%, sau giảm giá)`,
              relatedCourseId: course.id,
            },
          });
        }
      }
    }

    // 5. Log Coupon usage
    if (coupon) {
      await tx.couponUsage.create({
        data: {
          couponId: coupon.id,
          userId: session.user!.id,
        },
      });

      await tx.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 6. Create enrollment
    await tx.enrollment.create({
      data: {
        userId: session.user!.id,
        courseId: course.id,
        progress: 0,
      },
    });

    // 7. Award Reward Points to Student (10% of actual price paid, minimum 0)
    const pointsToAward = Math.floor(finalPrice / 10);
    if (pointsToAward > 0) {
      await tx.user.update({
        where: { id: session.user!.id },
        data: {
          points: { increment: pointsToAward },
          pointsEarned: { increment: pointsToAward },
        },
      });
    }
  });

  if (isHtmlRequest) {
    return NextResponse.redirect(new URL(`/courses/${slug}`, req.url), 303);
  }

  return NextResponse.json({ success: true, message: "Mua khóa học thành công!" });
}
