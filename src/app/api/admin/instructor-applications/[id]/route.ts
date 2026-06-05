import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = reviewSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { id } = await params;
  const application = await prisma.instructorApplication.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  }

  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "Yêu cầu này đã được xử lý" }, { status: 409 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email || "" },
    select: { id: true },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "Không tìm thấy tài khoản admin hợp lệ" }, { status: 400 });
  }

  const reviewedAt = new Date();
  const updatedApplication = await prisma.$transaction(async (tx) => {
    if (result.data.action === "APPROVE") {
      await tx.user.update({
        where: { id: application.userId },
        data: {
          role: "INSTRUCTOR",
          instructorActive: true,
          instructorExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // first 30 days free
        },
      });
    }

    const updated = await tx.instructorApplication.update({
      where: { id },
      data: {
        status: result.data.action === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewedAt,
        reviewerId: adminUser.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.notification.create({
      data: {
        userId: application.userId,
        title: result.data.action === "APPROVE" ? "Yêu cầu Giảng viên được Phê duyệt" : "Yêu cầu Giảng viên bị Từ chối",
        message: result.data.action === "APPROVE"
          ? "Chúc mừng! Đơn đăng ký làm Giảng viên của bạn đã được phê duyệt. Bạn đã có thể tạo khóa học mới."
          : "Rất tiếc, yêu cầu nâng cấp làm Giảng viên của bạn đã bị từ chối.",
        type: result.data.action === "APPROVE" ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED",
        link: "/profile",
      },
    });

    return updated;
  });

  return NextResponse.json({ application: updatedApplication });
}
