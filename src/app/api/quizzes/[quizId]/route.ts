import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true, title: true, description: true, quizType: true, passScore: true, duration: true, lessonId: true,
      questions: { orderBy: { orderIndex: "asc" }, select: { id: true, text: true, options: true } },
      attempts: { where: { userId: session.user.id }, orderBy: { startedAt: "desc" }, take: 5 },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quiz });
}
