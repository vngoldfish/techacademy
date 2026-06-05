import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const user = session?.user;

    if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Mã giảm giá không tồn tại" }, { status: 404 });
    }

    // Authorization: Instructors can only delete their own coupons
    if (user.role === "INSTRUCTOR" && coupon.creatorId !== user.id) {
      return NextResponse.json({ error: "Bạn không có quyền xóa mã giảm giá này" }, { status: 403 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Xóa mã giảm giá thành công" });
  } catch (error) {
    console.error("[Delete Coupon API Error]:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa mã giảm giá" }, { status: 550 });
  }
}
