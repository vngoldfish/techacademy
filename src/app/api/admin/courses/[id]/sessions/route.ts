import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const sessionSchema = z.object({
  title: z.string().min(1, "Tiêu đề buổi học không được để trống"),
  description: z.string().optional(),
  orderIndex: z.number().min(1, "Thứ tự buổi học phải từ 1 trở lên").optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessions = await prisma.session.findMany({
    where: { courseId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = sessionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const { orderIndex: inputOrderIndex, ...sessionData } = result.data;

    // Calculate orderIndex if not provided
    const orderIndex = (inputOrderIndex !== undefined && inputOrderIndex !== null)
      ? inputOrderIndex
      : await prisma.session.aggregate({
          where: { courseId },
          _max: { orderIndex: true },
        }).then(res => (res._max.orderIndex ?? 0) + 1);

    // Generate random session code/ID (SES-XXXXXX)
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomCode = "";
    for (let i = 0; i < 6; i++) {
      randomCode += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    const sessionId = `SES-${randomCode}`;

    const newSession = await prisma.session.create({
      data: {
        id: sessionId,
        ...sessionData,
        description: sessionData.description ?? null,
        orderIndex,
        courseId,
      },
    });

    // Generate notifications for enrolled students
    try {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId },
        select: { userId: true },
      });

      if (enrollments.length > 0) {
        await prisma.notification.createMany({
          data: enrollments.map((enrollment) => ({
            userId: enrollment.userId,
            title: "Buổi học mới được thêm",
            message: `Buổi học "${newSession.title}" vừa được thêm vào khóa học "${course.title}".`,
            type: "SESSION_ADDED",
            link: `/courses/${course.slug}`,
          })),
        });
      }
    } catch (error) {
      console.error("Failed to generate session added notifications:", error);
    }

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Thứ tự buổi học đã tồn tại trong khóa học này. Vui lòng nhập số thứ tự khác." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Đã xảy ra lỗi khi tạo buổi học" }, { status: 500 });
  }
}
