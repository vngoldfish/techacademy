import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const resourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url().optional().nullable(),
  content: z.string().optional().nullable(),
  orderIndex: z.number().min(1).default(1),
});

async function requireAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === "ADMIN";
}

export async function GET(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const resources = await prisma.lessonResource.findMany({
    where: { lessonId },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ resources });
}

export async function POST(req: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await params;
  const body = await req.json();
  const result = resourceSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const resource = await prisma.lessonResource.create({
    data: { ...result.data, lessonId },
  });

  return NextResponse.json({ resource }, { status: 201 });
}
