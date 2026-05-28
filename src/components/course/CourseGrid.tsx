import { CourseCard } from "./CourseCard";

interface CourseGridProps {
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    thumbnailUrl: string | null;
    priceCredit: number;
    sessionsCount?: number;
    lessonsCount?: number;
    creator?: { name: string | null };
  }>;
  enrolledCourseIds?: string[];
}

export function CourseGrid({ courses, enrolledCourseIds }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Chưa có khóa học nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          isEnrolled={enrolledCourseIds?.includes(course.id)}
        />
      ))}
    </div>
  );
}
