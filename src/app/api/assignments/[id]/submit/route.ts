import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { completeLessonIfEligible } from "@/lib/learning";
import { z } from "zod";

const submitSchema = z.object({
  content: z.string().min(1, "Nội dung bài nộp không được trống"),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: assignmentId } = await params;
  const body = await req.json();
  const result = submitSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { lessonId: true },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_userId: { assignmentId, userId: session.user.id } },
    update: {
      content: result.data.content,
      status: "PENDING",
      feedback: null,
      submittedAt: new Date(),
      reviewedAt: null,
    },
    create: {
      assignmentId,
      userId: session.user.id,
      content: result.data.content,
      status: "PENDING",
    },
  });

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId: assignment.lessonId } },
    create: { userId: session.user.id, lessonId: assignment.lessonId, assignmentDone: false },
    update: { assignmentDone: false, completed: false, completedAt: null },
  });

  await completeLessonIfEligible(session.user.id, assignment.lessonId);

  return NextResponse.json({ submission });
}
