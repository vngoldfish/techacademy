import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      priceCredit: true,
      createdAt: true,
      _count: { select: { sessions: true, enrollments: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý khóa học</h1>
        <Link href="/admin/courses/new">
          <Button><Plus className="mr-2 h-4 w-4" />Thêm khóa học</Button>
        </Link>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="p-4">Tên khóa học</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Giá</th>
                <th className="p-4">Buổi học</th>
                <th className="p-4">Học viên</th>
                <th className="p-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b last:border-0">
                  <td className="p-4 font-medium">{course.title}</td>
                  <td className="p-4">
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? "Đã xuất bản" : "Nháp"}
                    </Badge>
                  </td>
                  <td className="p-4">{course.priceCredit} credit</td>
                  <td className="p-4">{course._count.sessions}</td>
                  <td className="p-4">{course._count.enrollments}</td>
                  <td className="p-4">
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && (
            <p className="p-8 text-center text-gray-500">Chưa có khóa học nào.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
