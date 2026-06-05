import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, FileSpreadsheet, ArrowRight, User, BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

const statusConfig = {
  PENDING: { label: "Chờ chấm", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200", leftBorder: "border-l-amber-500" },
  APPROVED: { label: "Đạt yêu cầu", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200", leftBorder: "border-l-emerald-500" },
  REJECTED: { label: "Chưa đạt", icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200", leftBorder: "border-l-rose-500" },
};

export default async function AdminSubmissionsPage() {
  const session = await auth();
  if (session?.user?.role !== "INSTRUCTOR") {
    redirect("/admin");
  }
  const isInstructor = true;
  const userId = session?.user?.id;

  const submissions = await prisma.assignmentSubmission.findMany({
    where: userId ? {
      assignment: { lesson: { session: { course: { creatorId: userId } } } }
    } : undefined,
    orderBy: { submittedAt: "desc" },
    take: 100,
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
          lesson: { 
            select: { 
              title: true, 
              session: { 
                select: { 
                  course: { 
                    select: { 
                      id: true,
                      title: true 
                    } 
                  } 
                } 
              } 
            } 
          },
        },
      },
    },
  });

  // Group submissions by Course in-memory
  const groupedSubmissions: Record<string, { courseTitle: string; items: typeof submissions }> = {};
  
  submissions.forEach((sub) => {
    const course = sub.assignment.lesson.session.course;
    const courseId = course.id;
    if (!groupedSubmissions[courseId]) {
      groupedSubmissions[courseId] = {
        courseTitle: course.title,
        items: [],
      };
    }
    groupedSubmissions[courseId].items.push(sub);
  });

  const groupedList = Object.entries(groupedSubmissions).map(([courseId, val]) => ({
    courseId,
    courseTitle: val.courseTitle,
    items: val.items,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bài tự luận của học viên</h1>
        <p className="text-sm text-slate-500">
          {isInstructor 
            ? "Xem và chấm điểm bài tập tự luận thực hành của các khóa học do bạn giảng dạy." 
            : "Xem và chấm điểm toàn bộ bài tập tự luận thực hành trên hệ thống."}
        </p>
      </div>

      <div className="space-y-8">
        {groupedList.map((group) => (
          <div key={group.courseId} className="space-y-4">
            {/* Group Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">{group.courseTitle}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {group.items.length} bài nộp
                </span>
              </div>
              <Link href={`/admin/courses/${group.courseId}/submissions`}>
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/60 font-semibold px-2.5 py-1 h-8 rounded-lg flex items-center gap-1">
                  Quản lý riêng biệt →
                </Button>
              </Link>
            </div>

            {/* Submissions of this course */}
            <div className="grid grid-cols-1 gap-4">
              {group.items.map((sub) => {
                const config = statusConfig[sub.status] || { label: sub.status, icon: Clock, color: "bg-slate-50 text-slate-600 border-slate-200", leftBorder: "border-l-slate-400" };
                const Icon = config.icon;
                return (
                  <Card key={sub.id} className={`border border-slate-100 shadow-sm border-l-4 ${config.leftBorder} hover:shadow-md transition-shadow overflow-hidden bg-white`}>
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bài học:</span>
                            <span className="text-xs font-medium text-slate-600">
                              {sub.assignment.lesson.title}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {sub.assignment.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span>Học viên: <span className="font-semibold text-slate-700">{sub.user.name ?? "Học viên"}</span> ({sub.user.email})</span>
                          </div>
                          
                          <div className="text-sm text-slate-600 mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {sub.content}
                          </div>

                          {sub.feedback && (
                            <div className="text-xs font-medium text-blue-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100/50 mt-2">
                              Phản hồi bài chấm: {sub.feedback}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center md:flex-col md:items-end gap-3 justify-between md:justify-start shrink-0">
                          <Badge className={`${config.color} border font-medium px-2.5 py-0.5 inline-flex items-center gap-1 shadow-none`}>
                            <Icon className="h-3.5 w-3.5" />
                            <span>{config.label}</span>
                          </Badge>
                          <Link href={`/admin/submissions/${sub.id}`} className="block">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium px-3.5 py-1.5 shadow-sm shadow-blue-500/10">
                              <span>Chấm bài</span>
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {groupedList.length === 0 && (
          <Card className="border border-dashed border-slate-200">
            <CardContent className="p-16 text-center text-slate-400">
              <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p>Chưa có bài tập tự luận nào được nộp.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
