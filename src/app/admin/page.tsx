import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, CreditCard, TrendingUp, AlertCircle, FileText, ArrowRight, ShieldAlert, Award, DollarSign, BarChart3, GraduationCap } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getInstructorRankAndCommission } from "@/lib/rewards";

export default async function AdminDashboard() {
  const session = await auth();
  const isInstructor = session?.user?.role === "INSTRUCTOR";
  const userId = session?.user?.id;

  let totalStudents = 0;
  let totalInstructors = 0;
  let totalCourses = 0;
  let totalCreditsDisplay = "";
  let recentEnrollments: any[] = [];
  let pendingBlogs = 0;
  let pendingInstructors = 0;
  let pendingSubmissions = 0;

  // New report metrics
  let recentTopups: any[] = [];
  let popularCourses: any[] = [];
  let myCoursesList: any[] = [];
  let totalCreditsNum = 0;

  let tierInfo: any = null;

  if (isInstructor && userId) {
    tierInfo = await getInstructorRankAndCommission(userId);
    // 1. Instructor Dashboard Stats
    const [
      myStudentsCount,
      myCoursesCount,
      myEnrollmentsData,
      myRecentEnrollments,
      myPendingSubmissions,
      instructorCoursesData
    ] = await Promise.all([
      // Count unique students enrolled in instructor's courses
      prisma.enrollment.groupBy({
        by: ['userId'],
        where: { course: { creatorId: userId } }
      }).then(res => res.length),
      
      prisma.course.count({ where: { creatorId: userId } }),
      
      prisma.enrollment.findMany({
        where: { course: { creatorId: userId } },
        select: { course: { select: { priceCredit: true } } }
      }),
      
      prisma.enrollment.findMany({
        where: { course: { creatorId: userId } },
        take: 5,
        orderBy: { enrolledAt: "desc" },
        select: {
          enrolledAt: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
          course: { select: { title: true, priceCredit: true } },
        },
      }),
      
      prisma.assignmentSubmission.count({
        where: {
          status: "PENDING",
          assignment: { lesson: { session: { course: { creatorId: userId } } } }
        }
      }),

      prisma.course.findMany({
        where: { creatorId: userId },
        select: {
          id: true,
          title: true,
          priceCredit: true,
          isPublished: true,
          createdAt: true,
          _count: { select: { enrollments: true, sessions: true } }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    totalStudents = myStudentsCount;
    totalCourses = myCoursesCount;
    recentEnrollments = myRecentEnrollments;
    pendingSubmissions = myPendingSubmissions;
    myCoursesList = instructorCoursesData;
    
    // Sum of credits from enrollments in instructor's courses
    totalCreditsNum = myEnrollmentsData.reduce((acc, curr) => acc + (curr.course?.priceCredit ?? 0), 0);
    totalCreditsDisplay = totalCreditsNum.toLocaleString() + " Cr";
  } else {
    // 2. Global Admin Dashboard Stats
    const [
      adminStudentsCount,
      adminInstructorsCount,
      adminCoursesCount,
      adminTransactions,
      adminRecentEnrollments,
      adminPendingBlogs,
      adminPendingInstructors,
      adminPendingSubmissions,
      adminRecentTopups,
      adminPopularCourses
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "INSTRUCTOR" } }),
      prisma.course.count(),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "TOPUP" } }),
      prisma.enrollment.findMany({
        take: 5,
        orderBy: { enrolledAt: "desc" },
        select: {
          enrolledAt: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
          course: { select: { title: true, priceCredit: true } },
        },
      }),
      prisma.blogPost.count({ where: { status: "PENDING" } }),
      prisma.instructorApplication.count({ where: { status: "PENDING" } }),
      prisma.assignmentSubmission.count({ where: { status: "PENDING" } }),
      prisma.transaction.findMany({
        where: { type: "TOPUP" },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          stripePaymentId: true,
          wallet: { select: { user: { select: { name: true, email: true } } } }
        }
      }),
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          priceCredit: true,
          creator: { select: { name: true } },
          _count: { select: { enrollments: true } }
        },
        orderBy: { enrollments: { _count: "desc" } },
        take: 5
      })
    ]);

    totalStudents = adminStudentsCount;
    totalInstructors = adminInstructorsCount;
    totalCourses = adminCoursesCount;
    recentEnrollments = adminRecentEnrollments;
    pendingBlogs = adminPendingBlogs;
    pendingInstructors = adminPendingInstructors;
    pendingSubmissions = adminPendingSubmissions;
    recentTopups = adminRecentTopups;
    popularCourses = adminPopularCourses;
    totalCreditsNum = adminTransactions._sum.amount ?? 0;
    totalCreditsDisplay = totalCreditsNum.toLocaleString() + " Cr";
  }

  const stats = [
    { 
      title: isInstructor ? "Học viên của tôi" : "Người học đăng ký", 
      value: totalStudents, 
      desc: isInstructor ? "Học viên đã mua khóa học của bạn" : "Tổng học viên trên hệ thống",
      icon: Users, 
      color: "text-blue-600 bg-blue-50 border-blue-100" 
    },
    { 
      title: isInstructor ? "Việc cần xử lý" : "Giảng viên đối tác", 
      value: isInstructor ? pendingSubmissions : totalInstructors, 
      desc: isInstructor ? "Bài nộp bài tập chưa chấm" : "Tổng số giảng viên trên hệ thống",
      icon: Award, 
      color: "text-indigo-600 bg-indigo-50 border-indigo-100" 
    },
    { 
      title: isInstructor ? "Khóa học của tôi" : "Khóa học trực tuyến", 
      value: totalCourses, 
      desc: isInstructor ? "Khóa học do bạn biên soạn" : "Tổng số khóa học hiện có",
      icon: BookOpen, 
      color: "text-emerald-600 bg-emerald-50 border-emerald-100" 
    },
    { 
      title: isInstructor ? "Tổng doanh thu" : "Tổng credit nạp", 
      value: totalCreditsDisplay, 
      desc: isInstructor ? "Tổng credit tích lũy từ lượt bán" : "Tổng giá trị credit đã nạp hệ thống",
      icon: CreditCard, 
      color: "text-purple-600 bg-purple-50 border-purple-100" 
    },
  ];

  const pendingTasks = isInstructor
    ? [
        {
          title: "Bài tập cần chấm điểm",
          count: pendingSubmissions,
          href: "/admin/submissions",
          description: "Bài thực hành của học viên trong khóa của tôi",
          icon: AlertCircle,
          badgeColor: pendingSubmissions > 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
        }
      ]
    : [
        {
          title: "Duyệt bài viết blog",
          count: pendingBlogs,
          href: "/admin/blog-posts",
          description: "Bài viết mới từ giảng viên chờ xuất bản",
          icon: FileText,
          badgeColor: pendingBlogs > 0 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"
        },
        {
          title: "Yêu cầu giảng viên",
          count: pendingInstructors,
          href: "/admin/instructor-applications",
          description: "Học viên gửi đơn nâng cấp tài khoản",
          icon: ShieldAlert,
          badgeColor: pendingInstructors > 0 ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-400"
        }
      ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {isInstructor ? "Bảng Điều Khiển Giảng Viên" : "Hệ Thống Quản Trị Trung Tâm"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isInstructor 
              ? "Báo cáo chi tiết về tình hình người học, doanh thu khóa học và chấm điểm bài tập tự luận." 
              : "Báo cáo toàn diện về lượng người nạp tiền, người đăng ký học và hoạt động của giảng viên."}
          </p>
        </div>
      </div>

      {isInstructor && tierInfo && (
        <Card className="border border-slate-100 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-750 text-white rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
            <Award className="h-40 w-40" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-white/10 border-white/20 text-white`}>
                Cấp bậc đối tác: {tierInfo.rankName}
              </span>
              <h2 className="text-xl font-extrabold mt-3 tracking-tight">Chương trình Giảng viên Thành viên</h2>
              <p className="text-xs text-blue-100 max-w-xl mt-1.5 leading-relaxed font-medium">
                Bạn đang nhận tỷ lệ chia sẻ doanh thu là <strong className="text-white text-sm">{tierInfo.commissionPercent}%</strong> từ mỗi lượt bán khóa học (Admin nhận {tierInfo.adminSharePercent}% phí vận hành). Hãy tích cực tạo bài giảng mới để nâng hạng!
              </p>
            </div>
            <div className="text-left md:text-right shrink-0 bg-white/10 border border-white/10 rounded-2xl p-4 min-w-[200px]">
              <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider">Học viên của tôi</p>
              <p className="text-2xl font-black mt-0.5">{tierInfo.totalStudents} học viên</p>
              {tierInfo.nextRankThreshold ? (
                <p className="text-[10px] text-blue-200 mt-1.5 font-bold">
                  Cần thêm {tierInfo.nextRankThreshold - tierInfo.totalStudents} học viên để đạt mốc {tierInfo.commissionPercent + 5}%!
                </p>
              ) : (
                <p className="text-[10px] text-emerald-300 mt-1.5 font-bold">
                  Bậc cao nhất (Platinum - 85%) 🎉
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.title}</span>
              <div className={`p-2 rounded-xl border ${stat.color}`}>
                <stat.icon className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dashboard split content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Actions */}
        <Card className="lg:col-span-1 border border-slate-100 shadow-sm flex flex-col justify-between bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span>Yêu cầu cần xử lý</span>
            </CardTitle>
            <CardDescription>Các tác vụ đang chờ bạn giải quyết.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {pendingTasks.map((task) => (
              <Link href={task.href} key={task.title} className="block group">
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all bg-slate-50/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <task.icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">{task.description}</span>
                    </div>
                  </div>
                  <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${task.badgeColor}`}>
                    {task.count}
                  </span>
                </div>
              </Link>
            ))}
            {pendingTasks.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-400">Không có công việc nào cần xử lý.</div>
            )}
          </CardContent>
        </Card>

        {/* Global Admin Details or Instructor Details */}
        {!isInstructor ? (
          /* Báo cáo người nạp cho Admin */
          <Card className="lg:col-span-2 border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <span>Báo cáo người nạp (Giao dịch nạp gần nhất)</span>
                  </CardTitle>
                  <CardDescription>
                    Lịch sử nạp tiền của học viên qua Stripe chuyển đổi sang credit.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {recentTopups.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">Chưa có giao dịch nạp tiền nào.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                        <th className="pb-3 pl-2">Người nạp</th>
                        <th className="pb-3">Mã giao dịch (Stripe)</th>
                        <th className="pb-3">Thời gian</th>
                        <th className="pb-3 text-right pr-2">Số lượng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentTopups.map((topup) => (
                        <tr key={topup.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 pl-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{topup.wallet.user.name ?? "Học viên"}</span>
                              <span className="text-xs text-slate-400">{topup.wallet.user.email}</span>
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-600 font-mono text-xs">
                            {topup.stripePaymentId ?? "N/A"}
                          </td>
                          <td className="py-3.5 text-xs text-slate-400 font-medium">
                            {new Date(topup.createdAt).toLocaleDateString("vi-VN")} {new Date(topup.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3.5 text-right pr-2 font-extrabold text-purple-600">
                            +{topup.amount.toLocaleString()} Cr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Báo cáo hoạt động học viên mới cho Giảng viên */
          <Card className="lg:col-span-2 border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span>Hoạt động học viên mới</span>
                </CardTitle>
                <CardDescription>
                  Học viên vừa đăng ký tham gia các lớp học của bạn.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {recentEnrollments.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">Chưa có học viên nào đăng ký.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pl-2">Học viên</th>
                        <th className="pb-3">Khóa học đăng ký</th>
                        <th className="pb-3 text-right pr-2">Ngày tham gia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentEnrollments.map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3 pl-2">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-xs font-extrabold">
                                {e.user.name ? e.user.name.charAt(0).toUpperCase() : "H"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-slate-800 truncate">{e.user.name ?? "Học viên"}</span>
                                <span className="text-xs text-slate-500 truncate">{e.user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 font-semibold text-slate-700 truncate max-w-xs">{e.course.title}</td>
                          <td className="py-3 text-right pr-2 text-xs font-medium text-slate-400">
                            {new Date(e.enrolledAt).toLocaleDateString("vi-VN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 2: Báo cáo người học cho Admin hoặc Quản trị khóa học cho Giảng viên */}
      {!isInstructor ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Báo cáo người học - đăng ký học mới */}
          <Card className="lg:col-span-2 border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <GraduationCap className="h-5 w-5 text-emerald-500" />
                <span>Báo cáo người học (Đăng ký học mới nhất)</span>
              </CardTitle>
              <CardDescription>
                Chi tiết các lượt học viên sử dụng credit để mua quyền truy cập khóa học.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentEnrollments.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">Chưa có hoạt động đăng ký học.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                        <th className="pb-3 pl-2">Học viên</th>
                        <th className="pb-3">Khóa học đăng ký</th>
                        <th className="pb-3">Thời gian</th>
                        <th className="pb-3 text-right pr-2">Học phí</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {recentEnrollments.map((e, i) => (
                        <tr key={i} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-3.5 pl-2">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{e.user.name ?? "Học viên"}</span>
                              <span className="text-xs text-slate-400">{e.user.email}</span>
                            </div>
                          </td>
                          <td className="py-3.5 font-semibold text-slate-700 truncate max-w-xs">{e.course.title}</td>
                          <td className="py-3.5 text-xs text-slate-400 font-medium">
                            {new Date(e.enrolledAt).toLocaleDateString("vi-VN")} {new Date(e.enrolledAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="py-3.5 text-right pr-2 font-extrabold text-emerald-600">
                            {e.course.priceCredit} Cr
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Khóa học phổ biến nhất */}
          <Card className="lg:col-span-1 border border-slate-100 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span>Khóa học nổi bật nhất</span>
              </CardTitle>
              <CardDescription>
                Thống kê các khóa học thu hút nhiều học viên nhất.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {popularCourses.map((course, idx) => (
                <div key={course.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 truncate">{course.title}</span>
                      <span className="text-[10px] text-slate-400 truncate">Giảng viên: {course.creator.name}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-extrabold text-blue-600">{course._count.enrollments} học viên</div>
                    <div className="text-[9px] text-slate-400 font-medium">Giá: {course.priceCredit} Cr</div>
                  </div>
                </div>
              ))}
              {popularCourses.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-400">Chưa có dữ liệu khóa học.</div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Quản trị khóa học cho Giảng viên */
        <Card className="border border-slate-100 shadow-sm bg-white rounded-2xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <BookOpen className="h-5 w-5 text-emerald-500" />
                <span>Quản trị và hiệu suất khóa học của tôi</span>
              </CardTitle>
              <CardDescription>
                Theo dõi chi tiết lượng học sinh đăng ký, doanh thu và quản lý nội dung các khóa học của bạn.
              </CardDescription>
            </div>
            <Link href="/admin/courses/new" className="shrink-0">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all">
                + Biên soạn khóa học mới
              </button>
            </Link>
          </CardHeader>
          <CardContent>
            {myCoursesList.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                Bạn chưa biên soạn khóa học nào. Hãy nhấp nút phía trên để tạo khóa học đầu tiên!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                      <th className="p-3 pl-4">Khóa học</th>
                      <th className="p-3">Học phí</th>
                      <th className="p-3">Số chương</th>
                      <th className="p-3">Học viên tích lũy</th>
                      <th className="p-3 text-right">Doanh thu thu về</th>
                      <th className="p-3 text-right pr-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myCoursesList.map((course) => {
                      const revenue = course._count.enrollments * course.priceCredit;
                      return (
                        <tr key={course.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3 pl-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{course.title}</span>
                              <span className="text-xs text-slate-400 mt-0.5">Tạo ngày: {new Date(course.createdAt).toLocaleDateString("vi-VN")}</span>
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{course.priceCredit} Cr</td>
                          <td className="p-3 font-medium text-slate-600">{course._count.sessions} chương</td>
                          <td className="p-3 text-slate-600 font-extrabold text-blue-600">
                            {course._count.enrollments} người học
                          </td>
                          <td className="p-3 text-right font-extrabold text-emerald-600">
                            {revenue.toLocaleString()} Cr
                          </td>
                          <td className="p-3 text-right pr-4">
                            <div className="flex items-center justify-end gap-2.5">
                              <Link href={`/admin/courses/${course.id}`}>
                                <span className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-semibold cursor-pointer">
                                  Chỉnh sửa
                                </span>
                              </Link>
                              <span className="text-slate-300">|</span>
                              <Link href={`/admin/courses/${course.id}/submissions`}>
                                <span className="text-xs text-slate-600 hover:text-slate-800 hover:underline font-semibold cursor-pointer">
                                  Bài nộp học viên
                                </span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
