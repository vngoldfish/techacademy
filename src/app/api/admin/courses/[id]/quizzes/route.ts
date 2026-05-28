import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const questionSchema = z.object({
  text: z.string().min(1),
  options: z.array(z.object({ label: z.string(), text: z.string() })).min(2),
  correctAnswer: z.string().min(1),
});

const quizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  quizType: z.enum(["MIDTERM", "FINAL"]),
  passScore: z.number().min(0).max(100),
  questions: z.array(questionSchema).min(1),
});

async function requireAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === "ADMIN";
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: courseId } = await params;
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
