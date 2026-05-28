import { prisma } from "@/lib/db";

export async function getCourseProgress(userId: string, courseId: string) {
  const lessons = await prisma.lesson.findMany({
    where: { session: { courseId } },
    select: { id: true },
  });

  if (lessons.length === 0) return 0;

  const completedCount = await prisma.lessonProgress.count({
    where: {
      userId,
      completed: true,
      lessonId: { in: lessons.map((lesson) => lesson.id) },
    },
  });

  return Math.round((completedCount / lessons.length) * 100);
}

export async function updateEnrollmentProgress(userId: string, courseId: string) {
  const progress = await getCourseProgress(userId, courseId);

  await prisma.enrollment.updateMany({
    where: { userId, courseId },
    data: { progress },
  });

  return progress;
}

export async function completeLessonIfEligible(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      session: { select: { courseId: true } },
      assignment: { select: { id: true, isRequired: true } },
    },
  });

  if (!lesson) return null;

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: {},
  });

  let assignmentDone = progress.assignmentDone;

  if (lesson.assignment?.isRequired) {
    const approvedSubmission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId: lesson.assignment.id, userId } },
      select: { status: true },
    });
    assignmentDone = approvedSubmission?.status === "APPROVED";
  } else {
    assignmentDone = true;
  }

  const completed = progress.videoCompleted && assignmentDone;

  const updatedProgress = await prisma.lessonProgress.update({
    where: { userId_lessonId: { userId, lessonId } },
    data: {
      assignmentDone,
      completed,
      completedAt: completed ? (progress.completedAt ?? new Date()) : null,
    },
  });

  const courseProgress = await updateEnrollmentProgress(userId, lesson.session.courseId);

  return { progress: updatedProgress, courseProgress };
}

export async function getLessonCompletionState(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      assignment: {
        select: {
          id: true,
          isRequired: true,
          submissions: {
            where: { userId },
            orderBy: { submittedAt: "desc" },
            take: 1,
            select: { id: true, status: true, feedback: true, content: true },
          },
        },
      },
      progress: {
        where: { userId },
        take: 1,
        select: { videoCompleted: true, assignmentDone: true, completed: true, lastPosition: true },
      },
    },
  });

  const progress = lesson?.progress[0] ?? null;
  const submission = lesson?.assignment?.submissions[0] ?? null;

  return {
    progress,
    assignment: lesson?.assignment ?? null,
    submission,
    completed: progress?.completed ?? false,
  };
}
