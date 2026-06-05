import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1, "Tiêu đề khóa học không được để trống").optional(),
  slug: z.string().min(1, "Slug không được để trống").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang").optional(),
  description: z.string().optional(),
  priceCredit: z.number().min(0, "Giá khóa học không được âm").optional(),
  isPublished: z.boolean().optional(),
  creatorId: z.string().optional(),
  category: z.string().min(1, "Danh mục không được để trống").optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { creator: { select: { id: true, name: true, email: true } } }
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let instructors: { id: string; name: string | null; email: string | null }[] = [];
  if (session.user.role === "ADMIN") {
    instructors = await prisma.user.findMany({
      where: { role: "INSTRUCTOR" },
      select: { id: true, name: true, email: true }
    });
  }

  return NextResponse.json({ course, instructors });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "INSTRUCTOR") {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { instructorActive: true, instructorExpiresAt: true },
    });
    const now = new Date();
    if (!dbUser || !dbUser.instructorActive || !dbUser.instructorExpiresAt || dbUser.instructorExpiresAt < now) {
      return NextResponse.json(
        { error: "Tài khoản Giảng viên đã hết hạn hoặc chưa kích hoạt. Vui lòng vào trang cá nhân gia hạn phí duy trì hàng tháng để tiếp tục." },
        { status: 403 }
      );
    }
  }

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  // Only ADMIN can change the creatorId
  const updateData = { ...result.data };
  if (updateData.creatorId && session.user.role !== "ADMIN") {
    delete updateData.creatorId;
  }

  if (updateData.slug) {
    const existing = await prisma.course.findFirst({ where: { slug: updateData.slug, NOT: { id } } });
    if (existing) return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
  }

  const updatedCourse = await prisma.course.update({ where: { id }, data: updateData });

  // Generate notifications for enrolled students
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: id },
      select: { userId: true },
    });

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((enrollment) => ({
          userId: enrollment.userId,
          title: "Cập nhật khóa học",
          message: `Khóa học "${updatedCourse.title}" bạn đang theo học đã được cập nhật thông tin mới.`,
          type: "COURSE_UPDATED",
          link: `/courses/${updatedCourse.slug}`,
        })),
      });
    }
  } catch (error) {
    console.error("Failed to generate course updated notifications:", error);
  }

  return NextResponse.json({ course: updatedCourse });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "INSTRUCTOR") {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { instructorActive: true, instructorExpiresAt: true },
    });
    const now = new Date();
    if (!dbUser || !dbUser.instructorActive || !dbUser.instructorExpiresAt || dbUser.instructorExpiresAt < now) {
      return NextResponse.json(
        { error: "Tài khoản Giảng viên đã hết hạn hoặc chưa kích hoạt. Vui lòng vào trang cá nhân gia hạn phí duy trì hàng tháng để tiếp tục." },
        { status: 403 }
      );
    }
  }

  const { id } = await params;
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
