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

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roadmaps = await prisma.roadmap.findMany({
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ roadmaps });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = roadmapSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const roadmap = await prisma.roadmap.create({
      data: {
        ...result.data,
        steps: JSON.stringify(result.data.steps),
      },
    });

    return NextResponse.json({ roadmap }, { status: 201 });
  } catch (error) {
    console.error("Error creating roadmap:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi tạo lộ trình" }, { status: 500 });
  }
}
