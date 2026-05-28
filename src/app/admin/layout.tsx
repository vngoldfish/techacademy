import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Users, FileCheck } from "lucide-react";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Khóa học", icon: BookOpen },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/submissions", label: "Bài nộp", icon: FileCheck },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r bg-white">
        <div className="p-4 border-b">
          <Link href="/admin" className="text-lg font-bold text-blue-600">
            TechAcademy Admin
          </Link>
        </div>
        <nav className="p-2">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4 border-t">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Về trang chủ
          </Link>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
