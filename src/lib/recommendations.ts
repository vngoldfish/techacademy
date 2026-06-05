import { prisma } from "@/lib/db";

export interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  priceCredit: number;
  category: string;
  createdAt: Date;
  creator: {
    name: string | null;
  };
  lessonsCount: number;
  score: number;
}

export async function getPersonalizedRecommendations(
  userId?: string,
  interestsCookieValue?: string
): Promise<RecommendedCourse[]> {
  // 1. Fetch user's enrollments to exclude them and determine interests
  const enrollments = userId
    ? await prisma.enrollment.findMany({
        where: { userId },
        select: {
          courseId: true,
          course: {
            select: {
              category: true,
            },
          },
        },
      })
    : [];

  const enrolledCourseIds = enrollments.map((e) => e.courseId);
  const categoryScores: Record<string, number> = {};

  // Add points for enrolled categories (5 points per enrollment)
  enrollments.forEach((e) => {
    const cat = e.course.category;
    categoryScores[cat] = (categoryScores[cat] || 0) + 5;
  });

  // 2. Parse interests from cookie (1 point per course category view)
  if (interestsCookieValue) {
    try {
      // Clean cookie quotes if wrapped
      let rawCookie = interestsCookieValue.trim();
      if (rawCookie.startsWith('"') && rawCookie.endsWith('"')) {
        rawCookie = rawCookie.substring(1, rawCookie.length - 1);
      }
      
      const decoded = decodeURIComponent(rawCookie);
      const cookieInterests = JSON.parse(decoded) as Record<string, number>;
      
      if (cookieInterests && typeof cookieInterests === "object") {
        Object.entries(cookieInterests).forEach(([cat, count]) => {
          if (typeof count === "number") {
            categoryScores[cat] = (categoryScores[cat] || 0) + count;
          }
        });
      }
    } catch (e) {
      console.error("[Recommendations] Failed to parse interests cookie", e);
    }
  }

  // 3. Query all published courses not already enrolled
  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      id: enrolledCourseIds.length > 0 ? { notIn: enrolledCourseIds } : undefined,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      priceCredit: true,
      category: true,
      createdAt: true,
      creator: {
        select: { name: true },
      },
      sessions: {
        select: {
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  });

  // 4. Calculate recommendation score for each course
  const recommended: RecommendedCourse[] = courses.map((course) => {
    const score = categoryScores[course.category] || 0;
    const lessonsCount = course.sessions.reduce((acc, s) => acc + s.lessons.length, 0);
    
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      priceCredit: course.priceCredit,
      category: course.category,
      createdAt: course.createdAt,
      creator: course.creator,
      lessonsCount,
      score,
    };
  });

  // 5. Sort by score desc, then by date desc
  recommended.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return recommended;
}
