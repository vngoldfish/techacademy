import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { QuizForm } from "@/components/quiz/QuizForm";
import Link from "next/link";
import { submitQuizAttempt } from "@/lib/quiz-actions";

interface PageProps {
  params: Promise<{ quizId: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { quizId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      description: true,
      quizType: true,
      passScore: true,
      courseId: true,
      duration: true,
      lessonId: true,
      questions: {
        orderBy: { orderIndex: "asc" },
        select: { id: true, text: true, options: true },
      },
      attempts: {
        where: { userId: session.user.id },
        orderBy: { startedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!quiz) notFound();

  const questions = quiz.questions.map((q) => ({
    ...q,
    options: q.options as { label: string; text: string }[],
  }));

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {quiz.lessonId && (
        <div className="mb-4">
          <Link
            href={`/learn/${quiz.courseId}/lesson/${quiz.lessonId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            ← Quay lại bài học
          </Link>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
        {quiz.description && <p className="mt-2 text-gray-600">{quiz.description}</p>}
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-gray-500">{quiz.questions.length} câu hỏi</span>
          <span className="text-sm text-gray-500">Đạt: {quiz.passScore}%</span>
          {quiz.duration > 0 && <span className="text-sm text-gray-500">Thời gian: {quiz.duration} phút</span>}
        </div>
      </div>

      {quiz.attempts.length > 0 && (
        <div className="mb-6 rounded-lg border p-4">
          <p className="text-sm font-medium text-gray-700">Lần thử gần nhất:</p>
          <p className={`text-lg font-bold ${quiz.attempts[0].passed ? "text-green-600" : "text-red-600"}`}>
            {quiz.attempts[0].score}% — {quiz.attempts[0].passed ? "Đạt" : "Chưa đạt"}
          </p>
        </div>
      )}

      <QuizForm
        quizId={quiz.id}
        title={quiz.title}
        questions={questions}
        passScore={quiz.passScore}
        duration={quiz.duration}
        lessonId={quiz.lessonId ?? undefined}
        courseId={quiz.courseId}
        onSubmit={async (answers) => {
          "use server";
          return submitQuizAttempt(quiz.id, answers);
        }}
      />
    </div>
  );
}
