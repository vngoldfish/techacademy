"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        excerpt: formData.get("excerpt"),
        category: formData.get("category"),
        coverUrl: formData.get("coverUrl"),
        content: formData.get("content"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Không thể gửi bài viết.");
      return;
    }

    router.push(data.post.isPublished ? `/blog/${data.post.slug}` : "/blog");
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Viết bài mới</CardTitle>
          <p className="text-sm text-gray-600">
            Bài viết của học viên sẽ chờ admin duyệt trước khi xuất bản.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input id="title" name="title" required minLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Tóm tắt</Label>
              <Textarea id="excerpt" name="excerpt" rows={3} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Chuyên mục</Label>
                <Input id="category" name="category" placeholder="React, Next.js..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverUrl">Ảnh bìa URL</Label>
                <Input id="coverUrl" name="coverUrl" type="url" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Nội dung</Label>
              <Textarea id="content" name="content" required minLength={20} rows={12} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? "Đang gửi..." : "Gửi bài viết"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
