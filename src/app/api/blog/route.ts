import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createBlogPostSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(20),
  coverUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = createBlogPostSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const canPublish = session.user.role === "AUTHOR" || session.user.role === "ADMIN";
  const status = canPublish ? "PUBLISHED" : "PENDING";
  const baseSlug = slugify(result.data.title) || `post-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const post = await prisma.blogPost.create({
    data: {
      ...result.data,
      coverUrl: result.data.coverUrl || null,
      slug,
      status,
      isPublished: canPublish,
      publishedAt: canPublish ? new Date() : null,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
