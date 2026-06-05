import { ArrowRight, CheckCircle2, Navigation, Compass, Target, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lộ trình đào tạo nghề nghiệp bài bản | BawuiAcademy",
  description: "Định hướng sẵn sàng cho sự nghiệp của bạn với các lộ trình học tập chi tiết, từng bước tại BawuiAcademy: Lập trình viên, chuyên gia thiết kế, chuyên viên kỹ thuật.",
  openGraph: {
    title: "Lộ trình đào tạo nghề nghiệp bài bản | BawuiAcademy",
    description: "Định hướng sẵn sàng cho sự nghiệp của bạn với các lộ trình học tập chi tiết, từng bước tại BawuiAcademy: Lập trình viên, chuyên gia thiết kế, chuyên viên kỹ thuật.",
    type: "website",
  },
};

interface RoadmapType {
  id: string;
  title: string;
  level: string;
  description: string;
  summary: string;
  steps: string;
  badgeColor: string;
  orderIndex: number;
}

function getRoadmapStyles(color: string) {
  switch (color) {
    case "purple":
      return {
        badge: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
        gradient: "from-purple-600 to-pink-600",
        accent: "purple",
        glow: "shadow-purple-500/5 hover:shadow-purple-500/10",
        border: "border-purple-100 hover:border-purple-200 dark:border-purple-900 dark:hover:border-purple-700",
        dot: "bg-purple-600 ring-purple-100 dark:ring-purple-950",
        bgLight: "bg-purple-50/50 dark:bg-purple-950/10",
        text: "text-purple-600 dark:text-purple-400",
        line: "from-purple-500 to-pink-500",
      };
    case "indigo":
      return {
        badge: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800",
        gradient: "from-indigo-600 to-purple-600",
        accent: "indigo",
        glow: "shadow-indigo-500/5 hover:shadow-indigo-500/10",
        border: "border-indigo-100 hover:border-indigo-200 dark:border-indigo-900 dark:hover:border-indigo-700",
        dot: "bg-indigo-600 ring-indigo-100 dark:ring-indigo-950",
        bgLight: "bg-indigo-50/50 dark:bg-indigo-950/10",
        text: "text-indigo-600 dark:text-indigo-400",
        line: "from-indigo-500 to-purple-500",
      };
    case "emerald":
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800",
        gradient: "from-emerald-600 to-teal-600",
        accent: "emerald",
        glow: "shadow-emerald-500/5 hover:shadow-emerald-500/10",
        border: "border-emerald-100 hover:border-emerald-200 dark:border-emerald-900 dark:hover:border-emerald-700",
        dot: "bg-emerald-600 ring-emerald-100 dark:ring-emerald-950",
        bgLight: "bg-emerald-50/50 dark:bg-emerald-950/10",
        text: "text-emerald-600 dark:text-emerald-400",
        line: "from-emerald-500 to-teal-500",
      };
    case "rose":
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800",
        gradient: "from-rose-600 to-pink-600",
        accent: "rose",
        glow: "shadow-rose-500/5 hover:shadow-rose-500/10",
        border: "border-rose-100 hover:border-rose-200 dark:border-rose-900 dark:hover:border-rose-700",
        dot: "bg-rose-600 ring-rose-100 dark:ring-rose-950",
        bgLight: "bg-rose-50/50 dark:bg-rose-950/10",
        text: "text-rose-600 dark:text-rose-400",
        line: "from-rose-500 to-pink-500",
      };
    default:
      return {
        badge: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
        gradient: "from-blue-600 to-indigo-600",
        accent: "blue",
        glow: "shadow-blue-500/5 hover:shadow-blue-500/10",
        border: "border-blue-100 hover:border-blue-200 dark:border-blue-900 dark:hover:border-blue-700",
        dot: "bg-blue-600 ring-blue-100 dark:ring-blue-950",
        bgLight: "bg-blue-50/50 dark:bg-blue-950/10",
        text: "text-blue-600 dark:text-blue-400",
        line: "from-blue-500 to-indigo-500",
      };
  }
}

