import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LessonSidebar } from "@/components/lesson/LessonSidebar";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}

export default async function LearnLayout({ children, params }: LayoutProps) {
  const { courseId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      sessions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          orderIndex: true,
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              orderIndex: true,
              isGated: true,
              isFree: true,
            },
          },
        },
      },
    },
  });

  if (!course) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  if (!enrollment) {
    redirect(`/courses`);
  }

  const progressRecords = await prisma.lessonProgress.findMany({
    where: { userId: session.user.id },
    select: { lessonId: true, completed: true, videoCompleted: true },
  });

  const progressByLesson = new Map(progressRecords.map((p) => [p.lessonId, p]));
  let previousIncomplete = false;

  const sessions = course.sessions.map((s) => ({
    ...s,
    lessons: s.lessons.map((l) => {
      const progress = progressByLesson.get(l.id);
      const locked = l.isGated && previousIncomplete;
      const completed = progress?.completed ?? false;
      if (!completed) previousIncomplete = true;
      return {
        ...l,
        completed,
        inProgress: !!progress?.videoCompleted && !completed,
        locked,
        isCurrent: false,
      };
    }),
  }));

  return (
    <div className="flex h-screen">
      <aside className="hidden w-72 shrink-0 border-r bg-white lg:block">
        <LessonSidebar sessions={sessions} courseId={course.id} currentLessonId="" />
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
