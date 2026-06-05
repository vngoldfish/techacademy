import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(1, "Tên không được trống"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và dấu gạch ngang"),
  description: z.string().optional(),
  priceCredit: z.number().min(0, "Giá không được âm"),
  category: z.string().min(1, "Chủ đề không được trống").optional(),
});

export async function POST(req: Request) {
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

  const body = await req.json();
  console.log("POST /api/admin/courses - Session User:", session.user);
  const result = courseSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const existing = await prisma.course.findUnique({ where: { slug: result.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
  }

  const course = await prisma.course.create({
    data: {
      ...result.data,
      description: result.data.description ?? null,
      category: result.data.category ?? "Web Development",
      creatorId: session.user.id,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
