import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, CreditCard, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
  const [totalStudents, totalCourses, totalTransactions, recentEnrollments] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "TOPUP" } }),
    prisma.enrollment.findMany({
      take: 5,
      orderBy: { enrolledAt: "desc" },
      select: {
        enrolledAt: true,
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
  ]);

  const stats = [
    { title: "Học viên", value: totalStudents, icon: Users, color: "text-blue-600" },
    { title: "Khóa học", value: totalCourses, icon: BookOpen, color: "text-green-600" },
    { title: "Tổng credit nạp", value: totalTransactions._sum.amount ?? 0, icon: CreditCard, color: "text-purple-600" },
    { title: "Đăng ký gần đây", value: recentEnrollments.length, icon: TrendingUp, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Đăng ký gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEnrollments.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có đăng ký nào.</p>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((e, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{e.user.name ?? e.user.email}</span>
                    <span className="text-gray-500"> — {e.course.title}</span>
                  </div>
                  <span className="text-gray-400">
                    {new Date(e.enrolledAt).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
