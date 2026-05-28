import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function LearnPage({ params }: PageProps) {
  const { courseId } = await params;

  const firstLesson = await prisma.lesson.findFirst({
    where: { session: { courseId } },
    orderBy: [{ session: { orderIndex: "asc" } }, { orderIndex: "asc" }],
    select: { id: true },
  });

  if (firstLesson) {
    redirect(`/learn/${courseId}/lesson/${firstLesson.id}`);
  }

  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-gray-500">Khóa học chưa có bài học nào.</p>
    </div>
  );
}
