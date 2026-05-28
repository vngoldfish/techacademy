import type { ReactNode } from "react";
import { auth, signOut } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const userInitial = (session?.user?.name ?? session?.user?.email ?? "U").charAt(0).toUpperCase();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="text-xl font-bold text-blue-600">
            TechAcademy
          </a>
          <nav className="hidden items-center gap-6 md:flex">
            {session?.user && (
              <a href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Dashboard
              </a>
            )}
            <a href="/courses" className="text-sm font-medium text-gray-700 hover:text-blue-600">
              Khóa học
            </a>
            {session?.user && (
              <a href="/my-courses" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Khóa học của tôi
              </a>
            )}
            <a href="/roadmap" className="text-sm font-medium text-gray-700 hover:text-blue-600">
              Lộ trình
            </a>
            <a href="/blog" className="text-sm font-medium text-gray-700 hover:text-blue-600">
              Blog
            </a>
            {session?.user && (
              <a href="/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Ví credit
              </a>
            )}
          </nav>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <details className="relative">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border px-2 py-1 hover:bg-gray-50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-gray-700 md:inline">
                    {session.user.name ?? session.user.email}
                  </span>
                </summary>
                <div className="absolute right-0 mt-2 w-60 rounded-lg border bg-white p-2 shadow-lg">
                  <div className="space-y-1 p-2">
                    <p className="text-sm font-medium">{session.user.name ?? "Người dùng"}</p>
                    <p className="text-xs text-gray-500">{session.user.email}</p>
                    <Badge variant="secondary" className="text-xs">
                      {isAdmin ? "Admin" : "Học viên"}
                    </Badge>
                  </div>
                  <div className="my-2 border-t" />
                  <a href="/dashboard" className="block rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                    Thông tin học tập
                  </a>
                  <a href="/my-courses" className="block rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                    Khóa học của tôi
                  </a>
                  <a href="/profile" className="block rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                    Ví credit
                  </a>
                  {isAdmin && (
                    <a href="/admin" className="block rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
                      Admin Panel
                    </a>
                  )}
                  <div className="my-2 border-t" />
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button className="w-full rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50">
                      Đăng xuất
                    </button>
                  </form>
                </div>
              </details>
            ) : (
              <>
                <a href="/signin" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                  Đăng nhập
                </a>
                <a href="/signup" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  Đăng ký
                </a>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; 2026 TechAcademy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
