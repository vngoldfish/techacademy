import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

export default async function LessonRedirectPage({ params }: PageProps) {
  const { slug, lessonId } = await params;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!course) notFound();

  redirect(`/learn/${course.id}/lesson/${lessonId}`);
}
