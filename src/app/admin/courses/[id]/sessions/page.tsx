import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionsPage({ params }: PageProps) {
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      sessions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          orderIndex: true,
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý buổi học</h1>
          <p className="text-sm text-gray-500">{course.title}</p>
        </div>
        <Link href={`/admin/courses/${id}/sessions/new`}>
          <Button><Plus className="mr-2 h-4 w-4" />Thêm buổi học</Button>
        </Link>
      </div>

      <div className="space-y-4">
        {course.sessions.map((session) => (
          <Card key={session.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">
                  Buổi {session.orderIndex}: {session.title}
                </CardTitle>
                {session.description && (
                  <p className="text-sm text-gray-500 mt-1">{session.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{session._count.lessons} bài học</Badge>
                <Link href={`/admin/courses/${id}/sessions/${session.id}/lessons`}>
                  <Button variant="outline" size="sm">Quản lý bài học</Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
        ))}
        {course.sessions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Chưa có buổi học nào. Nhấn "Thêm buổi học" để bắt đầu.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
