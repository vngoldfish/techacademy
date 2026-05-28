import { redirect } from "next/navigation";
import { BookOpen, CheckCircle, Clock, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [enrollments, recentProgress, wallet] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      orderBy: { enrolledAt: "desc" },
      select: {
        enrolledAt: true,
        progress: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            priceCredit: true,
            thumbnailUrl: true,
          },
        },
      },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        lastPosition: true,
        completed: true,
        updatedAt: true,
        lesson: {
          select: {
            id: true,
            title: true,
            session: { select: { course: { select: { id: true, title: true } } } },
          },
        },
      },
    }),
    prisma.creditWallet.findUnique({
      where: { userId: session.user.id },
      select: { balance: true },
    }),
  ]);

  const inProgress = enrollments.filter((item) => item.progress < 100);
  const completed = enrollments.filter((item) => item.progress >= 100);

  const stats = [
    { title: "Khóa đã mua", value: enrollments.length, icon: BookOpen, color: "text-blue-600" },
    { title: "Đang học", value: inProgress.length, icon: Clock, color: "text-orange-600" },
    { title: "Hoàn thành", value: completed.length, icon: CheckCircle, color: "text-green-600" },
    { title: "Số dư", value: formatCurrency(wallet?.balance ?? 0), icon: Wallet, color: "text-purple-600" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard học tập</h1>
        <p className="mt-2 text-gray-600">Chào mừng {session.user.name ?? session.user.email} quay lại.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tiếp tục học</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {inProgress.length === 0 ? (
              <p className="text-sm text-gray-500">Bạn chưa có khóa học đang học.</p>
            ) : (
              inProgress.slice(0, 3).map((item) => (
                <div key={item.course.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.course.title}</h3>
                      <p className="mt-1 text-sm text-gray-500">{Math.round(item.progress)}% hoàn thành</p>
                    </div>
                    <a href={`/learn/${item.course.id}`}>
                      <Button size="sm">Học tiếp</Button>
                    </a>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-gray-200">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Học gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProgress.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có lịch sử học gần đây.</p>
            ) : (
              recentProgress.map((item) => (
                <a
                  key={item.lesson.id}
                  href={`/learn/${item.lesson.session.course.id}/lesson/${item.lesson.id}`}
                  className="block rounded-lg border p-3 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.lesson.title}</p>
                      <p className="text-xs text-gray-500">{item.lesson.session.course.title}</p>
                    </div>
                    <Badge variant={item.completed ? "default" : "secondary"}>
                      {item.completed ? "Xong" : "Đang học"}
                    </Badge>
                  </div>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Khóa học đã hoàn thành</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <p className="text-sm text-gray-500">Bạn chưa hoàn thành khóa học nào.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completed.map((item) => (
                <a key={item.course.id} href={`/courses/${item.course.slug}`} className="rounded-lg border p-4 hover:bg-gray-50">
                  <p className="font-medium text-gray-900">{item.course.title}</p>
                  <Badge className="mt-2 bg-green-600">Đã hoàn thành</Badge>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
