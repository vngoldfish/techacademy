import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, FileText, User, Calendar, MessageSquare, Newspaper } from "lucide-react";

async function moderatePost(formData: FormData) {
  "use server";

  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const id = String(formData.get("id"));
  const action = String(formData.get("action"));
  const reviewNote = String(formData.get("reviewNote") ?? "");
  const approved = action === "approve";

  await prisma.blogPost.update({
    where: { id },
    data: {
      status: approved ? "PUBLISHED" : "REJECTED",
      isPublished: approved,
      publishedAt: approved ? new Date() : null,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      reviewNote,
    },
  });

  revalidatePath("/admin/blog-posts");
  revalidatePath("/blog");
}

const statusConfig = {
  PENDING: { label: "Chờ duyệt", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200/50", leftBorder: "border-l-amber-500" },
  PUBLISHED: { label: "Đã duyệt", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200/50", leftBorder: "border-l-emerald-500" },
  REJECTED: { label: "Từ chối", icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200/50", leftBorder: "border-l-rose-500" },
  DRAFT: { label: "Nháp", icon: Clock, color: "bg-slate-50 text-slate-600 border-slate-200/50", leftBorder: "border-l-slate-400" },
};

export default async function AdminBlogPostsPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: { in: ["PENDING", "PUBLISHED", "REJECTED"] } },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      excerpt: true,
      reviewNote: true,
      createdAt: true,
      category: true,
      author: { select: { name: true, email: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Duyệt bài viết</h1>
        <p className="text-sm text-slate-500">Phê duyệt hoặc phản hồi yêu cầu xuất bản bài viết blog từ tác giả.</p>
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const config = statusConfig[post.status] || { label: post.status, icon: Clock, color: "bg-slate-50 text-slate-600", leftBorder: "border-l-slate-400" };
          const Icon = config.icon;
          return (
            <Card key={post.id} className={`border border-slate-100 shadow-sm border-l-4 ${config.leftBorder} hover:shadow-md transition-shadow overflow-hidden`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {post.category || "Bài viết"}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {post.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        <span>Tác giả: <span className="font-semibold text-slate-700">{post.author?.name ?? "Không rõ"}</span> ({post.author?.email})</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Gửi lúc: {new Date(post.createdAt).toLocaleDateString("vi-VN")}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between lg:justify-start items-center shrink-0">
                    <Badge className={`${config.color} border font-medium px-2.5 py-0.5 inline-flex items-center gap-1 shadow-none`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span>{config.label}</span>
                    </Badge>
                  </div>
                </div>

                {post.excerpt && (
                  <p className="text-sm leading-relaxed text-slate-500 bg-slate-50/50 p-3 rounded-xl border border-slate-100/70">
                    {post.excerpt}
                  </p>
                )}

                {post.reviewNote && (
                  <div className="text-xs font-medium text-rose-700 bg-rose-50/40 p-2.5 rounded-lg border border-rose-100/50 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-rose-500" />
                    <span>Ghi chú xét duyệt: {post.reviewNote}</span>
                  </div>
                )}

                {post.status === "PENDING" && (
                  <form action={moderatePost} className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
                    <input type="hidden" name="id" value={post.id} />
                    <input
                      name="reviewNote"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="Nhập ghi chú phản hồi cho tác giả..."
                    />
                    <div className="flex gap-2">
                      <Button name="action" value="approve" type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium px-4 py-2">
                        Duyệt bài
                      </Button>
                      <Button name="action" value="reject" type="submit" variant="outline" className="border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-lg font-medium px-4 py-2">
                        Từ chối
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          );
        })}
        {posts.length === 0 && (
          <Card className="border border-dashed border-slate-200">
            <CardContent className="p-16 text-center text-slate-400">
              <Newspaper className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p>Chưa có bài viết blog nào cần phê duyệt.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
