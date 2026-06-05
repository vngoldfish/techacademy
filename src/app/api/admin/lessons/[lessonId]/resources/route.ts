import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  orderIndex: z.number().min(1).default(1),
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

  const resources = await prisma.lessonResource.findMany({
    where: { lessonId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ resources });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const access = await checkLessonAccess(lessonId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const result = resourceSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const resource = await prisma.lessonResource.create({
    data: { ...result.data, lessonId },
  });

  return NextResponse.json({ resource }, { status: 201 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const access = await checkLessonAccess(lessonId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const result = resourceSchema.safeParse(data);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const resource = await prisma.lessonResource.update({
    where: { id, lessonId },
    data: result.data,
  });

  return NextResponse.json({ resource });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const access = await checkLessonAccess(lessonId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  if (!resourceId) return NextResponse.json({ error: "Thiếu resourceId" }, { status: 400 });

  await prisma.lessonResource.delete({
    where: { id: resourceId, lessonId },
  });

  return NextResponse.json({ success: true });
}

