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

const lessonSchema = z.object({
  title: z.string().min(1, "Tiêu đề bài học không được để trống"),
  description: z.string().optional(),
  videoUrl: z.string().optional().default(""),
  videoType: z.enum(["YOUTUBE", "VIMEO", "S3"]).optional().default("YOUTUBE"),
  type: z.enum(["VIDEO", "DOCUMENT", "QUIZ"]).optional().default("VIDEO"),
  duration: z.number().nullable().optional(),
  orderIndex: z.number().min(1, "Thứ tự bài học phải từ 1 trở lên").optional(),
  isFree: z.boolean().optional(),
  isGated: z.boolean().optional(),
  isInteractiveVideo: z.boolean().optional(),
  subtitleUrl: z.string().nullable().optional(),
  passScore: z.number().min(0, "Điểm đạt phải từ 0 đến 100").max(100, "Điểm đạt phải từ 0 đến 100").optional().default(60),
  questions: z.array(questionSchema).optional(),
  resources: z.array(z.object({
    title: z.string().min(1, "Tên tài liệu không được trống"),
    url: z.string().optional().nullable(),
    content: z.string().optional().nullable(),
  })).optional(),
  assignment: z.object({
    title: z.string().min(1, "Tiêu đề bài tập không được để trống"),
    description: z.string().min(1, "Mô tả bài tập không được để trống"),
    isRequired: z.boolean().optional().default(true),
  }).optional(),
});


export async function GET(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const activeSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { course: true }
  });
  if (!activeSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && activeSession.course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lessons = await prisma.lesson.findMany({
    where: { sessionId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ lessons });
}

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const activeSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { course: true }
  });
  if (!activeSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "INSTRUCTOR" && activeSession.course.creatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const result = lessonSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  try {
    const { questions, passScore, resources, assignment, orderIndex: inputOrderIndex, ...lessonData } = result.data;

    // Calculate orderIndex if not provided
    const orderIndex = (inputOrderIndex !== undefined && inputOrderIndex !== null)
      ? inputOrderIndex
      : await prisma.lesson.aggregate({
          where: { sessionId },
          _max: { orderIndex: true },
        }).then(res => (res._max.orderIndex ?? 0) + 1);

    // Calculate duration based on type: QUIZ expects minutes (so convert to seconds for Lesson)
    let lessonDurationSec = lessonData.duration ?? null;
    let quizDurationMin = 0;
    if (result.data.type === "QUIZ") {
      quizDurationMin = lessonData.duration ?? 0;
      lessonDurationSec = lessonData.duration ? lessonData.duration * 60 : null;
    }

    // Generate random lesson code/ID (LES-XXXXXX)
    const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomCode = "";
    for (let i = 0; i < 6; i++) {
      randomCode += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    const lessonId = `LES-${randomCode}`;

    const lesson = await prisma.lesson.create({
      data: {
        id: lessonId,
        ...lessonData,
        description: lessonData.description ?? null,
        duration: lessonDurationSec,
        isFree: lessonData.isFree ?? false,
        isGated: lessonData.isGated ?? false,
        orderIndex,
        sessionId,
      },
    });

    if (result.data.type === "QUIZ") {
      await prisma.quiz.create({
        data: {
          courseId: activeSession.courseId,
          title: `Bài kiểm tra: ${result.data.title}`,
          description: result.data.description ?? "",
          lessonId: lesson.id,
          passScore: passScore ?? 60,
          duration: quizDurationMin,
          questions: questions ? {
            create: questions.map((question, index) => ({
              text: question.text,
              options: question.options,
              correctAnswer: question.correctAnswer,
              orderIndex: index + 1,
            })),
          } : undefined,
        }
      });
    }

    if (resources && resources.length > 0) {
      await prisma.lessonResource.createMany({
        data: resources.map((r, index) => ({
          lessonId: lesson.id,
          title: r.title,
          url: r.url,
          content: r.content,
          orderIndex: index + 1,
        })),
      });
    }

    if (assignment) {
      await prisma.assignment.create({
        data: {
          lessonId: lesson.id,
          title: assignment.title,
          description: assignment.description,
          isRequired: assignment.isRequired,
        }
      });
    }

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "Thứ tự bài học đã tồn tại trong chương này. Vui lòng nhập số thứ tự khác." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Đã xảy ra lỗi khi tạo bài học" }, { status: 500 });
  }
}
