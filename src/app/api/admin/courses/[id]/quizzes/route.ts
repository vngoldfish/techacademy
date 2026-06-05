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
  description: z.string().optional(),
  quizType: z.enum(["MIDTERM", "FINAL"]),
  passScore: z.number().min(0, "Điểm đạt phải từ 0 đến 100").max(100, "Điểm đạt phải từ 0 đến 100"),
  duration: z.number().int().min(0, "Thời gian làm bài không được âm").optional(),
  questions: z.array(questionSchema).min(1, "Danh sách câu hỏi không được để trống"),
});

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
  const result = quizSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      title: result.data.title,
      description: result.data.description ?? null,
      quizType: result.data.quizType,
      passScore: result.data.passScore,
      duration: result.data.duration ?? 0,
      questions: {
        create: result.data.questions.map((question, index) => ({
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          orderIndex: index + 1,
        })),
      },
    },
  });

  return NextResponse.json({ quiz }, { status: 201 });
}
