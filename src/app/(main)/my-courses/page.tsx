import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseCard } from "@/components/course/CourseCard";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Award, Compass, Layers } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
          sessions: {
            select: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Calculate lessons count for each course
  const enrollmentsWithCount = enrollments.map((item) => {
    const lessonsCount = item.course.sessions.reduce(
      (acc, s) => acc + s.lessons.length,
      0
    );
    return {
      ...item,
      course: {
        ...item.course,
        lessonsCount,
      },
    };
  });

  const inProgress = enrollmentsWithCount.filter((item) => item.progress < 100);
  const completed = enrollmentsWithCount.filter((item) => item.progress >= 100);

  function CourseList({ items }: { items: typeof enrollmentsWithCount }) {
    if (items.length === 0) {
      return (
        <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm max-w-lg mx-auto overflow-hidden">
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900">Không có khóa học nào</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              Mục này hiện đang trống. Hãy đăng ký thêm khóa học mới để bắt đầu tích lũy kiến thức nhé!
            </p>
            <div className="pt-2">
              <Link href="/courses">
                <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 px-5 py-2.5">
                  Khám phá khóa học ngay
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((enrollment) => (
          <div key={enrollment.course.id}>
            <CourseCard 
              course={enrollment.course} 
              isEnrolled={true} 
              progress={enrollment.progress} 
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
              <Layers className="h-7 w-7 text-blue-600" />
              Khóa học của tôi
            </h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi tiến độ, tiếp tục học tập và nâng cao chuyên môn của bạn.</p>
          </div>
          {enrollments.length > 0 && (
            <Link href="/courses">
              <Button variant="outline" className="rounded-xl font-bold border-slate-200 hover:bg-slate-50">
                <Compass className="h-4.5 w-4.5 mr-1 text-slate-500" />
                Tìm khóa học khác
              </Button>
            </Link>
          )}
        </div>

        {enrollments.length === 0 ? (
          <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm max-w-xl mx-auto overflow-hidden">
            <CardContent className="p-12 text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                <Award className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Bắt đầu hành trình học tập</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                Bạn chưa sở hữu khóa học nào tại BawuiAcademy. Hãy đăng ký ngay khóa học đầu tiên để bắt đầu học tập.
              </p>
              <div className="pt-3">
                <Link href="/courses">
                  <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 px-6 py-3">
                    Khám phá kho khóa học
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-8 p-1 bg-slate-100/80 rounded-xl w-fit flex gap-1 border border-slate-200/50">
              <TabsTrigger value="all" className="rounded-lg font-semibold text-xs px-4 py-2">
                Tất cả ({enrollments.length})
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="rounded-lg font-semibold text-xs px-4 py-2">
                Đang học ({inProgress.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg font-semibold text-xs px-4 py-2">
                Đã hoàn thành ({completed.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="focus-visible:outline-none">
              <CourseList items={enrollmentsWithCount} />
            </TabsContent>
            <TabsContent value="in-progress" className="focus-visible:outline-none">
              <CourseList items={inProgress} />
            </TabsContent>
            <TabsContent value="completed" className="focus-visible:outline-none">
              <CourseList items={completed} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
