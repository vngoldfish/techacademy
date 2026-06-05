import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const courseId = searchParams.get("courseId");

    if (!code) {
      return NextResponse.json({ valid: false, error: "Vui lòng nhập mã giảm giá." }, { status: 400 });
    }
    if (!courseId) {
      return NextResponse.json({ valid: false, error: "Không tìm thấy thông tin khóa học." }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // 1. Fetch Coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: uppercaseCode },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Mã giảm giá không tồn tại." });
    }

    // 2. Check Expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "Mã giảm giá đã hết hạn sử dụng." });
    }

    // 3. Check usage limit
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "Mã giảm giá đã hết lượt sử dụng." });
    }

    // 4. Check if coupon is course-specific and matches
    if (coupon.courseId && coupon.courseId !== courseId) {
      return NextResponse.json({ valid: false, error: "Mã giảm giá không áp dụng cho khóa học này." });
    }

    // 5. Check if user already used this coupon
    if (session?.user?.id) {
      const existingUsage = await prisma.couponUsage.findUnique({
        where: {
          couponId_userId: {
            couponId: coupon.id,
            userId: session.user.id,
          },
        },
      });

      if (existingUsage) {
        return NextResponse.json({ valid: false, error: "Bạn đã sử dụng mã giảm giá này rồi." });
      }
    }

    // 6. Fetch course price to calculate discounts
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { priceCredit: true },
    });

    if (!course) {
      return NextResponse.json({ valid: false, error: "Khóa học không tồn tại." });
    }

    const originalPrice = course.priceCredit;
    const discountAmount = Math.floor(originalPrice * (coupon.discountPercent / 100));
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountAmount,
      finalPrice,
    });
  } catch (error) {
    console.error("[Validate Coupon API] Error:", error);
    return NextResponse.json({ valid: false, error: "Lỗi hệ thống khi xác thực mã." }, { status: 550 });
  }
}
