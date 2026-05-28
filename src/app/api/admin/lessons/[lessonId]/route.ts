import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const lessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  videoUrl: z.string().url(),
  videoType: z.enum(["YOUTUBE", "VIMEO", "S3"]),
  duration: z.number().nullable().optional(),
  orderIndex: z.number().min(1),
  isFree: z.boolean(),
  isGated: z.boolean(),
});

async function requireAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === "ADMIN";
}

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ lesson });
}

export async function PUT(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const result = lessonSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: result.data,
  });

  return NextResponse.json({ lesson });
}
