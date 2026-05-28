import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const noteSchema = z.object({
  timestamp: z.number().min(0),
  content: z.string().min(1),
});

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const notes = await prisma.videoNote.findMany({
    where: { lessonId, userId: session.user.id },
    orderBy: { timestamp: "asc" },
  });

  return NextResponse.json({ notes });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const result = noteSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const note = await prisma.videoNote.create({
    data: { ...result.data, lessonId, userId: session.user.id },
  });

  return NextResponse.json({ note }, { status: 201 });
}
