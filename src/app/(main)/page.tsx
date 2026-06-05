import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseGrid } from "@/components/course/CourseGrid";
import { ArrowRight, Award, Coins, Compass, Heart, MessageSquare, Newspaper, Video } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BawuiAcademy - Nền tảng học trực tuyến đa ngành chất lượng cao",
  description: "Trải nghiệm học tập thế hệ mới cùng BawuiAcademy. Học video on-demand, luyện bài tập trắc nghiệm, nộp bài tập tự luận thực chiến và lộ trình thăng tiến sự nghiệp rõ ràng.",
  openGraph: {
    title: "BawuiAcademy - Nền tảng học trực tuyến đa ngành chất lượng cao",
    description: "Trải nghiệm học tập thế hệ mới cùng BawuiAcademy. Học video on-demand, luyện bài tập trắc nghiệm, nộp bài tập tự luận thực chiến và lộ trình thăng tiến sự nghiệp rõ ràng.",
    type: "website",
  },
};

function getCardStyle(color: string) {
  switch (color) {
    case "purple":
      return {
        card: "hover:border-purple-200 hover:shadow-purple-500/10",
        badge: "bg-purple-50 text-purple-700 border-purple-100",
        btn: "text-purple-600 hover:text-purple-700"
      };
    case "indigo":
      return {
        card: "hover:border-indigo-200 hover:shadow-indigo-500/10",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
        btn: "text-indigo-600 hover:text-indigo-700"
      };
    case "emerald":
      return {
        card: "hover:border-emerald-200 hover:shadow-emerald-500/10",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
        btn: "text-emerald-600 hover:text-emerald-700"
      };
    case "rose":
      return {
        card: "hover:border-rose-200 hover:shadow-rose-500/10",
        badge: "bg-rose-50 text-rose-700 border-rose-100",
        btn: "text-rose-600 hover:text-rose-700"
      };
    default:
      return {
        card: "hover:border-blue-200 hover:shadow-blue-500/10",
        badge: "bg-blue-50 text-blue-700 border-blue-100",
        btn: "text-blue-600 hover:text-blue-700"
      };
  }
}

