import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Tag, Star } from "lucide-react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import BlogCommentsSection from "@/components/blog/BlogCommentsSection";
import BlogDeleteButton from "@/components/blog/BlogDeleteButton";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, isPublished: true, status: "PUBLISHED" },
    select: {
      title: true,
      excerpt: true,
      coverUrl: true,
    },
  });

  if (!post) {
    return {
      title: "Bài viết không tồn tại | BawuiAcademy",
    };
  }

  const title = `${post.title} | Blog BawuiAcademy`;
  const description = post.excerpt || "Đọc bài viết chia sẻ công nghệ hữu ích tại BawuiAcademy.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: post.coverUrl ? [{ url: post.coverUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverUrl ? [post.coverUrl] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();

  const post = await prisma.blogPost.findFirst({
    where: { slug, isPublished: true, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      category: true,
      content: true,
      coverUrl: true,
      publishedAt: true,
      updatedAt: true,
      excerpt: true,
      authorId: true,
      author: { select: { name: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          postId: true,
          userId: true,
          content: true,
          rating: true,
          parentId: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              avatarUrl: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!post) notFound();

  // Compute average rating from comments
  const ratedComments = post.comments.filter((c) => c.rating !== null && c.rating !== undefined);
  const averageRating = ratedComments.length > 0
    ? Number((ratedComments.reduce((acc, c) => acc + (c.rating || 0), 0) / ratedComments.length).toFixed(1))
    : null;

  // JSON-LD structured data for Google Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "image": post.coverUrl ? [post.coverUrl] : [],
    "datePublished": post.publishedAt?.toISOString(),
    "dateModified": post.updatedAt?.toISOString(),
    "author": {
      "@type": "Person",
      "name": post.author?.name || "BawuiAcademy Team",
    },
    "publisher": {
      "@type": "Organization",
      "name": "BawuiAcademy",
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/favicon.ico`,
      },
    },
    "description": post.excerpt || "",
    "articleBody": post.content,
  };

  const currentUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? "",
        role: session.user.role,
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="container mx-auto max-w-3xl px-4 py-10">
        <Link href="/blog" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          ← Quay lại Blog
        </Link>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {post.category && <Badge>{post.category}</Badge>}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {post.publishedAt?.toLocaleDateString("vi-VN")}
            </span>
            <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> {post.author?.name ?? "BawuiAcademy"}</span>
            {averageRating !== null && (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100/50 px-2 py-0.5 rounded text-xs font-bold">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {averageRating} / 5.0 ({ratedComments.length} đánh giá)
              </span>
            )}
          </div>

          {currentUser && (currentUser.id === post.authorId || currentUser.role === "ADMIN") && (
            <div className="flex items-center gap-2">
              <Link href={`/blog/edit/${post.id}`}>
                <Button variant="outline" size="sm" className="rounded-lg text-slate-600 border-slate-200">
                  Chỉnh sửa
                </Button>
              </Link>
              <BlogDeleteButton postId={post.id} />
            </div>
          )}
        </div>
        <h1 className="mt-4 text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>
        <Separator className="my-8" />
        <div className="whitespace-pre-line text-lg leading-8 text-gray-700">{post.content}</div>

        <Separator className="my-10" />

        {/* Dynamic Comments & Ratings Section */}
        <BlogCommentsSection
          postId={post.id}
          initialComments={post.comments}
          currentUser={currentUser}
        />
      </article>
    </>
  );
}
