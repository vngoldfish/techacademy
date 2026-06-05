import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const roadmapSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  level: z.string().min(1, "Cấp độ không được trống"),
  description: z.string().min(1, "Mô tả không được trống"),
  summary: z.string().min(1, "Tóm tắt không được trống"),
  steps: z.array(z.string()).min(1, "Lộ trình phải có ít nhất 1 bước"),
  badgeColor: z.enum(["blue", "purple", "indigo", "emerald", "rose"]).default("blue"),
  orderIndex: z.number().min(0).default(0),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const roadmap = await prisma.roadmap.findUnique({
    where: { id },
  });

  if (!roadmap) {
    return NextResponse.json({ error: "Lộ trình không tồn tại" }, { status: 404 });
  }

  return NextResponse.json({ roadmap });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const result = roadmapSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const existing = await prisma.roadmap.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lộ trình không tồn tại" }, { status: 404 });
    }

    const updated = await prisma.roadmap.update({
      where: { id },
      data: {
        ...result.data,
        steps: JSON.stringify(result.data.steps),
      },
    });

    return NextResponse.json({ roadmap: updated });
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi cập nhật lộ trình" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.roadmap.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lộ trình không tồn tại" }, { status: 404 });
    }

    await prisma.roadmap.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Xóa lộ trình thành công" });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xóa lộ trình" }, { status: 500 });
  }
}
