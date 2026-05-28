import { prisma } from "@/lib/db";
import { CourseGrid } from "@/components/course/CourseGrid";
import { auth } from "@/lib/auth";

export default async function CoursesPage() {
  const session = await auth();

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceCredit: true,
      creator: { select: { name: true } },
      sessions: {
        select: {
          lessons: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const coursesWithCount = courses.map((course) => ({
    ...course,
    lessonsCount: course.sessions.reduce((acc, s) => acc + s.lessons.length, 0),
    sessions: undefined,
  }));

  let enrolledCourseIds: string[] = [];
  if (session?.user?.id) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true },
    });
    enrolledCourseIds = enrollments.map((e) => e.courseId);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Khóa học</h1>
        <p className="mt-2 text-gray-600">
          Khám phá các khóa học lập trình chất lượng cao
        </p>
      </div>
      <CourseGrid courses={coursesWithCount} enrolledCourseIds={enrolledCourseIds} />
    </div>
  );
}
