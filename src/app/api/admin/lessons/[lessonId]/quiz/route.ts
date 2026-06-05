import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const questionSchema = z.object({
  text: z.string().min(1, "Nội dung câu hỏi không được để trống"),
  options: z.array(z.object({ 
    label: z.string().min(1, "Nhãn lựa chọn không được để trống"), 
    text: z.string().min(1, "Nội dung lựa chọn không được để trống") 
  })).min(2, "Mỗi câu hỏi phải có ít nhất 2 lựa chọn"),
  correctAnswer: z.string().min(1, "Đáp án đúng không được để trống"),
});

const quizSchema = z.object({
  title: z.string().min(1, "Tiêu đề bài kiểm tra không được để trống"),
  description: z.string().optional().nullable(),
  passScore: z.number().min(0, "Điểm đạt phải từ 0 đến 100").max(100, "Điểm đạt phải từ 0 đến 100"),
  duration: z.number().int().min(0, "Thời gian làm bài không được âm").optional(),
  questions: z.array(questionSchema).min(1, "Danh sách câu hỏi không được để trống"),
});

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      session: {
        include: {
          course: true,
        },
      },
    },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && lesson.session.course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  return NextResponse.json({ quiz });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      session: {
        include: {
          course: true,
        },
      },
    },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && lesson.session.course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = quizSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const { title, description, passScore, duration, questions } = result.data;
  const courseId = lesson.session.courseId;

  const quiz = await prisma.$transaction(async (tx) => {
    // Sync duration to Lesson: duration in minutes * 60 (or null if 0)
    await tx.lesson.update({
      where: { id: lessonId },
      data: {
        duration: duration ? duration * 60 : null,
      },
    });

    const existingQuiz = await tx.quiz.findUnique({
      where: { lessonId },
    });

    if (existingQuiz) {
      await tx.question.deleteMany({
        where: { quizId: existingQuiz.id },
      });

      return await tx.quiz.update({
        where: { id: existingQuiz.id },
        data: {
          title,
          description: description ?? null,
          passScore,
          duration: duration ?? 0,
          questions: {
            create: questions.map((q, idx) => ({
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              orderIndex: idx + 1,
            })),
          },
        },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    } else {
      return await tx.quiz.create({
        data: {
          courseId,
          lessonId,
          title,
          description: description ?? null,
          quizType: "LESSON",
          passScore,
          duration: duration ?? 0,
          questions: {
            create: questions.map((q, idx) => ({
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              orderIndex: idx + 1,
            })),
          },
        },
        include: {
          questions: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    }
  });

  return NextResponse.json({ quiz });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      session: {
        include: {
          course: true,
        },
      },
    },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && lesson.session.course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const quiz = await prisma.quiz.findUnique({
    where: { lessonId },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }

  await prisma.quiz.delete({
    where: { id: quiz.id },
  });

  return NextResponse.json({ message: "Quiz deleted successfully" });
}
