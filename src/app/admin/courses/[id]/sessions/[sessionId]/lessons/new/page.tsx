"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewLessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const sessionId = params.sessionId as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState("YOUTUBE");
  const [duration, setDuration] = useState("");
  const [orderIndex, setOrderIndex] = useState("1");
  const [isFree, setIsFree] = useState(false);
  const [isGated, setIsGated] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, videoUrl, videoType,
          duration: duration ? parseInt(duration) : null,
          orderIndex: parseInt(orderIndex), isFree, isGated,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Đã xảy ra lỗi");
        setLoading(false);
        return;
      }

      router.push(`/admin/courses/${courseId}/sessions/${sessionId}/lessons`);
    } catch {
      setError("Đã xảy ra lỗi.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Thêm bài học</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="title">Tên bài học</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại video</Label>
                <Select value={videoType} onValueChange={(val) => setVideoType(val ?? "YOUTUBE")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YOUTUBE">YouTube</SelectItem>
                    <SelectItem value="VIMEO">Vimeo</SelectItem>
                    <SelectItem value="S3">S3/Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Thời lượng (giây)</Label>
                <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Thứ tự</Label>
              <Input id="order" type="number" value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} min="1" required />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                <span className="text-sm">Miễn phí (demo)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={isGated} onChange={(e) => setIsGated(e.target.checked)} />
                <span className="text-sm">Gated (phải hoàn thành bài trước)</span>
              </label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo bài học"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
