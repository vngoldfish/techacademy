import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseCard } from "@/components/course/CourseCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  const inProgress = enrollments.filter((item) => item.progress < 100);
  const completed = enrollments.filter((item) => item.progress >= 100);

  function CourseList({ items }: { items: typeof enrollments }) {
    if (items.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-gray-500">Không có khóa học trong mục này.</p>
            <a href="/courses" className="text-blue-600 hover:underline">
              Khám phá khóa học
            </a>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((enrollment) => (
          <div key={enrollment.course.id}>
            <CourseCard course={enrollment.course} isEnrolled />
            <div className="mt-3 space-y-3">
              <div>
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${enrollment.progress}%` }} />
                </div>
                <p className="mt-1 text-xs text-gray-500">{Math.round(enrollment.progress)}% hoàn thành</p>
              </div>
              <a href={`/learn/${enrollment.course.id}`}>
                <Button className="w-full" size="sm">
                  {enrollment.progress >= 100 ? "Xem lại" : "Tiếp tục học"}
                </Button>
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Khóa học của tôi</h1>
        <p className="mt-2 text-gray-600">Theo dõi tiến độ và tiếp tục học các khóa đã mua.</p>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-4 text-gray-500">Bạn chưa mua khóa học nào.</p>
            <a href="/courses" className="text-blue-600 hover:underline">
              Khám phá khóa học
            </a>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">Tất cả ({enrollments.length})</TabsTrigger>
            <TabsTrigger value="in-progress">Đang học ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Đã hoàn thành ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <CourseList items={enrollments} />
          </TabsContent>
          <TabsContent value="in-progress">
            <CourseList items={inProgress} />
          </TabsContent>
          <TabsContent value="completed">
            <CourseList items={completed} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
