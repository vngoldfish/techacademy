import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Pencil, BookOpen, Layers, Users, Coins } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function AdminCoursesPage() {
  const session = await auth();
  const isInstructor = session?.user?.role === "INSTRUCTOR";

  const courses = await prisma.course.findMany({
    where: isInstructor ? { creatorId: session?.user?.id } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      priceCredit: true,
      createdAt: true,
      creator: { select: { name: true, email: true } },
      _count: { select: { sessions: true, enrollments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý khóa học</h1>
          <p className="text-sm text-slate-500">Xem, tạo mới và tinh chỉnh nội dung bài giảng của hệ thống.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 rounded-xl px-4 py-2.5">
            <Plus className="mr-2 h-4 w-4" />
            <span>Tạo khóa học</span>
          </Button>
        </Link>
      </div>

      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <span>Tất cả khóa học ({courses.length})</span>
          </CardTitle>
          <CardDescription>Danh sách toàn bộ khóa học lập trình hiện đang được lưu trữ.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="p-4 pl-6">Khóa học</th>
                  <th className="p-4">Giảng viên phụ trách</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Học phí</th>
                  <th className="p-4">Số chương</th>
                  <th className="p-4">Học viên</th>
                  <th className="p-4 text-right pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5">
                          Tạo ngày: {new Date(course.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{course.creator.name ?? "Chưa đặt tên"}</span>
                        <span className="text-xs text-slate-400 mt-0.5">{course.creator.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {course.isPublished ? (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0 font-medium px-2 py-0.5">
                          Đã xuất bản
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 font-medium px-2 py-0.5">
                          Bản nháp
                        </Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-bold text-slate-700">
                        <Coins className="h-4 w-4 text-blue-500/80" />
                        <span>{course.priceCredit} Cr</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-slate-400" />
                        <span>{course._count.sessions} chương</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span>{course._count.enrollments} học viên</span>
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <Link href={`/admin/courses/${course.id}`}>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {courses.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-400">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p>Chưa có khóa học nào được tạo.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
