import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VideoPlayerWithNotes } from "@/components/video/VideoPlayerWithNotes";
import { LessonCompletionPanel } from "@/components/lesson/LessonCompletionPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizForm } from "@/components/quiz/QuizForm";
import { submitQuizAttempt } from "@/lib/quiz-actions";
import { Download, FileText } from "lucide-react";


interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/signin");

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      description: true,
      videoUrl: true,
      videoType: true,
      type: true,
      duration: true,
      orderIndex: true,
      isGated: true,
      session: { select: { courseId: true, title: true } },
      assignment: {
        select: {
          id: true,
          title: true,
          description: true,
          isRequired: true,
          submissions: {
            where: { userId: session.user.id },
            orderBy: { submittedAt: "desc" },
            take: 1,
            select: { id: true, content: true, status: true, feedback: true },
          },
        },
      },
      resources: {
        orderBy: { orderIndex: "asc" },
        select: { id: true, title: true, url: true, content: true },
      },
      quiz: {
        select: {
          id: true,
          title: true,
          passScore: true,
          duration: true,
          questions: {
            orderBy: { orderIndex: "asc" },
            select: { id: true, text: true, options: true },
          },
          attempts: {
            where: { userId: session.user.id },
            orderBy: { startedAt: "desc" },
            take: 1,
            select: { id: true, score: true, passed: true },
          },
        },
      },
    },
  });

  if (!lesson || lesson.session.courseId !== courseId) notFound();

  const [progress, notes] = await Promise.all([
    prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
    }),
    prisma.videoNote.findMany({
      where: { lessonId: lesson.id, userId: session.user.id },
      orderBy: { timestamp: "asc" },
    }),
  ]);

  // Query all lessons in the course to compute next and previous lesson IDs
  const allLessons = await prisma.lesson.findMany({
    where: { session: { courseId } },
    orderBy: [
      { session: { orderIndex: "asc" } },
      { orderIndex: "asc" }
    ],
    select: { id: true }
  });

  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
  const nextLessonId = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;

  if (lesson.isGated && !progress?.completed) {
    const prevLesson = await prisma.lesson.findFirst({
      where: { session: { courseId }, orderIndex: { lt: lesson.orderIndex } },
      orderBy: { orderIndex: "desc" },
      select: { id: true },
    });

    if (prevLesson) {
      const prevProgress = await prisma.lessonProgress.findUnique({
        where: { userId_lessonId: { userId: session.user.id, lessonId: prevLesson.id } },
      });
      if (!prevProgress?.completed) {
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Bài học bị khóa</h2>
              <p className="mt-2 text-gray-600">Hoàn thành bài trước để mở khóa.</p>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-3">
        <p className="text-sm text-gray-500">{lesson.session.title}</p>
        <h1 className="text-lg font-semibold text-gray-900">{lesson.title}</h1>
      </div>
      
      {lesson.type === "VIDEO" ? (
        <div className="flex-1">
          <VideoPlayerWithNotes
            lessonId={lesson.id}
            videoUrl={lesson.videoUrl}
            videoType={lesson.videoType as "YOUTUBE" | "VIMEO" | "S3"}
            initialNotes={notes}
            initialPosition={progress?.lastPosition ?? 0}
          />
        </div>
      ) : lesson.type === "DOCUMENT" ? (
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 via-white to-slate-50">
          <div className="max-w-3xl mx-auto rounded-2xl border border-white/20 bg-white/60 p-8 shadow-xl backdrop-blur-md">
            <div className="prose prose-slate max-w-none dark:prose-invert">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-4">Tài liệu học tập</h2>
              <div className="text-slate-700 leading-relaxed space-y-6 text-lg whitespace-pre-wrap">
                {lesson.description || "Bài học này chưa có nội dung tài liệu."}
              </div>
            </div>
          </div>
        </div>
      ) : lesson.type === "QUIZ" ? (
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="max-w-3xl mx-auto space-y-6">
            {lesson.quiz?.attempts && lesson.quiz.attempts.length > 0 && (
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-700">Lần thử gần nhất:</p>
                <p className={`text-lg font-bold ${lesson.quiz.attempts[0].passed ? "text-green-600" : "text-red-600"}`}>
                  {lesson.quiz.attempts[0].score}% — {lesson.quiz.attempts[0].passed ? "Đạt" : "Chưa đạt"}
                </p>
              </div>
            )}
            {lesson.quiz ? (
              <QuizForm
                quizId={lesson.quiz.id}
                title={lesson.quiz.title}
                questions={lesson.quiz.questions.map((q) => ({
                  ...q,
                  options: q.options as { label: string; text: string }[],
                }))}
                passScore={lesson.quiz.passScore}
                duration={lesson.quiz.duration}
                lessonId={lesson.id}
                courseId={courseId}
                onSubmit={async (answers) => {
                  "use server";
                  return submitQuizAttempt(lesson.quiz!.id, answers);
                }}
              />
            ) : (
              <div className="text-center p-8 bg-white rounded-xl shadow-sm border">
                <h2 className="text-lg font-semibold text-gray-900">Chưa có câu hỏi trắc nghiệm</h2>
                <p className="mt-2 text-gray-600">Giảng viên chưa cập nhật câu hỏi cho bài kiểm tra này.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 border-t bg-white p-6 lg:grid-cols-2">
        <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
            <CardTitle className="text-sm font-bold text-slate-800">Tài liệu bài học</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {lesson.description && <p className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed">{lesson.description}</p>}
            {lesson.resources.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium">Chưa có tài liệu đính kèm.</p>
            ) : (
              <div className="grid gap-3">
                {lesson.resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-xl shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">{resource.title}</p>
                        {resource.content && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{resource.content}</p>
                        )}
                      </div>
                    </div>
                    {resource.url && (
                      <a 
                        href={resource.url} 
                        download={resource.title}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 transition-all shrink-0"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download className="h-3.5 w-3.5" /> Tải về
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <LessonCompletionPanel
          lessonId={lesson.id}
          videoCompleted={progress?.videoCompleted ?? false}
          completed={progress?.completed ?? false}
          assignment={lesson.assignment ? {
            id: lesson.assignment.id,
            title: lesson.assignment.title,
            description: lesson.assignment.description,
            isRequired: lesson.assignment.isRequired,
          } : null}
          submission={lesson.assignment?.submissions[0] ?? null}
          quiz={lesson.quiz ?? null}
          prevLessonId={prevLessonId}
          nextLessonId={nextLessonId}
          courseId={courseId}
        />
      </div>
    </div>
  );
}
