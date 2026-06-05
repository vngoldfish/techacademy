import type { ReactNode } from "react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";

import { ArrowRight, Compass, GraduationCap, Heart, Home, Mail, Map, MessageSquare, Newspaper, User } from "lucide-react";
import NotificationBell from "@/components/notification/NotificationBell";
import { FloatingRecommendations } from "@/components/recommendation/FloatingRecommendations";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const userInitial = (session?.user?.name ?? session?.user?.email ?? "U").charAt(0).toUpperCase();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {session?.user?.impersonated && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 text-center text-sm font-semibold flex items-center justify-center gap-2 border-b border-amber-600/30 z-[100] w-full">
          <span>Bạn đang xem hệ thống với tư cách: <strong>{session.user.name ?? session.user.email}</strong> ({session.user.role})</span>
          <a href="/api/admin/impersonate/stop" className="bg-amber-950 text-amber-100 hover:bg-amber-900 transition-colors text-xs font-bold px-3 py-1.5 rounded-md ml-2 cursor-pointer shadow-sm no-underline decoration-transparent">
            Thoát
          </a>
        </div>
      )}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 transition-opacity hover:opacity-90">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-extrabold text-lg">B</span>
            <span>Bawui<span className="text-blue-600">Academy</span></span>
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">
              <Home className="h-4 w-4" />
              <span>Trang chủ</span>
            </Link>
            <Link href="/courses" className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">
              <Compass className="h-4 w-4" />
              <span>Khóa học</span>
            </Link>
            {session?.user && (
              <Link href="/my-courses" className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">
                <Heart className="h-4 w-4" />
                <span>Khóa học của tôi</span>
              </Link>
            )}
            <Link href="/roadmap" className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">
              <Map className="h-4 w-4" />
              <span>Lộ trình</span>
            </Link>
            <Link href="/blog" className="flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-600">
              <Newspaper className="h-4 w-4" />
              <span>Blog</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <NotificationBell />
                <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-100 bg-white p-1 pr-3 shadow-sm hover:bg-slate-50 transition-colors">
                  <Avatar className="h-8 w-8 border border-slate-100">
                    <AvatarFallback className="bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-700 font-bold">{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-slate-700 md:inline">
                    {session.user.name ?? session.user.email}
                  </span>
                </summary>
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-100 bg-white p-2.5 shadow-xl transition-all z-50">
                  <div className="space-y-1 p-2.5">
                    <p className="text-sm font-semibold text-slate-900">{session.user.name ?? "Người dùng"}</p>
                    <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                    <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 font-medium">
                      {session.user.role === "ADMIN" 
                        ? "Admin" 
                        : session.user.role === "INSTRUCTOR" 
                          ? "Giảng viên" 
                          : "Học viên"}
                    </Badge>
                  </div>
                  <div className="my-2 border-t border-slate-100" />
                  <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span>Dashboard</span>
                  </Link>
                  <Link href="/my-courses" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <Heart className="h-4 w-4 text-slate-400" />
                    <span>Khóa học của tôi</span>
                  </Link>
                  <Link href="/blog/new" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <Newspaper className="h-4 w-4 text-slate-400" />
                    <span>Viết bài blog</span>
                  </Link>
                  <Link href="/blog/my-posts" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <Newspaper className="h-4 w-4 text-slate-400" />
                    <span>Bài viết của tôi</span>
                  </Link>
                  <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Hồ sơ & Ví credit</span>
                  </Link>
                  {session.user.role === "STUDENT" && (
                    <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 transition-colors font-medium">
                      <GraduationCap className="h-4 w-4 text-indigo-500" />
                      <span>Trở thành Giảng viên</span>
                    </Link>
                  )}
                  {(session.user.role === "ADMIN" || session.user.role === "INSTRUCTOR") && (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <Compass className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-blue-600">
                        {session.user.role === "ADMIN" ? "Admin Panel" : "Instructor Portal"}
                      </span>
                    </Link>
                  )}
                  <div className="my-2 border-t border-slate-100" />
                  <form
                    action={async () => {
                      "use server";
                      const { cookies } = await import("next/headers");
                      const cookieStore = await cookies();
                      cookieStore.delete("impersonate_user_id");
                      cookieStore.delete("impersonate_user_data");
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">
                      Đăng xuất
                    </button>
                  </form>
                </div>
              </details>
              </>
            ) : (
              <>
                <Link href="/signin" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                  Đăng nhập
                </Link>
                <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-colors">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        <Breadcrumbs />
        <div className="flex-1">
          {children}
        </div>
      </main>
      
      <footer className="border-t border-slate-200 bg-slate-950 text-slate-400 py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-extrabold shadow-sm">B</span>
              <span>Bawui<span className="text-blue-500">Academy</span></span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Nền tảng học trực tuyến đa ngành chất lượng cao với video on-demand, hệ thống làm quiz/midterm linh hoạt và thanh toán tín dụng tiện lợi.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Khóa học phổ biến</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/courses/reactjs-masterclass" className="hover:text-white transition-colors">ReactJS Masterclass</Link></li>
              <li><Link href="/courses/nextjs-fullstack" className="hover:text-white transition-colors">Next.js & Fullstack Dev</Link></li>
              <li><Link href="/courses/typescript-pro" className="hover:text-white transition-colors">TypeScript Pro Course</Link></li>
              <li><Link href="/courses" className="hover:text-white transition-colors">Tất cả khóa học</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4">Điều hướng</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/roadmap" className="hover:text-white transition-colors">Lộ trình nghề nghiệp</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog chia sẻ</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">Nạp credit ví điện tử</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Kết quả học tập</Link></li>
              {(!session?.user || session.user.role === "STUDENT") && (
                <li><Link href="/profile" className="hover:text-white transition-colors">Trở thành Giảng viên</Link></li>
              )}
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Bản tin công nghệ</h4>
            <p className="text-sm leading-relaxed text-slate-400">Đăng ký email để nhận lộ trình học tập miễn phí và tin tức công nghệ mới nhất.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email của bạn..." className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors" />
              <button className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/10">
                Gửi
              </button>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; 2026 BawuiAcademy. Phát triển bởi Bawui Dev Team. Bảo lưu mọi quyền.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Điều khoản dịch vụ</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Hỗ trợ kỹ thuật</a>
          </div>
        </div>
      </footer>
      <FloatingRecommendations />
    </div>
  );
}
