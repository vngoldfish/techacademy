import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const attemptSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId } = await params;
  const body = await req.json();
  const result = attemptSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      passScore: true,
      quizType: true,
      lessonId: true,
      questions: { select: { id: true, correctAnswer: true } },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = quiz.questions.map((q) => ({
    questionId: q.id,
    selectedAnswer: result.data.answers[q.id] || "",
    correctAnswer: q.correctAnswer,
    isCorrect: result.data.answers[q.id] === q.correctAnswer,
  }));

  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passScore;

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      answers: result.data.answers as any,
      score,
      passed,
      completedAt: new Date(),
    },
  });

  if (passed && quiz.lessonId) {
    await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: quiz.lessonId,
        },
      },
      update: {
        completed: true,
        videoCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        lessonId: quiz.lessonId,
        completed: true,
        videoCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ attempt: { id: attempt.id, score, passed }, results });
}
