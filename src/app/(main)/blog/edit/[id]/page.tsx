import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import EditBlogPostForm from "@/components/blog/EditBlogPostForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chỉnh sửa bài viết | BawuiAcademy",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/blog/edit/${id}`);
  }

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      excerpt: true,
      content: true,
      coverUrl: true,
      category: true,
      authorId: true,
    },
  });

  if (!post) {
    notFound();
  }

  const isAdmin = session.user.role === "ADMIN";
  const isAuthor = post.authorId === session.user.id;

  if (!isAdmin && !isAuthor) {
    redirect("/blog/my-posts");
  }

  return <EditBlogPostForm post={post} />;
}
