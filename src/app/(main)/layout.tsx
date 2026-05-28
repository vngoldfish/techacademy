import type { ReactNode } from "react";
import { auth } from "@/lib/auth";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="text-xl font-bold text-blue-600">
            TechAcademy
          </a>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="/courses" className="text-sm font-medium text-gray-700 hover:text-blue-600">
              Khóa học
            </a>
          </nav>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <a href="/profile" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                {session.user.name ?? session.user.email}
              </a>
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
