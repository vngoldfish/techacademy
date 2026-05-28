import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const lessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  videoUrl: z.string().url(),
  videoType: z.enum(["YOUTUBE", "VIMEO", "S3"]),
  duration: z.number().nullable().optional(),
  orderIndex: z.number().min(1),
  isFree: z.boolean().optional(),
  isGated: z.boolean().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await req.json();
  const result = lessonSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const lesson = await prisma.lesson.create({
    data: {
      ...result.data,
      description: result.data.description ?? null,
      duration: result.data.duration ?? null,
      isFree: result.data.isFree ?? false,
      isGated: result.data.isGated ?? false,
      sessionId,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
