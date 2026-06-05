import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, FileCheck, Newspaper, UserCheck, ArrowLeft, ShieldAlert, Map, Settings, Ticket } from "lucide-react";
import Breadcrumbs from "@/components/common/Breadcrumbs";


const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Khóa học", icon: BookOpen },
  { href: "/admin/coupons", label: "Mã giảm giá", icon: Ticket },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/roadmaps", label: "Lộ trình học", icon: Map },
  { href: "/admin/submissions", label: "Bài nộp học viên", icon: FileCheck },
  { href: "/admin/blog-posts", label: "Duyệt bài viết", icon: Newspaper },
  { href: "/admin/instructor-applications", label: "Yêu cầu giảng viên", icon: UserCheck },
  { href: "/admin/settings", label: "Cấu hình hệ thống", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/");
  }

  const isInstructor = user.role === "INSTRUCTOR";
  const filteredNav = isInstructor
    ? adminNav.filter((item) => ["Dashboard", "Khóa học", "Mã giảm giá", "Bài nộp học viên"].includes(item.label))
    : adminNav.filter((item) => item.label !== "Bài nộp học viên");

  return (
    <div className="flex flex-col min-h-screen">
      {session?.user?.impersonated && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <span>Bạn đang xem hệ thống với tư cách: <strong>{session.user.name}</strong> ({session.user.role})</span>
          <a href="/api/admin/impersonate/stop" className="underline hover:text-amber-900 font-bold ml-2">Thoát</a>
        </div>
      )}
      <div className="flex flex-1 bg-slate-50/60">
        {/* Sidebar Navigation */}
        <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950 text-slate-400 flex flex-col justify-between">
          <div>
            {/* Header/Logo */}
            <div className="p-5 border-b border-slate-900 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white font-extrabold shadow-sm">A</span>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white">BawuiAcademy</span>
                <span className="text-[10px] text-blue-500 font-semibold tracking-wider uppercase">
                  {isInstructor ? "Instructor Portal" : "Admin Portal"}
                </span>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="p-3 space-y-1">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-all duration-200"
                >
                  <item.icon className="h-4.5 w-4.5 text-slate-500 group-hover:text-white" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Footer/User Profile */}
          <div className="p-4 border-t border-slate-900 space-y-3">
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 text-sm font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-white truncate">{user.name ?? "Admin"}</span>
                <span className="text-[10px] text-slate-500">Quản trị viên</span>
              </div>
            </div>
            <Link 
              href="/" 
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Trở về Trang chủ</span>
            </Link>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-8 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <Breadcrumbs />
            <div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
