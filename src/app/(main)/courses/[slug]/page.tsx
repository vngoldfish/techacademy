import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { SessionList } from "@/components/course/SessionList";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceCredit: true,
      creator: { select: { name: true, avatarUrl: true } },
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
              isFree: true,
              isGated: true,
              duration: true,
            },
          },
        },
      },
      quizzes: {
        select: { id: true, title: true, quizType: true },
      },
    },
  });

  if (!course) notFound();

  let isEnrolled = false;
  let progress = 0;
  if (session?.user?.id) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
    isEnrolled = !!enrollment;
    progress = enrollment?.progress ?? 0;
  }

  const totalLessons = course.sessions.reduce(
    (acc, s) => acc + s.lessons.length, 0
  );

  const sessionsWithProgress = isEnrolled
    ? course.sessions.map((s) => ({
        ...s,
        lessons: s.lessons.map((l) => ({ ...l, completed: false })),
      }))
    : course.sessions;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero */}
          <div>
            {course.thumbnailUrl && (
              <div className="relative aspect-video overflow-hidden rounded-lg mb-6">
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.description && (
              <p className="mt-4 text-gray-600 whitespace-pre-line">{course.description}</p>
            )}
          </div>

          <Separator />

          {/* Course content */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Nội dung khóa học
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {course.sessions.length} buổi · {totalLessons} bài học
            </p>
            <SessionList
              sessions={sessionsWithProgress}
              isEnrolled={isEnrolled}
              courseSlug={course.slug}
            />
          </div>

          {/* Quizzes */}
          {course.quizzes.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Kiểm tra
                </h2>
                <div className="space-y-3">
                  {course.quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{quiz.title}</p>
                        <Badge variant="secondary" className="mt-1">
                          {quiz.quizType === "MIDTERM" ? "Giữa khóa" : "Cuối khóa"}
                        </Badge>
                      </div>
                      {isEnrolled && (
                        <a href={`/quiz/${quiz.id}`}>
                          <Button size="sm">Làm bài</Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-lg border p-6 space-y-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(course.priceCredit)}
              </p>
            </div>

            {isEnrolled ? (
              <div className="space-y-3">
                <div className="text-center">
                  <Badge className="bg-green-600">Đã đăng ký</Badge>
                  <p className="mt-2 text-sm text-gray-500">
                    Tiến độ: {Math.round(progress)}%
                  </p>
                </div>
                <a href={`/learn/${course.id}`}>
                  <Button className="w-full" size="lg">
                    Tiếp tục học
                  </Button>
                </a>
              </div>
            ) : session?.user ? (
              <form action={`/api/courses/${course.slug}/purchase`} method="POST">
                <Button className="w-full" size="lg" type="submit">
                  Mua khóa học
                </Button>
              </form>
            ) : (
              <a href="/signin">
                <Button className="w-full" size="lg">
                  Đăng nhập để mua
                </Button>
              </a>
            )}

            <Separator />

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Số buổi</span>
                <span className="font-medium">{course.sessions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Số bài học</span>
                <span className="font-medium">{totalLessons}</span>
              </div>
              {course.creator && (
                <div className="flex justify-between">
                  <span>Giảng viên</span>
                  <span className="font-medium">{course.creator.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
