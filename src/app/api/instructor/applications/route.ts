import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const applicationSchema = z.object({
  message: z.string().max(1000, "Nội dung tối đa 1000 ký tự").optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  const application = await prisma.instructorApplication.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true, message: true, reviewedAt: true, createdAt: true },
  });

  return NextResponse.json({ application });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
  }

  if (session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR") {
    return NextResponse.json({ error: "Tài khoản đã có quyền đăng khóa học" }, { status: 400 });
  }

  const body = await req.json();
  const result = applicationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.instructorApplication.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  });

  if (existing?.status === "PENDING") {
    return NextResponse.json({ error: "Bạn đã có yêu cầu đang chờ duyệt" }, { status: 409 });
  }

  if (existing?.status === "APPROVED") {
    return NextResponse.json({ error: "Yêu cầu nâng cấp đã được duyệt" }, { status: 409 });
  }

  const application = await prisma.instructorApplication.upsert({
    where: { userId: session.user.id },
    update: {
      status: "PENDING",
      message: result.data.message || null,
      reviewedAt: null,
      reviewerId: null,
    },
    create: {
      userId: session.user.id,
      message: result.data.message || null,
    },
    select: { id: true, status: true, message: true, reviewedAt: true, createdAt: true },
  });

  // Query all users with role 'ADMIN' and create notifications for them
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const displayName = session.user.name || session.user.email || "Học viên";

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Yêu cầu Giảng viên mới",
          message: `Học viên ${displayName} đã gửi đơn đăng ký làm Giảng viên.`,
          type: "APPLICATION_SUBMITTED",
          link: "/admin/instructor-applications",
        })),
      });
    }
  } catch (error) {
    console.error("Failed to create notifications for admin:", error);
  }

  return NextResponse.json({ application }, { status: 201 });
}
