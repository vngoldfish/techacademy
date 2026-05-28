import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const assignmentSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được trống"),
  description: z.string().min(1, "Mô tả không được trống"),
  isRequired: z.boolean().default(true),
});

async function requireAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === "ADMIN";
}

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const assignment = await prisma.assignment.findUnique({ where: { lessonId } });

  return NextResponse.json({ assignment });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const result = assignmentSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const assignment = await prisma.assignment.upsert({
    where: { lessonId },
    update: result.data,
    create: { ...result.data, lessonId },
  });

  return NextResponse.json({ assignment });
}
