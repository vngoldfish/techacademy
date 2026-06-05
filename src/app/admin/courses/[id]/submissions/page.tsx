import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, FileSpreadsheet, ArrowRight, User, ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";

const statusConfig = {
  PENDING: { label: "Chờ chấm", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200", leftBorder: "border-l-amber-500" },
  APPROVED: { label: "Đạt yêu cầu", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200", leftBorder: "border-l-emerald-500" },
  REJECTED: { label: "Chưa đạt", icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200", leftBorder: "border-l-rose-500" },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseSubmissionsPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const session = await auth();
  
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    redirect("/signin");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      creatorId: true,
    },
  });

  if (!course) {
    notFound();
  }

  // Authorize instructor
  if (session.user.role === "INSTRUCTOR" && course.creatorId !== session.user.id) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-700 rounded-xl border border-red-100 font-medium">
        Bạn không có quyền truy cập vào bài tập của khóa học này.
      </div>
    );
  }

  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      assignment: {
        lesson: {
          session: {
            courseId: courseId,
          },
        },
      },
    },
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      content: true,
      status: true,
      feedback: true,
      submittedAt: true,
      user: { select: { name: true, email: true } },
      assignment: {
        select: {
          title: true,
          lesson: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  // Calculate statistics
  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === "PENDING").length;
  const approved = submissions.filter((s) => s.status === "APPROVED").length;
  const rejected = submissions.filter((s) => s.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href={`/admin/courses/${courseId}`} className="text-slate-500 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Bài tự luận của học viên</h1>
          </div>
          <p className="text-sm text-slate-500 pl-7">
            Khóa học: <span className="font-semibold text-slate-700">{course.title}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 font-medium">Tổng bài nộp</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-amber-600 font-medium">Đang chờ chấm</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">{pending}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-600 font-medium">Đạt yêu cầu</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">{approved}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-100 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-rose-600 font-medium">Chưa đạt</p>
            <p className="text-2xl font-bold text-rose-700 mt-1">{rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 gap-4">
        {submissions.map((sub) => {
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
                      <span className="text-slate-300">•</span>
                      <span>Nộp ngày: {new Date(sub.submittedAt).toLocaleDateString("vi-VN")} {new Date(sub.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    
                    <div className="text-sm text-slate-600 mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {sub.content}
                    </div>

                    {sub.feedback && (
                      <div className="text-xs font-medium text-blue-700 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 mt-2">
                        Nhận xét giảng viên: {sub.feedback}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center md:flex-col md:items-end gap-3 justify-between md:justify-start shrink-0">
                    <Badge className={`${config.color} border font-medium px-2.5 py-0.5 inline-flex items-center gap-1 shadow-none`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span>{config.label}</span>
                    </Badge>
                    <Link href={`/admin/submissions/${sub.id}?redirect=/admin/courses/${courseId}/submissions`} className="block">
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

        {submissions.length === 0 && (
          <Card className="border border-dashed border-slate-200 bg-white">
            <CardContent className="p-16 text-center text-slate-400">
              <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-500">Chưa có bài tập tự luận nào được nộp cho khóa học này.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
