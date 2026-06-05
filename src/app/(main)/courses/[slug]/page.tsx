import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { SessionList } from "@/components/course/SessionList";
import { PurchaseButton } from "@/components/course/PurchaseButton";
import { BookOpen, Calendar, Award, PlayCircle, Coins, Clock, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { TrackCourseView } from "@/components/recommendation/TrackCourseView";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: {
      title: true,
      description: true,
      thumbnailUrl: true,
    },
  });

  if (!course) {
    return {
      title: "Khóa học không tìm thấy | BawuiAcademy",
    };
  }

  const title = `${course.title} | Khóa học BawuiAcademy`;
  const description = course.description?.slice(0, 160) || "Đăng ký khóa học chất lượng tại BawuiAcademy.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: course.thumbnailUrl ? [{ url: course.thumbnailUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
    },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceCredit: true,
      category: true,
      creator: { select: { name: true, avatarUrl: true } },
      sessions: {
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          orderIndex: true,
          lessons: {
            orderBy: { orderIndex: "asc" },
            select: {
              id: true,
              title: true,
              orderIndex: true,
              isFree: true,
              isGated: true,
              duration: true,
            },
          },
        },
      },
      quizzes: {
        select: { id: true, title: true, quizType: true },
      },
    },
  });

  if (!course) notFound();

  let isEnrolled = false;
  let progress = 0;
  let completedLessonIds = new Set<string>();
  if (session?.user?.id) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
    isEnrolled = !!enrollment;
    progress = enrollment?.progress ?? 0;

    if (isEnrolled) {
      const lessonProgress = await prisma.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          completed: true,
          lesson: { session: { courseId: course.id } },
        },
        select: { lessonId: true },
      });
      completedLessonIds = new Set(lessonProgress.map((item) => item.lessonId));
    }
  }

  const totalLessons = course.sessions.reduce(
    (acc, s) => acc + s.lessons.length, 0
  );
  const completedLessons = completedLessonIds.size;
  const remainingLessons = Math.max(totalLessons - completedLessons, 0);
  const sessionsWithProgress = course.sessions.map((s) => ({
    ...s,
    completedLessons: s.lessons.filter((l) => completedLessonIds.has(l.id)).length,
    lessons: s.lessons.map((l) => ({ ...l, completed: completedLessonIds.has(l.id) })),
  }));
  const currentLesson = sessionsWithProgress
    .flatMap((s) => s.lessons)
    .find((lesson) => !lesson.completed);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description || "",
    "provider": {
      "@type": "Organization",
      "name": "BawuiAcademy",
      "sameAs": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    "image": course.thumbnailUrl ? [course.thumbnailUrl] : [],
    "offers": {
      "@type": "Offer",
      "category": "Paid",
      "price": course.priceCredit,
      "priceCurrency": "Credit",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackCourseView category={course.category} slug={course.slug} />
      <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Course Dark Hero Block */}
      <section className="relative overflow-hidden bg-slate-900 py-16 text-white mb-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-15"></div>
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl space-y-6">
            <Link 
              href="/courses" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/10 rounded-xl px-3.5 py-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại danh sách khóa học
            </Link>

            <h1 className="text-3xl font-extrabold sm:text-4xl md:text-5xl text-white leading-tight">
              {course.title}
            </h1>

            {course.creator && (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 w-fit">
                {course.creator.avatarUrl ? (
                  <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10">
                    <Image
                      src={course.creator.avatarUrl}
                      alt={course.creator.name || "Instructor"}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-white/10">
                    <User className="h-4.5 w-4.5" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Giảng viên hướng dẫn</p>
                  <p className="text-sm font-bold text-slate-100">{course.creator.name || "BawuiAcademy Lead"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Columns Content */}
      <div className="container mx-auto px-4">
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Main content Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Thumbnail Image Container */}
            {course.thumbnailUrl && (
              <div className="relative aspect-video overflow-hidden rounded-3xl border border-slate-200/80 shadow-md bg-white">
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Course Description */}
            {course.description && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="h-6 w-1 rounded-full bg-blue-600" />
                  Giới thiệu khóa học
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                  {course.description}
                </p>
              </div>
            )}

            {/* Session Lessons List */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <span className="h-6 w-1 rounded-full bg-blue-600" />
                Nội dung học tập
              </h3>
              <p className="text-xs text-slate-400 font-semibold mb-6">
                {course.sessions.length} buổi học · {completedLessons}/{totalLessons} bài học đã hoàn thành · còn {remainingLessons} bài học chưa học
              </p>

              {isEnrolled && currentLesson && (
                <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 flex items-center gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <PlayCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900">Bài học tiếp theo của bạn</p>
                    <p className="mt-0.5 text-sm font-semibold text-blue-700">{currentLesson.title}</p>
                  </div>
                </div>
              )}

              <SessionList
                sessions={sessionsWithProgress}
                isEnrolled={isEnrolled}
                courseSlug={course.slug}
              />
            </div>

            {/* Quizzes Section */}
            {course.quizzes.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="h-6 w-1 rounded-full bg-blue-600" />
                  Hệ thống bài kiểm tra trắc nghiệm
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.quizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-5 hover:bg-white hover:border-blue-100 hover:shadow-md transition-all duration-300 group"
                    >
                      <div>
                        <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {quiz.quizType === "MIDTERM" ? "Đánh giá giữa khóa" : "Đánh giá cuối khóa"}
                        </Badge>
                        <h4 className="font-extrabold text-slate-900 mt-3 group-hover:text-blue-600 transition-colors">
                          {quiz.title}
                        </h4>
                      </div>

                      {isEnrolled ? (
                        <a href={`/quiz/${quiz.id}`} className="block">
                          <Button className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md shadow-blue-500/10">
                            Bắt đầu làm bài
                          </Button>
                        </a>
                      ) : (
                        <Button disabled className="w-full rounded-xl bg-slate-100 text-slate-400 font-bold border border-slate-200">
                          Hãy mua khóa học để mở khóa
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating Sidebar Column */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-200/60 bg-white p-6 sm:p-8 shadow-md space-y-6">
              
              {/* Pricing Display */}
              {(!session?.user || isEnrolled) && (
                <div className="text-center bg-slate-50/50 rounded-2xl py-6 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Học phí khóa học</p>
                  <div className="inline-flex items-center gap-1.5 text-3xl font-black text-blue-600">
                    <Coins className="h-7 w-7 text-blue-500 fill-blue-500/10 shrink-0" />
                    <span>{formatCurrency(course.priceCredit)}</span>
                  </div>
                </div>
              )}

              {/* Purchase / Enrolled status and buttons */}
              {isEnrolled ? (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl">
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-0 font-bold px-3 py-1 rounded-md text-xs">
                      Đã đăng ký học
                    </Badge>
                    <p className="mt-3 text-xs text-slate-500 leading-relaxed font-semibold">
                      Tiến độ đạt: <strong className="text-emerald-600">{completedLessons}/{totalLessons}</strong> bài học ({Math.round(progress)}%)
                    </p>
                  </div>
                  <a href={`/learn/${course.id}`} className="block">
                    <Button className="w-full py-6 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white shadow-lg shadow-emerald-500/10">
                      Vào lớp học tiếp
                    </Button>
                  </a>
                </div>
              ) : session?.user ? (
                <PurchaseButton 
                  courseSlug={course.slug} 
                  courseId={course.id} 
                  originalPrice={course.priceCredit} 
                />
              ) : (
                <a href="/signin" className="block">
                  <Button className="w-full py-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10">
                    Đăng nhập để đăng ký khóa học
                  </Button>
                </a>
              )}

              <Separator className="bg-slate-100" />

              {/* Course Specs Stats */}
              <div className="space-y-3.5 text-sm text-slate-600">
                <div className="flex justify-between items-center bg-slate-50/30 px-3.5 py-2.5 rounded-xl border border-slate-100/50">
                  <span className="flex items-center gap-2 text-slate-400 font-semibold text-xs">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Số buổi học
                  </span>
                  <span className="font-bold text-slate-900">{course.sessions.length} buổi</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-50/30 px-3.5 py-2.5 rounded-xl border border-slate-100/50">
                  <span className="flex items-center gap-2 text-slate-400 font-semibold text-xs">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Tổng số bài học
                  </span>
                  <span className="font-bold text-slate-900">{totalLessons} bài học</span>
                </div>

                {course.creator && (
                  <div className="flex justify-between items-center bg-slate-50/30 px-3.5 py-2.5 rounded-xl border border-slate-100/50">
                    <span className="flex items-center gap-2 text-slate-400 font-semibold text-xs">
                      <Award className="h-4 w-4 text-slate-400" />
                      Giảng viên
                    </span>
                    <span className="font-bold text-slate-900">{course.creator.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
    </>
  );
}
