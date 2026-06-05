import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const assignmentSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().min(1, "Mô tả không được trống"),
  isRequired: z.boolean().default(true),
});

async function checkLessonAccess(lessonId: string) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return { authorized: false, status: 401, error: "Unauthorized" };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { session: { include: { course: true } } }
  });

  if (!lesson) {
    return { authorized: false, status: 404, error: "Not found" };
  }

  if (session.user.role === "INSTRUCTOR" && lesson.session.course.creatorId !== session.user.id) {
    return { authorized: false, status: 403, error: "Forbidden" };
  }

  return { authorized: true };
}

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const access = await checkLessonAccess(lessonId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const assignment = await prisma.assignment.findUnique({ where: { lessonId } });
  return NextResponse.json({ assignment });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const access = await checkLessonAccess(lessonId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const result = assignmentSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const assignment = await prisma.assignment.upsert({
    where: { lessonId },
    update: result.data,
    create: { ...result.data, lessonId },
  });

  return NextResponse.json({ assignment });
}
