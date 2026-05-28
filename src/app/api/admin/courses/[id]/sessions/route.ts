import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const sessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  orderIndex: z.number().min(1),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: courseId } = await params;
  const body = await req.json();
  const result = sessionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const newSession = await prisma.session.create({
    data: { ...result.data, description: result.data.description ?? null, courseId },
  });

  return NextResponse.json({ session: newSession }, { status: 201 });
}
