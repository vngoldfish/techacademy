import { prisma } from "@/lib/db";
import { CourseGrid } from "@/components/course/CourseGrid";
import { auth } from "@/lib/auth";
import { BookOpen, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thư viện khóa học thực chiến | BawuiAcademy",
  description: "Khám phá danh sách các khóa học công nghệ và kỹ năng số thực chiến chất lượng cao tại BawuiAcademy: Thiết kế UI/UX, lập trình Web, AI và nhiều ngành nghề hấp dẫn.",
  openGraph: {
    title: "Thư viện khóa học thực chiến | BawuiAcademy",
    description: "Khám phá danh sách các khóa học công nghệ và kỹ năng số thực chiến chất lượng cao tại BawuiAcademy: Thiết kế UI/UX, lập trình Web, AI và nhiều ngành nghề hấp dẫn.",
    type: "website",
  },
};

export default async function CoursesPage() {
  const session = await auth();

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceCredit: true,
      creator: { select: { name: true } },
      sessions: {
        select: {
          lessons: { select: { id: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const coursesWithCount = courses.map((course) => ({
    ...course,
    lessonsCount: course.sessions.reduce((acc, s) => acc + s.lessons.length, 0),
    sessions: undefined,
  }));

  let enrolledCourseIds: string[] = [];
  let enrollmentProgressByCourseId: Record<string, number> = {};
  if (session?.user?.id) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: { courseId: true, progress: true },
    });
    enrolledCourseIds = enrollments.map((e) => e.courseId);
    enrollmentProgressByCourseId = Object.fromEntries(
      enrollments.map((e) => [e.courseId, e.progress])
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Hero Banner */}
      <section className="relative overflow-hidden bg-slate-900 py-16 text-white mb-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 border border-blue-400/20 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Thư viện khóa học thực chiến
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Chinh phục tri thức mới
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mx-auto">
              Nâng cấp kỹ năng chuyên môn vượt bậc với kho khóa học chất lượng cao, bài tập phong phú và đội ngũ mentor kinh nghiệm.
            </p>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <div className="container mx-auto px-4">
        {coursesWithCount.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60 shadow-sm max-w-lg mx-auto">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-base font-bold text-slate-900">Chưa có khóa học nào</h3>
            <p className="mt-2 text-sm text-slate-500">Các bài học thực chiến hấp dẫn đang được chuẩn bị. Quay lại sau bạn nhé!</p>
          </div>
        ) : (
          <CourseGrid
            courses={coursesWithCount}
            enrolledCourseIds={enrolledCourseIds}
            enrollmentProgressByCourseId={enrollmentProgressByCourseId}
          />
        )}
      </div>
    </div>
  );
}
