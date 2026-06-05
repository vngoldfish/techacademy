import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function submitQuizAttempt(quizId: string, answers: Record<string, string>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      passScore: true,
      quizType: true,
      lessonId: true,
      questions: { select: { id: true, correctAnswer: true } },
    },
  });

  if (!quiz) throw new Error("Quiz not found");

  const results = quiz.questions.map((q) => ({
    questionId: q.id,
    selectedAnswer: answers[q.id] || "",
    correctAnswer: q.correctAnswer,
    isCorrect: answers[q.id] === q.correctAnswer,
  }));

  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passScore;

  await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      quizId,
      answers: answers as any,
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

  return {
    score,
    passed,
    results,
  };
}
