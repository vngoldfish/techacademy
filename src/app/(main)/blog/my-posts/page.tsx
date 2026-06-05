import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Pencil, Newspaper, Sparkles, Clock, CheckCircle, XCircle } from "lucide-react";
import BlogDeleteButton from "@/components/blog/BlogDeleteButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bài viết của tôi | BawuiAcademy",
  description: "Quản lý danh sách các bài viết blog cá nhân của bạn trên BawuiAcademy.",
};

const statusConfig = {
  PENDING: { label: "Chờ duyệt", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200/50" },
  PUBLISHED: { label: "Đã duyệt", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200/50" },
  REJECTED: { label: "Từ chối", icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200/50" },
  DRAFT: { label: "Nháp", icon: Clock, color: "bg-slate-50 text-slate-600 border-slate-200/50" },
};

export default async function MyBlogPostsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/blog/my-posts");
  }

  const posts = await prisma.blogPost.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      coverUrl: true,
      excerpt: true,
      category: true,
      createdAt: true,
      isPublished: true,
    },
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100/50 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Blog Author Workspace
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 leading-tight">Bài viết của tôi</h1>
          <p className="mt-2 text-sm text-slate-500">
            Quản lý, chỉnh sửa hoặc xóa các bài viết chia sẻ kiến thức của bạn.
          </p>
        </div>
        <Link href="/blog/new">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 rounded-xl px-5 py-2.5 font-semibold text-white">
            Viết bài mới
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const config = statusConfig[post.status] || { label: post.status, icon: Clock, color: "bg-slate-50 text-slate-600" };
          const Icon = config.icon;

          return (
            <Card key={post.id} className="border border-slate-100 hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-blue-50/50 text-blue-600 border border-blue-100/50 font-medium">
                      {post.category || "Bài viết"}
                    </Badge>
                    <Badge className={`${config.color} border font-medium px-2 py-0.5 inline-flex items-center gap-1 shadow-none text-[10px]`}>
                      <Icon className="h-3 w-3" />
                      <span>{config.label}</span>
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-blue-600 transition-colors">
                    {post.isPublished ? (
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    ) : (
                      post.title
                    )}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Tạo ngày: {new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>

                  {post.excerpt && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50/30 p-2.5 rounded-xl border border-slate-100/30">
                      {post.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3.5 md:pt-0 border-slate-50">
                  {post.isPublished && (
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm" className="rounded-lg h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 text-slate-400">
                        <Eye className="h-4.5 w-4.5" />
                      </Button>
                    </Link>
                  )}
                  <Link href={`/blog/edit/${post.id}`}>
                    <Button variant="ghost" size="sm" className="rounded-lg h-9 w-9 p-0 hover:bg-blue-50 hover:text-blue-600 text-slate-400">
                      <Pencil className="h-4.5 w-4.5" />
                    </Button>
                  </Link>
                  <BlogDeleteButton postId={post.id} />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {posts.length === 0 && (
          <Card className="border border-dashed border-slate-200">
            <CardContent className="p-16 text-center text-slate-400">
              <Newspaper className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">Bạn chưa viết bài blog nào.</p>
              <Link href="/blog/new" className="mt-4 inline-block">
                <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600">
                  Bắt đầu viết bài đầu tiên
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
