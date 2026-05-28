"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export default function NewSessionPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orderIndex, setOrderIndex] = useState("1");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/courses/${courseId}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, orderIndex: parseInt(orderIndex) }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Đã xảy ra lỗi");
        setLoading(false);
        return;
      }

      router.push(`/admin/courses/${courseId}/sessions`);
    } catch {
      setError("Đã xảy ra lỗi.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm buổi học</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="title">Tên buổi học</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Buổi 1 - Giới thiệu React" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Thứ tự</Label>
              <Input id="order" type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} min="1" required />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo buổi học"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
