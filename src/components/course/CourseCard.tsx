import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
    creator?: { name: string | null };
  };
  isEnrolled?: boolean;
}

export function CourseCard({ course, isEnrolled }: CourseCardProps) {
  return (
    <Link href={`/courses/${course.slug}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-video bg-gray-100">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          {isEnrolled && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-600">Đã đăng ký</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
          {course.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{course.description}</p>
          )}
          {course.creator && (
            <p className="mt-2 text-xs text-gray-400">{course.creator.name}</p>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <div className="flex w-full items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(course.priceCredit)}
            </span>
            {course.lessonsCount !== undefined && (
              <span className="text-xs text-gray-400">
                {course.lessonsCount} bài học
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
