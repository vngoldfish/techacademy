import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VideoPlayerWithNotes } from "@/components/video/VideoPlayerWithNotes";
import { LessonCompletionPanel } from "@/components/lesson/LessonCompletionPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="flex-1">
        <VideoPlayerWithNotes
          lessonId={lesson.id}
          videoUrl={lesson.videoUrl}
          videoType={lesson.videoType as "YOUTUBE" | "VIMEO" | "S3"}
          initialNotes={notes}
          initialPosition={progress?.lastPosition ?? 0}
        />
      </div>
      <div className="grid gap-4 border-t bg-white p-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tài liệu bài học</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lesson.description && <p className="whitespace-pre-wrap text-sm text-gray-600">{lesson.description}</p>}
            {lesson.resources.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có tài liệu bổ sung.</p>
            ) : (
              lesson.resources.map((resource) => (
                <div key={resource.id} className="rounded-lg border p-3">
                  <p className="font-medium text-gray-900">{resource.title}</p>
                  {resource.url && (
                    <a href={resource.url} className="text-sm text-blue-600 hover:underline" target="_blank">
                      {resource.url}
                    </a>
                  )}
                  {resource.content && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{resource.content}</p>}
                </div>
              ))
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
        />
      </div>
    </div>
  );
}
