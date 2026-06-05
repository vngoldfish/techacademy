import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, discountPercent, maxUses, expiresAt, courseId } = body;

    // 1. Basic validation
    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json({ error: "Mã giảm giá không được để trống" }, { status: 400 });
    }

    const cleanedCode = code.trim().toUpperCase();

    // Regex check to avoid special characters in code
    if (!/^[A-Z0-9_-]+$/.test(cleanedCode)) {
      return NextResponse.json(
        { error: "Mã giảm giá chỉ được chứa chữ cái, số, dấu gạch ngang (-) và gạch dưới (_)" },
        { status: 400 }
      );
    }

    const pct = parseInt(discountPercent, 10);
    if (isNaN(pct) || pct < 10 || pct > 90) {
      return NextResponse.json({ error: "Tỷ lệ giảm giá phải từ 10% đến 90%" }, { status: 400 });
    }

    const maxU = parseInt(maxUses, 10);
    if (isNaN(maxU) || maxU <= 0) {
      return NextResponse.json({ error: "Số lượt sử dụng tối đa phải lớn hơn 0" }, { status: 400 });
    }

    let expiryDate: Date | null = null;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json({ error: "Ngày hết hạn không hợp lệ" }, { status: 400 });
      }
      if (expiryDate < new Date()) {
        return NextResponse.json({ error: "Ngày hết hạn phải ở tương lai" }, { status: 400 });
      }
    }

    // 2. Course-specific validation & Ownership check
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, creatorId: true },
      });

      if (!course) {
        return NextResponse.json({ error: "Khóa học được chọn không tồn tại" }, { status: 400 });
      }

      if (user.role === "INSTRUCTOR" && course.creatorId !== user.id) {
        return NextResponse.json(
          { error: "Bạn không có quyền tạo mã giảm giá cho khóa học của người khác" },
          { status: 403 }
        );
      }
    } else {
      // System-wide coupons are Admin-only
      if (user.role === "INSTRUCTOR") {
        return NextResponse.json(
          { error: "Giảng viên chỉ có quyền tạo mã giảm giá cho các khóa học của mình" },
          { status: 403 }
        );
      }
    }

    // 3. Check duplicate code
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: cleanedCode },
    });

    if (existingCoupon) {
      return NextResponse.json({ error: `Mã giảm giá '${cleanedCode}' đã tồn tại trong hệ thống` }, { status: 400 });
    }

    // 4. Create coupon
    const newCoupon = await prisma.coupon.create({
      data: {
        code: cleanedCode,
        discountPercent: pct,
        maxUses: maxU,
        expiresAt: expiryDate,
        courseId: courseId || null,
        creatorId: user.id,
      },
    });

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error) {
    console.error("[Create Coupon API Error]:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo mã giảm giá" }, { status: 550 });
  }
}
