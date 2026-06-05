import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const where = status && ["PENDING", "PUBLISHED", "REJECTED"].includes(status)
    ? { status: status as "PENDING" | "PUBLISHED" | "REJECTED" }
    : {};

  const posts = await prisma.blogPost.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      isPublished: true,
      reviewNote: true,
      createdAt: true,
      publishedAt: true,
      author: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
}
