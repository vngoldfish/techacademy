import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, PlayCircle } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string; sessionId: string }>;
}

export default async function AdminLessonsPage({ params }: PageProps) {
  const { id: courseId, sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      title: true,
      courseId: true,
      lessons: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          videoUrl: true,
          videoType: true,
          type: true,
          duration: true,
          orderIndex: true,
          isFree: true,
          isGated: true,
          _count: { select: { videoNotes: true } },
        },
      },
    },
  });

  if (!session || session.courseId !== courseId) notFound();

  const typeConfig = {
    VIDEO: { label: "Video", color: "bg-blue-50 text-blue-700 border-blue-200/50" },
    DOCUMENT: { label: "Tài liệu", color: "bg-amber-50 text-amber-700 border-amber-200/50" },
    QUIZ: { label: "Trắc nghiệm", color: "bg-purple-50 text-purple-700 border-purple-200/50" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý bài học</h1>
          <p className="text-sm text-gray-500">{session.title}</p>
        </div>
        <Link href={`/admin/courses/${courseId}/sessions/${sessionId}/lessons/new`}>
          <Button><Plus className="mr-2 h-4 w-4" />Thêm bài học</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {session.lessons.map((lesson) => {
          const tConfig = typeConfig[lesson.type] || { label: "Bài học", color: "bg-slate-50 text-slate-700" };
          return (
            <Card key={lesson.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <PlayCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{lesson.orderIndex}. {lesson.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${tConfig.color} border font-medium px-2 py-0.5 text-xs shadow-none`}>
                        {tConfig.label}
                      </Badge>
                      {lesson.type === "VIDEO" && (
                        <Badge variant="outline" className="text-xs">{lesson.videoType}</Badge>
                      )}
                      {lesson.duration && (
                        <span className="text-xs text-gray-400">
                          {lesson.type === "QUIZ" ? `${lesson.duration} giây` : formatDuration(lesson.duration)}
                        </span>
                      )}
                      {lesson.isFree && <Badge variant="secondary" className="text-xs">Miễn phí</Badge>}
                      {lesson.isGated && <Badge variant="secondary" className="text-xs">Có gate</Badge>}
                      {lesson._count.videoNotes > 0 && <Badge variant="secondary" className="text-xs">Có ghi chú</Badge>}
                    </div>
                  </div>
                </div>
                <Link href={`/admin/courses/${courseId}/sessions/${sessionId}/lessons/${lesson.id}`}>
                  <Button variant="ghost" size="sm"><Pencil className="h-4 w-4" /></Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}

        {session.lessons.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Chưa có bài học nào.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
