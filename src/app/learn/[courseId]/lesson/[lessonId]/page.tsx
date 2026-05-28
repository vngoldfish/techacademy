import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VideoPlayerWithNotes } from "@/components/video/VideoPlayerWithNotes";

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
    </div>
  );
}
