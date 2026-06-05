import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const moderationSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = moderationSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { id } = await params;
  const approved = result.data.action === "approve";
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      status: approved ? "PUBLISHED" : "REJECTED",
      isPublished: approved,
      publishedAt: approved ? new Date() : null,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      reviewNote: result.data.reviewNote,
    },
  });

  return NextResponse.json({ post });
}
