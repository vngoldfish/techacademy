import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const updateBlogPostSchema = z.object({
  title: z.string().min(3),
  excerpt: z.string().optional(),
  content: z.string().min(20),
  coverUrl: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, authorId: true, slug: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = post.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Bạn không có quyền chỉnh sửa bài viết này" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = updateBlogPostSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    // Role-based publish rules
    const canPublish = session.user.role === "AUTHOR" || session.user.role === "ADMIN";
    const status = canPublish ? "PUBLISHED" : "PENDING";
    const isPublished = canPublish;

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: {
        ...result.data,
        coverUrl: result.data.coverUrl || null,
        status,
        isPublished,
        publishedAt: canPublish ? new Date() : null,
      },
    });

    revalidatePath(`/blog/${post.slug}`);
    revalidatePath(`/blog/${updatedPost.slug}`);
    revalidatePath("/blog");

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi hệ thống" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { id: true, authorId: true, slug: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = post.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Bạn không có quyền xóa bài viết này" }, { status: 403 });
  }

  try {
    await prisma.blogPost.delete({ where: { id } });

    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/blog");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi hệ thống" }, { status: 500 });
  }
}
