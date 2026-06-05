"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { X, Sparkles, BookOpen, ChevronRight, Coins, RefreshCw } from "lucide-react";
import { RecommendedCourse } from "@/lib/recommendations";

export function FloatingRecommendations() {
  const pathname = usePathname();
  const [courses, setCourses] = useState<RecommendedCourse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if dismissed in this session
    const dismissed = sessionStorage.getItem("dismissed_floating_recs") === "true";
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Do not show on learning/quiz pages
    if (pathname?.startsWith("/learn") || pathname?.startsWith("/quiz") || pathname?.startsWith("/admin")) {
      setIsOpen(false);
      return;
    }

    async function fetchRecommendations() {
      try {
        setLoading(true);
        const res = await fetch("/api/courses/recommendations");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCourses(data);
            // Delay opening slightly for a premium feel
            setTimeout(() => {
              setIsOpen(true);
            }, 3000);
          }
        }
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    sessionStorage.setItem("dismissed_floating_recs", "true");
  };

  const handleNextSuggestion = () => {
    if (courses.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % courses.length);
  };

  if (isDismissed || !isOpen || courses.length === 0) return null;

  const currentCourse = courses[currentIndex];

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-[320px] w-full animate-in slide-in-from-bottom-8 fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-white/90 border border-slate-200/60 shadow-2xl backdrop-blur-md transition-all duration-300 hover:shadow-blue-500/10 hover:border-blue-200 group">
        
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>

        {/* Header bar */}
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[11px] font-extrabold text-blue-700 tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Gợi ý học tập
            </span>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-0.5 hover:bg-slate-200/50 transition-colors"
            title="Đóng gợi ý"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 flex gap-3">
          {/* Course thumbnail */}
          <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
            {currentCourse.thumbnailUrl ? (
              <Image 
                src={currentCourse.thumbnailUrl} 
                alt={currentCourse.title} 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-blue-50 to-indigo-50 flex items-center justify-center text-blue-500 font-bold">
                B
              </div>
            )}
          </div>

          {/* Text fields */}
          <div className="flex-1 min-w-0">
            <span className="inline-block bg-blue-50 text-[10px] font-bold text-blue-600 px-2 py-0.5 rounded border border-blue-100/50">
              {currentCourse.category}
            </span>
            <h4 className="mt-1.5 text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
              {currentCourse.title}
            </h4>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-600">
                <Coins className="h-3 w-3" />
                <span>{currentCourse.priceCredit > 0 ? `${currentCourse.priceCredit} Credit` : "Miễn phí"}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{currentCourse.lessonsCount} bài học</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
          {courses.length > 1 ? (
            <button 
              onClick={handleNextSuggestion}
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1 font-semibold transition-colors"
            >
              <RefreshCw className="h-3 w-3" /> Gợi ý khác
            </button>
          ) : (
            <div className="text-[10px] text-slate-400 font-medium">BawuiAcademy</div>
          )}
          
          <Link 
            href={`/courses/${currentCourse.slug}`}
            onClick={() => setIsOpen(false)}
            className="bg-blue-600 hover:bg-blue-750 text-white rounded-lg px-3 py-1.5 font-bold flex items-center gap-0.5 shadow-md shadow-blue-500/10 hover:shadow-lg transition-all duration-300"
          >
            Xem ngay <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
}
