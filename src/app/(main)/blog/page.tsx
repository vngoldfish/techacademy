import Link from "next/link";
import { Calendar, Tag } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog chia sẻ kiến thức & EdTech | BawuiAcademy",
  description: "Xem các bài viết hướng dẫn thực tế về công nghệ, EdTech, lập trình, thiết kế UI/UX, AI và các kỹ năng nghề nghiệp thực tế từ các chuyên gia tại BawuiAcademy.",
  openGraph: {
    title: "Blog chia sẻ kiến thức & EdTech | BawuiAcademy",
    description: "Xem các bài viết hướng dẫn thực tế về công nghệ, EdTech, lập trình, thiết kế UI/UX, AI và các kỹ năng nghề nghiệp thực tế từ các chuyên gia tại BawuiAcademy.",
    type: "website",
  },
};

export default async function BlogPage() {
  const session = await auth();
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true, status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      category: true,
      excerpt: true,
      publishedAt: true,
      author: { select: { name: true } },
    },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge variant="secondary">BawuiAcademy Blog</Badge>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">Blog chia sẻ kiến thức & EdTech</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Bài viết chia sẻ kiến thức về kỹ năng số, phát triển bản thân, công nghệ và hệ thống học tập thực chiến.
          </p>
        </div>
        {session?.user && (
          <Link href="/blog/new" className="inline-flex h-8 items-center rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700">
            Viết bài
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-gray-500">
          Chưa có bài viết nào được xuất bản.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.slug} className="flex flex-col">
              <CardHeader>
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                  {post.category && (
                    <>
                      <Tag className="h-3 w-3" />
                      <span>{post.category}</span>
                    </>
                  )}
                  <Calendar className="ml-2 h-3 w-3" />
                  <span>{post.publishedAt?.toLocaleDateString("vi-VN")}</span>
                </div>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <p className="flex-1 text-sm text-gray-600">{post.excerpt}</p>
                <p className="mt-4 text-xs text-gray-400">{post.author?.name ?? "BawuiAcademy"}</p>
                <a href={`/blog/${post.slug}`} className="mt-5">
                  <Button variant="outline" className="w-full">Đọc bài viết</Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
