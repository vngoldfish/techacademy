import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const progressSchema = z.object({
  lastPosition: z.number().min(0).optional(),
  videoCompleted: z.boolean().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const progress = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
  });

  return NextResponse.json({ progress });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const result = progressSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.user.id, lessonId } },
    create: {
      userId: session.user.id,
      lessonId,
      lastPosition: result.data.lastPosition ?? 0,
      videoCompleted: result.data.videoCompleted ?? false,
      completed: result.data.videoCompleted ?? false,
      completedAt: result.data.videoCompleted ? new Date() : null,
    },
    update: {
      lastPosition: result.data.lastPosition ?? undefined,
      videoCompleted: result.data.videoCompleted ?? undefined,
      completed: result.data.videoCompleted ?? undefined,
      completedAt: result.data.videoCompleted ? new Date() : undefined,
    },
  });

  return NextResponse.json({ progress });
}
