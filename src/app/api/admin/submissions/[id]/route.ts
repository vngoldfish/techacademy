import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const gradeSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  feedback: z.string().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id },
    select: {
      id: true, content: true, status: true, feedback: true, submittedAt: true,
      user: { select: { name: true, email: true } },
      assignment: { select: { title: true } },
    },
  });

  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ submission });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = gradeSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

  const submission = await prisma.assignmentSubmission.update({
    where: { id },
    data: { status: result.data.status, feedback: result.data.feedback ?? null, reviewedAt: new Date() },
  });

  return NextResponse.json({ submission });
}
