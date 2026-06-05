"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

// Known static path translations
const segmentTranslations: Record<string, string> = {
  admin: "Quản trị",
  courses: "Khóa học",
  sessions: "Chương học",
  lessons: "Bài học",
  lesson: "Bài học",
  users: "Thành viên",
  roadmaps: "Lộ trình học",
  blog: "Tin tức & Blog",
  "blog-posts": "Duyệt bài viết",
  settings: "Cấu hình",
  submissions: "Bài nộp học viên",
  "instructor-applications": "Yêu cầu giảng viên",
  profile: "Trang cá nhân",
  "my-courses": "Khóa học của tôi",
  dashboard: "Bảng điều khiển",
  learn: "Học tập",
  quiz: "Trắc nghiệm",
  roadmap: "Lộ trình",
  signin: "Đăng nhập",
  signup: "Đăng ký",
  new: "Thêm mới",
  quizzes: "Bài kiểm tra",
};

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Don't render on the home page
  if (!pathname || pathname === "/") {
    return null;
  }

  // Determine wrapper container class based on active route segment
  const isLearn = pathname.startsWith("/learn");
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  
  const wrapperClass = isLearn
    ? "px-6 pt-4 w-full shrink-0"
    : isAdmin
    ? "w-full shrink-0"
    : "container mx-auto px-4 pt-5 w-full shrink-0";

  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    // Generate route for this segment
    let href = "/" + segments.slice(0, index + 1).join("/");
    let disableLink = false;

    // Check custom path rules to avoid broken/404 links
    if (href === "/learn" || href === "/quiz") {
      disableLink = true;
    } else if (segments[0] === "learn" && index === 2 && segment === "lesson") {
      disableLink = true;
    } else if (segments[0] === "courses" && index === 2 && segment === "lessons") {
      disableLink = true;
    } else if (
      segments[0] === "admin" &&
      segments[1] === "courses" &&
      segments[3] === "sessions" &&
      index === 4
    ) {
      href = `/admin/courses/${segments[2]}/sessions/${segments[4]}/lessons`;
    }

    // Translate segment
    let label = segmentTranslations[segment];

    if (!label) {
      // Heuristic: If we don't have a static translation, check preceding segment to determine label
      const preceding = index > 0 ? segments[index - 1] : "";
      
      if (preceding === "courses") {
        label = "Chi tiết khóa học";
      } else if (preceding === "sessions") {
        label = "Chi tiết chương";
      } else if (preceding === "lessons" || preceding === "lesson") {
        label = "Chi tiết bài học";
      } else if (preceding === "users") {
        label = "Chi tiết thành viên";
      } else if (preceding === "roadmaps") {
        label = "Chi tiết lộ trình";
      } else if (preceding === "blog-posts" || preceding === "blog") {
        label = "Chi tiết bài viết";
      } else if (preceding === "submissions") {
        label = "Chi tiết bài làm";
      } else if (preceding === "learn") {
        label = "Chi tiết khóa học";
      } else if (preceding === "quiz") {
        label = "Chi tiết trắc nghiệm";
      } else {
        // Fallback: Format slug nicely
        label = segment
          .replace(/-/g, " ")
          .replace(/_/g, " ")
          .split(" ")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
    }

    return { label, href, disableLink };
  });

  return (
    <div className={wrapperClass}>
      <nav className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-100/80 shadow-sm w-fit max-w-full overflow-x-auto shrink-0 select-none">
        <Link href="/" className="flex items-center text-slate-400 hover:text-blue-600 transition-colors">
          <Home className="h-3.5 w-3.5" />
        </Link>

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <div key={idx} className="flex items-center space-x-1.5 shrink-0">
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              {isLast ? (
                <span className="text-slate-800 font-bold truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : crumb.disableLink ? (
                <span className="text-slate-400 font-medium truncate max-w-[150px] cursor-default select-none">
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  href={crumb.href} 
                  className="hover:text-blue-600 text-slate-500 transition-colors truncate max-w-[150px]"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
