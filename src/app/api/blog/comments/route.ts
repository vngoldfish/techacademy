import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, "Nội dung bình luận không được để trống"),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để thực hiện" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { postId, content, rating, parentId } = result.data;

    // Check if blog post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      select: { id: true, slug: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
    }

    // If parentId is provided, check if parent comment exists and belongs to the same post
    if (parentId) {
      const parentComment = await prisma.blogComment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment) {
        return NextResponse.json({ error: "Bình luận cha không tồn tại" }, { status: 400 });
      }

      if (parentComment.postId !== postId) {
        return NextResponse.json({ error: "Bình luận phản hồi phải thuộc cùng bài viết" }, { status: 400 });
      }
    }

    // Create the comment
    const comment = await prisma.blogComment.create({
      data: {
        postId,
        userId: session.user.id,
        content,
        rating: parentId ? null : rating || null, // Rating only allowed on parent comments, not replies
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    // Revalidate details page so the new comment displays
    revalidatePath(`/blog/${post.slug}`);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog comment:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi hệ thống" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để thực hiện" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Thiếu ID bình luận" }, { status: 400 });
  }

  try {
    const comment = await prisma.blogComment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        postId: true,
        post: { select: { slug: true } },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Bình luận không tồn tại" }, { status: 404 });
    }

    const isAdmin = session.user.role === "ADMIN";
    const isOwner = comment.userId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Bạn không có quyền xóa bình luận này" }, { status: 403 });
    }

    await prisma.blogComment.delete({
      where: { id },
    });

    revalidatePath(`/blog/${comment.post.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi hệ thống" }, { status: 500 });
  }
}
