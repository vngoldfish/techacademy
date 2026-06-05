"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

interface BlogPostData {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  category: string | null;
}

interface EditBlogPostFormProps {
  post: BlogPostData;
}

export default function EditBlogPostForm({ post }: EditBlogPostFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [category, setCategory] = useState(post.category || "");
  const [coverUrl, setCoverUrl] = useState(post.coverUrl || "");
  const [content, setContent] = useState(post.content);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          category,
          coverUrl: coverUrl || undefined,
          content,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật bài viết.");
      }

      toast.success("Cập nhật bài viết thành công!");
      router.push("/blog/my-posts");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/blog/my-posts"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-100 rounded-xl px-3.5 py-2 shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại bài viết của tôi
        </Link>
      </div>

      <Card className="border border-slate-100 shadow-lg rounded-3xl overflow-hidden bg-white/70 backdrop-blur-md">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
            <span>Chỉnh sửa bài viết</span>
          </CardTitle>
          <p className="text-xs text-slate-500 font-semibold mt-1.5">
            Lưu ý: Bài viết của học viên sau khi chỉnh sửa sẽ cần Admin phê duyệt lại trước khi được xuất bản chính thức.
          </p>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold text-slate-700">Tiêu đề bài viết</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
                className="rounded-xl border-slate-200 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt" className="font-semibold text-slate-700">Tóm tắt ngắn gọn</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="rounded-xl border-slate-200 focus:ring-blue-500 text-sm"
                placeholder="Một vài dòng tóm tắt nội dung bài viết hiển thị ở danh sách bài viết..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-semibold text-slate-700">Chuyên mục</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="React, Next.js, AI, Career..."
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverUrl" className="font-semibold text-slate-700">Ảnh bìa URL</Label>
                <Input
                  id="coverUrl"
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="font-semibold text-slate-700">Nội dung bài viết</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                minLength={20}
                rows={12}
                className="rounded-xl border-slate-200 focus:ring-blue-500 font-mono text-sm leading-relaxed"
                placeholder="Viết nội dung bài giảng, chia sẻ kinh nghiệm chi tiết ở đây..."
              />
            </div>

            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 font-bold px-6 py-2.5 cursor-pointer"
              >
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Link href="/blog/my-posts">
                <Button type="button" variant="outline" className="rounded-xl px-6 py-2.5">
                  Hủy bỏ
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