export default async function RoadmapPage() {
  const roadmaps: RoadmapType[] = await prisma.roadmap.findMany({
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        {/* Decorative Grid and Blur Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3.5 py-1.5 text-xs font-semibold text-blue-400 border border-blue-400/20 shadow-sm">
              <Compass className="h-3.5 w-3.5 animate-spin-slow" /> Learning Paths
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Lộ trình đào tạo nghề bài bản
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Không còn hoang mang nên học gì trước, học gì sau. Hãy chọn lộ trình phù hợp với mục tiêu nghề nghiệp của bạn và phát triển kỹ năng từng bước vững chắc.
            </p>
          </div>

          {/* Quick Jump Navigator */}
          {roadmaps.length > 0 && (
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {roadmaps.map((roadmap) => (
                <a
                  key={roadmap.id}
                  href={`#roadmap-${roadmap.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <Navigation className="h-4 w-4" />
                  {roadmap.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Roadmaps Detailed List */}
      <div className="container mx-auto px-4 mt-20 space-y-24">
        {roadmaps.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/60 shadow-sm max-w-xl mx-auto">
            <Target className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy lộ trình</h3>
            <p className="mt-2 text-slate-500">Hệ thống đang cập nhật lộ trình học mới. Vui lòng quay lại sau.</p>
          </div>
        ) : (
          roadmaps.map((roadmap, index) => {
            const styles = getRoadmapStyles(roadmap.badgeColor);
            let stepsList: string[] = [];
            try {
              stepsList = JSON.parse(roadmap.steps) || [];
            } catch (e) {
              console.error("Failed to parse steps for roadmap: " + roadmap.title, e);
            }

            return (
              <section
                key={roadmap.id}
                id={`roadmap-${roadmap.id}`}
                className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
              >
                {/* Info Column */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                  <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                    {roadmap.level}
                  </span>
                  
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl flex items-center gap-3">
                    <span className={`h-8 w-1.5 rounded-full bg-gradient-to-b ${styles.line}`} />
                    {roadmap.title}
                  </h2>

                  <p className="text-slate-600 leading-relaxed text-base">
                    {roadmap.description}
                  </p>

                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <h4 className="font-bold text-slate-950 flex items-center gap-2 mb-3">
                      <GraduationCap className={`h-5 w-5 ${styles.text}`} />
                      Mục tiêu đạt được:
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {roadmap.summary}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link href={`/courses?roadmap=${roadmap.id}`} className="block">
                      <Button className={`w-full sm:w-auto px-6 py-4 rounded-xl text-white font-bold bg-gradient-to-r ${styles.gradient} shadow-md shadow-blue-500/10 hover:opacity-95 transition-opacity`}>
                        Xem các khóa học phù hợp
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Timeline Column */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100/50 to-transparent rounded-bl-3xl pointer-events-none"></div>
                  
                  <div className="relative">
                    <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dot}`}></span>
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`}></span>
                      </span>
                      Hành trình học tập của bạn
                    </h3>

                    {/* Timeline Line Connector */}
                    <div className="absolute left-[23px] top-[48px] bottom-[24px] w-1 bg-gradient-to-b from-slate-100 via-slate-200 to-slate-100 rounded-full z-0"></div>

                    {/* Timeline Steps */}
                    <div className="space-y-8 relative z-10">
                      {stepsList.map((step, sIdx) => {
                        const isLast = sIdx === stepsList.length - 1;
                        return (
                          <div key={sIdx} className="flex gap-6 group">
                            {/* Step Number Node */}
                            <div className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm bg-gradient-to-br ${styles.gradient} transition-transform duration-300 group-hover:scale-110`}>
                              {sIdx + 1 < 10 ? `0${sIdx + 1}` : sIdx + 1}
                            </div>

                            {/* Step Card Content */}
                            <div className="flex-1 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all duration-300">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {step}
                                </h4>
                                {isLast ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50">
                                    Cột mốc hoàn thành
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-slate-500 bg-white border-slate-200">
                                    Bước {sIdx + 1}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                                Đạt được kiến thức chuyên sâu và hoàn thành các bài thực hành về <strong className="text-slate-700">{step}</strong> trong chương trình học.
                              </p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Goal Success Step */}
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-50 dark:ring-emerald-950/20">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 rounded-2xl border border-emerald-100/60 p-5 shadow-sm">
                          <h4 className="font-extrabold text-slate-950">
                            💼 Đi làm / Nhận dự án freelancing
                          </h4>
                          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                            Hoàn thành tất cả các bước trong lộ trình học tập, hoàn thiện Portfolio sản phẩm và bắt đầu ứng tuyển các vị trí công việc mơ ước!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
