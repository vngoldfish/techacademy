import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BookOpen, Coins, ArrowRight, User } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnailUrl: string | null;
    priceCredit: number;
    sessionsCount?: number;
    lessonsCount?: number;
    progress?: number;
    creator?: { name: string | null };
  };
  isEnrolled?: boolean;
  progress?: number;
}

export function CourseCard({ course, isEnrolled, progress }: CourseCardProps) {
  const courseProgress = Math.round(progress ?? course.progress ?? 0);
  const enrolled = isEnrolled || progress !== undefined;

  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <Card className="h-full flex flex-col justify-between overflow-hidden border border-slate-100 bg-white/70 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-200/80 rounded-3xl group">
        <div>
          {/* Thumbnail Image */}
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 rounded-t-3xl">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-tr from-blue-50 to-indigo-50 text-blue-400">
                <BookOpen className="h-10 w-10 stroke-[1.2] transition-transform duration-300 group-hover:scale-110" />
              </div>
            )}
            
            {/* Status Badge */}
            {enrolled && (
              <div className="absolute right-4 top-4">
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold border-0 px-3 py-1 rounded-lg text-xs shadow-md shadow-emerald-500/10">
                  Đang học
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="p-6">
            <h3 className="line-clamp-2 text-base font-extrabold text-slate-900 leading-snug transition-colors group-hover:text-blue-600">
              {course.title}
            </h3>
            {course.description && (
              <p className="mt-2.5 line-clamp-2 text-sm text-slate-500 leading-relaxed">{course.description}</p>
            )}
            
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Giảng viên: <strong className="text-slate-600">{course.creator?.name || "BawuiAcademy"}</strong></span>
            </div>

            {/* Learning progress bar */}
            {enrolled && (
              <div className="mt-5 space-y-2 border-t border-slate-100/60 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Tiến độ học tập</span>
                  <span className="font-bold text-emerald-600">{courseProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" 
                    style={{ width: `${courseProgress}%` }} 
                  />
                </div>
              </div>
            )}
          </CardContent>
        </div>

        <CardFooter className="flex items-center justify-between border-t border-slate-100/60 p-6 pt-4">
          <div>
            {enrolled ? (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
                Học tiếp <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            ) : (
              <div className="flex items-center gap-1 text-blue-600 font-extrabold">
                <Coins className="h-4.5 w-4.5 fill-blue-500/10 text-blue-500" />
                <span className="text-base">{formatCurrency(course.priceCredit)}</span>
              </div>
            )}
          </div>
          
          {course.lessonsCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              <span>{course.lessonsCount} bài học</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
