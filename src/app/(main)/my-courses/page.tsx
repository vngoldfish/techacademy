import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseCard } from "@/components/course/CourseCard";
import { Card, CardContent } from "@/components/ui/card";

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id },
    select: {
      enrolledAt: true,
      progress: true,
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          thumbnailUrl: true,
          priceCredit: true,
          creator: { select: { name: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Khóa học của tôi</h1>
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">Bạn chưa mua khóa học nào.</p>
            <a href="/courses" className="text-blue-600 hover:underline">
              Khám phá khóa học
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <div key={enrollment.course.id} className="relative">
              <CourseCard course={enrollment.course} isEnrolled />
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{Math.round(enrollment.progress)}% hoàn thành</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
