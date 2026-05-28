"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceCredit, setPriceCredit] = useState("100");
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.course) {
          setTitle(data.course.title);
          setSlug(data.course.slug);
          setDescription(data.course.description ?? "");
          setPriceCredit(String(data.course.priceCredit));
          setIsPublished(data.course.isPublished);
        }
      });
  }, [courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, description, priceCredit: parseInt(priceCredit), isPublished }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Đã xảy ra lỗi");
        setLoading(false);
        return;
      }

      router.push("/admin/courses");
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa khóa học này?")) return;
    await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
    router.push("/admin/courses");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chỉnh sửa khóa học</h1>
        <Badge variant={isPublished ? "default" : "secondary"}>
          {isPublished ? "Đã xuất bản" : "Nháp"}
        </Badge>
      </div>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="title">Tên khóa học</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Giá (credit)</Label>
              <Input id="price" type="number" value={priceCredit} onChange={(e) => setPriceCredit(e.target.value)} min="0" required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="published" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
              <Label htmlFor="published">Xuất bản</Label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : "Lưu thay đổi"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
              <Button type="button" variant="destructive" className="ml-auto" onClick={handleDelete}>Xóa</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
