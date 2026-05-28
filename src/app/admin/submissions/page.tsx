import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Chờ chấm", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
  APPROVED: { label: "Đạt", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  REJECTED: { label: "Chưa đạt", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

export default async function AdminSubmissionsPage() {
  const submissions = await prisma.assignmentSubmission.findMany({
    orderBy: { submittedAt: "desc" },
    take: 50,
    select: {
      id: true,
      content: true,
      status: true,
      feedback: true,
      submittedAt: true,
      reviewedAt: true,
      user: { select: { name: true, email: true } },
      assignment: {
        select: {
          title: true,
          lesson: { select: { title: true, session: { select: { course: { select: { title: true } } } } } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bài nộp chờ chấm</h1>
      <div className="space-y-4">
        {submissions.map((sub) => {
          const config = statusConfig[sub.status];
          const Icon = config.icon;
          return (
            <Card key={sub.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{sub.assignment.title}</p>
                    <p className="text-sm text-gray-500">
                      {sub.assignment.lesson.session.course.title} → {sub.assignment.lesson.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Học viên: {sub.user.name ?? sub.user.email}
                    </p>
                    <p className="text-sm text-gray-700 mt-2 p-3 bg-gray-50 rounded">
                      {sub.content.length > 200 ? sub.content.slice(0, 200) + "..." : sub.content}
                    </p>
                    {sub.feedback && (
                      <p className="text-sm text-blue-600 mt-1">Phản hồi: {sub.feedback}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={config.color}>
                      <Icon className="mr-1 h-3 w-3" />
                      {config.label}
                    </Badge>
                    <Link href={`/admin/submissions/${sub.id}`}>
                      <Button variant="outline" size="sm">Chấm bài</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {submissions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Chưa có bài nộp nào.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
