import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const lessonSchema = z.object({
  title: z.string().min(1, "Tiêu đề bài học không được để trống"),
  description: z.string().nullable().optional(),
  videoUrl: z.string().optional().default(""),
  videoType: z.enum(["YOUTUBE", "VIMEO", "S3"]).optional().default("YOUTUBE"),
  type: z.enum(["VIDEO", "DOCUMENT", "QUIZ"]).optional().default("VIDEO"),
  duration: z.number().nullable().optional(),
  orderIndex: z.number().min(1, "Thứ tự bài học phải từ 1 trở lên").optional(),
  isFree: z.boolean().optional(),
  isGated: z.boolean().optional(),
  isInteractiveVideo: z.boolean().optional(),
  subtitleUrl: z.string().nullable().optional(),
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
    return { authorized: false, status: 404, error: "Not found", lesson: null };
  }

  if (session.user.role === "INSTRUCTOR" && lesson.session.course.creatorId !== session.user.id) {
    return { authorized: false, status: 403, error: "Forbidden", lesson };
  }

  return { authorized: true, lesson };
}

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const access = await checkLessonAccess(lessonId);
  if (!access.authorized) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  return NextResponse.json({ lesson: access.lesson });
}

export async function PUT(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const access = await checkLessonAccess(lessonId);
  if (!access.authorized || !access.lesson) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = await req.json();
  const result = lessonSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const updatedLesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: result.data,
  });

  if (result.data.type === "QUIZ") {
    const existingQuiz = await prisma.quiz.findUnique({
      where: { lessonId: lessonId }
    });
    if (!existingQuiz) {
      await prisma.quiz.create({
        data: {
          courseId: access.lesson.session.courseId,
          title: `Bài kiểm tra: ${result.data.title}`,
          description: result.data.description ?? "",
          lessonId: lessonId,
          passScore: 60,
          duration: result.data.duration ? Math.ceil(result.data.duration / 60) : 0,
        }
      });
    }
  }

  return NextResponse.json({ lesson: updatedLesson });
}