export default async function HomePage() {
  const session = await auth();

  // Query enrolled courses for user
  const enrollments = session?.user?.id
    ? await prisma.enrollment.findMany({
        where: { userId: session.user.id },
        select: {
          progress: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              thumbnailUrl: true,
              priceCredit: true,
              creator: { select: { name: true } },
              sessions: { select: { lessons: { select: { id: true } } } },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
        take: 3,
      })
    : [];

  const continueCourses = enrollments.map((enrollment) => ({
    ...enrollment.course,
    progress: enrollment.progress,
    lessonsCount: enrollment.course.sessions.reduce((acc, s) => acc + s.lessons.length, 0),
    sessions: undefined,
  }));

  // Query featured/latest courses
  const featuredCourses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceCredit: true,
      creator: { select: { name: true } },
      sessions: { select: { lessons: { select: { id: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const featuredCoursesWithCount = featuredCourses.map((course) => ({
    ...course,
    lessonsCount: course.sessions.reduce((acc, s) => acc + s.lessons.length, 0),
    sessions: undefined,
  }));

  // Query latest blog posts
  const latestBlogs = await prisma.blogPost.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverUrl: true,
      category: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  // Query learning roadmaps from database
  const roadmaps = await prisma.roadmap.findMany({
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-blue-50/50 via-white to-transparent">
        {/* Soft grid background */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm border border-blue-100/50">
              ⚡ Nền tảng học trực tuyến đa ngành thế hệ mới
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl leading-[1.15]">
              Học kỹ năng thực chiến cùng <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">BawuiAcademy</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed">
              Trải nghiệm học tập hiện đại với hệ thống bài giảng chất lượng cao, các bài quiz đánh giá năng lực, tính năng ghi chú trực tiếp trên video và cơ chế thanh toán credit vô cùng linh hoạt.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/courses" className="rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300">
                Khám phá khóa học
              </Link>
              <Link href="/roadmap" className="rounded-xl bg-white border border-slate-200 px-6 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                Lộ trình học tập
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-100 pt-10 sm:grid-cols-4 md:mt-20">
              <div className="p-4">
                <p className="text-3xl font-extrabold text-slate-900 md:text-4xl">15K+</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Học viên tin tưởng</p>
              </div>
              <div className="p-4">
                <p className="text-3xl font-extrabold text-slate-900 md:text-4xl">80+</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Khóa học thực chiến</p>
              </div>
              <div className="p-4">
                <p className="text-3xl font-extrabold text-slate-900 md:text-4xl">98%</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Tỷ lệ hài lòng</p>
              </div>
              <div className="p-4">
                <p className="text-3xl font-extrabold text-slate-900 md:text-4xl">24/7</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Hỗ trợ học tập</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Continue learning (If logged in & enrolled) */}
      {session?.user && continueCourses.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t border-slate-100">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                <span>Tiếp tục học</span>
              </h2>
              <p className="mt-1 text-sm text-slate-500">Quay lại bài giảng để hoàn thành khóa học của bạn.</p>
            </div>
            <Link href="/my-courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Xem tất cả khóa học của tôi &rarr;
            </Link>
          </div>
          <CourseGrid courses={continueCourses} />
        </section>
      )}

      {/* Featured Courses Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 border-t border-slate-100">
        <div className="mb-10 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Khóa học nổi bật</h2>
            <p className="mt-1 text-sm sm:text-base text-slate-500">Khám phá các khóa học công nghệ chất lượng cao được đánh giá tốt nhất.</p>
          </div>
          <Link href="/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
            <span>Tất cả khóa học</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <CourseGrid courses={featuredCoursesWithCount} />
      </section>

      {/* Why Choose Us */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Trải nghiệm học tập vượt trội
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-500 leading-relaxed">
              BawuiAcademy mang đến những công cụ và phương pháp học tập tiên tiến giúp bạn tối ưu hóa thời gian và tiến bộ nhanh nhất có thể.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-blue-100 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Video className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">Học Video On-demand</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Học trực quan qua video chất lượng cao, có thể tua và điều chỉnh tốc độ tùy theo nhu cầu học tập của bạn.
              </p>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-blue-100 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">Quiz & Bài Tập</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Đánh giá năng lực tức thời thông qua bài kiểm tra giữa khóa, cuối khóa và các thử thách thực hành thực tế.
              </p>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-blue-100 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">Ghi Chú Độc Đáo</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Tạo ghi chú trực tiếp ngay tại mốc thời gian của video bài học, dễ dàng ôn tập lại bất cứ khi nào.
              </p>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-6 transition-all duration-300 hover:bg-white hover:shadow-xl hover:border-blue-100 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">Ví Credit Linh Hoạt</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Mua khóa học lẻ tiện lợi bằng hệ thống tín dụng Credit, không cần đăng ký gói cước tháng đắt đỏ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Roadmaps */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-slate-50/60 via-white to-slate-50/20 border-t border-slate-100 relative overflow-hidden">
        {/* Soft blur glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100/50 shadow-sm">
              🎯 Career Roadmap
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Lộ trình nghề nghiệp bài bản
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
              Định hướng sẵn sàng cho sự nghiệp. Chọn lộ trình phù hợp với mục tiêu của bạn để trở thành chuyên gia chuyên nghiệp trong ngành.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roadmaps.map((roadmap) => {
              const styles = getCardStyle(roadmap.badgeColor);
              let stepList: string[] = [];
              try {
                stepList = JSON.parse(roadmap.steps) || [];
              } catch {}
              
              const visibleSteps = stepList.slice(0, 4);
              const extraSteps = stepList.length - 4;

              return (
                <div 
                  key={roadmap.id} 
                  className={`relative flex flex-col justify-between rounded-3xl border border-slate-100 bg-white/70 backdrop-blur-sm p-8 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${styles.card} group`}
                >
                  <div>
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
                      {roadmap.level}
                    </span>
                    <h3 className="mt-5 text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {roadmap.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500 line-clamp-3">
                      {roadmap.summary}
                    </p>

                    {/* Step pills */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {visibleSteps.map((step, sIdx) => (
                        <span 
                          key={sIdx} 
                          className="bg-slate-100/60 text-slate-600 text-xs px-2.5 py-1 rounded-md font-semibold border border-slate-100"
                        >
                          {step}
                        </span>
                      ))}
                      {extraSteps > 0 && (
                        <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-md font-bold border border-blue-100">
                          + {extraSteps} bước nữa
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100/60">
                    <Link href="/roadmap" className={`inline-flex items-center gap-1 text-sm font-bold ${styles.btn}`}>
                      <span>Khám phá chi tiết</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Học viên nói gì về chúng tôi
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-500">
              Hàng ngàn học viên đã tìm được cơ hội việc làm tốt hơn và nâng tầm tư duy nghề nghiệp sau các khóa học tại BawuiAcademy.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-amber-400">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 italic">
                "Khóa học Next.js thực sự rất chi tiết. Mình từ một người chỉ biết ReactJS cơ bản nay đã tự tay xây dựng được hệ thống Fullstack hoàn chỉnh có thanh toán và phân quyền."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Image src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80" alt="Avatar" width={40} height={40} className="rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Hoàng Khánh Vy</h4>
                  <p className="text-xs text-slate-400">Software Engineer tại VNG</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-amber-400">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 italic">
                "Hệ thống credit cực kỳ linh hoạt, mình có thể chọn mua lẻ từng khóa học mà mình thích mà không lo gánh nặng chi phí hàng tháng. Video chạy mượt và bài viết blog rất bổ ích."
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Image src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80" alt="Avatar" width={40} height={40} className="rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Lê Tuấn Kiệt</h4>
                  <p className="text-xs text-slate-400">Học viên từ Hà Nội</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-1 text-amber-400">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 italic">
                "Khóa học ReactJS Masterclass dạy cực kỳ dễ hiểu. Tính năng Note ngay trên Video giúp mình lưu lại các kiến thức quan trọng và xem lại nhanh chóng. Rất khuyến khích các bạn tham gia!"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" alt="Avatar" width={40} height={40} className="rounded-full object-cover" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Trần Thảo Linh</h4>
                  <p className="text-xs text-slate-400">Frontend Developer tại FPT Software</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-16 md:py-24 bg-slate-50/50 border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Kiến thức & Xu hướng mới nhất
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-500">
                Khám phá các bài viết chia sẻ kinh nghiệm, hướng dẫn thực hành thực tế hàng tuần.
              </p>
            </div>
            <Link href="/blog" className="mt-4 md:mt-0 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              <span>Xem tất cả bài viết</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {latestBlogs.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id} className="group block">
                <article className="h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg">
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    {post.coverUrl ? (
                      <Image src={post.coverUrl} alt={post.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400 bg-slate-50">
                        <Newspaper className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <span className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-400 font-semibold">
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("vi-VN", { day: "numeric", month: "long", year: "numeric" }) : ""}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
                      <span>Tác giả: {post.author?.name || "BawuiAcademy"}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-900 text-white py-20 text-center">
        {/* Glowing gradients */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"></div>
        
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
            Sẵn sàng nâng tầm kỹ năng chuyên môn của bạn?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
            Đăng ký tài khoản ngay hôm nay để nhận ngay 500 credit nạp ví miễn phí để trải nghiệm những khóa học đầu tiên của chúng tôi.
          </p>
          <div className="mt-8">
            <Link href="/signup" className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-xl hover:bg-blue-50 transition-colors">
              Đăng ký tài khoản miễn phí
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
