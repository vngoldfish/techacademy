import { redirect } from "next/navigation";
import { BookOpen, CheckCircle, Clock, Wallet, Layout, Play, ChevronRight, Sparkles, Award } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [enrollments, recentProgress, wallet, dbUser] = await Promise.all([
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
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true },
    }),
  ]);

  const inProgress = enrollments.filter((item) => item.progress < 100);
  const completed = enrollments.filter((item) => item.progress >= 100);

  const stats = [
    { 
      title: "Khóa đã mua", 
      value: enrollments.length, 
      icon: BookOpen, 
      color: "text-blue-600",
      bg: "bg-blue-50/50 border-blue-100/50",
      glow: "shadow-blue-500/5"
    },
    { 
      title: "Đang học", 
      value: inProgress.length, 
      icon: Clock, 
      color: "text-amber-600",
      bg: "bg-amber-50/50 border-amber-100/50",
      glow: "shadow-amber-500/5"
    },
    { 
      title: "Hoàn thành", 
      value: completed.length, 
      icon: CheckCircle, 
      color: "text-emerald-600",
      bg: "bg-emerald-50/50 border-emerald-100/50",
      glow: "shadow-emerald-500/5"
    },
    { 
      title: "Điểm thưởng", 
      value: `${(dbUser?.points ?? 0).toLocaleString()} ⭐`, 
      icon: Award, 
      color: "text-amber-500",
      bg: "bg-amber-50/50 border-amber-100/50",
      glow: "shadow-amber-500/5"
    },
    { 
      title: "Số dư ví", 
      value: formatCurrency(wallet?.balance ?? 0), 
      icon: Wallet, 
      color: "text-purple-600",
      bg: "bg-purple-50/50 border-purple-100/50",
      glow: "shadow-purple-500/5"
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-10">
      <div className="container mx-auto px-4">
        
        {/* Welcome Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl flex items-center gap-2">
              <Layout className="h-7 w-7 text-blue-600" />
              Bảng điều khiển học tập
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Chào mừng <span className="font-bold text-slate-700">{session.user.name ?? session.user.email}</span> quay trở lại học tập!
            </p>
          </div>
          <Link href="/courses">
            <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>Tiếp tục học ngay</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card 
              key={stat.title} 
              className={`border bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-300 hover:scale-[1.02] ${stat.glow} rounded-2xl`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3 p-5">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.title}</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} border`}>
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workspace Columns */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          
          {/* Left Column: Continue Learning */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Khóa học đang học ({inProgress.length})
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-4">
                {inProgress.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold">Bạn không có khóa học nào đang học dở.</p>
                    <Link href="/courses" className="inline-block text-xs font-bold text-blue-600 hover:underline">
                      Khám phá danh sách khóa học →
                    </Link>
                  </div>
                ) : (
                  inProgress.slice(0, 3).map((item) => (
                    <div 
                      key={item.course.id} 
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md bg-white transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        {item.course.thumbnailUrl ? (
                          <div className="relative h-14 w-20 overflow-hidden rounded-xl border border-slate-100 shrink-0">
                            <Image
                              src={item.course.thumbnailUrl}
                              alt={item.course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-14 w-20 rounded-xl bg-blue-50 text-blue-400 border border-slate-100 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {item.course.title}
                          </h4>
                          <p className="text-xs text-slate-400 font-semibold">{Math.round(item.progress)}% hoàn thành</p>
                          <div className="h-1.5 w-32 rounded-full bg-slate-100 overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" 
                              style={{ width: `${item.progress}%` }} 
                            />
                          </div>
                        </div>
                      </div>

                      <Link href={`/learn/${item.course.id}`} className="shrink-0">
                        <Button size="sm" className="w-full sm:w-auto rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10">
                          Học tiếp
                          <ChevronRight className="h-4 w-4 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Recent Activity Logs */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/20 px-6 py-5">
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Play className="h-4.5 w-4.5 text-blue-500 fill-blue-500" />
                  Bài học vừa xem
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-6 space-y-3">
                {recentProgress.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <Clock className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold">Chưa có lịch sử học tập.</p>
                  </div>
                ) : (
                  recentProgress.map((item) => (
                    <Link
                      key={item.lesson.id}
                      href={`/learn/${item.lesson.session.course.id}/lesson/${item.lesson.id}`}
                      className="block p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:shadow-sm transition-all duration-300 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {item.lesson.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-semibold line-clamp-1">
                            {item.lesson.session.course.title}
                          </p>
                        </div>
                        <Badge className={`rounded-lg border font-bold text-[10px] px-2 py-0.5 shrink-0 ${
                          item.completed 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50" 
                            : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-50"
                        }`}>
                          {item.completed ? "Hoàn thành" : "Đang học"}
                        </Badge>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          
        </div>

        {/* Bottom Section: Completed Courses */}
        {completed.length > 0 && (
          <Card className="mt-8 border border-slate-200/60 bg-white/70 backdrop-blur-sm rounded-3xl shadow-sm overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/20 px-6 py-5">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Khóa học đã hoàn thành ({completed.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((item) => (
                  <Link 
                    key={item.course.id} 
                    href={`/courses/${item.course.slug}`} 
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:shadow-md transition-all duration-300 group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                        {item.course.title}
                      </h4>
                      <Badge className="mt-2 bg-emerald-500 hover:bg-emerald-500 border-0 text-[10px] font-bold px-2 py-0.5 rounded-md text-white shadow-sm shadow-emerald-500/10">
                        Đã tốt nghiệp 🎓
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
