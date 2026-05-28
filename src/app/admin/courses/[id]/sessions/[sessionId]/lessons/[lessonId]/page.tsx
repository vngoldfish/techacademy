"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminLessonEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const sessionId = params.sessionId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/lessons/${lessonId}`).then((res) => res.json()),
      fetch(`/api/admin/lessons/${lessonId}/assignment`).then((res) => res.json()),
      fetch(`/api/admin/lessons/${lessonId}/resources`).then((res) => res.json()),
    ]).then(([lessonData, assignmentData, resourceData]) => {
      setLesson(lessonData.lesson);
      setAssignment(assignmentData.assignment ?? { title: "", description: "", isRequired: true });
      setResources(resourceData.resources ?? []);
    });
  }, [lessonId]);

  async function saveLesson() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lesson),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Không thể lưu bài học");
    }
    setSaving(false);
  }

  async function saveAssignment() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/lessons/${lessonId}/assignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignment),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Không thể lưu bài tập");
    }
    setSaving(false);
  }

  async function addResource() {
    setSaving(true);
    const res = await fetch(`/api/admin/lessons/${lessonId}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Tài liệu mới",
        content: "Nội dung hướng dẫn...",
        orderIndex: resources.length + 1,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setResources((prev) => [...prev, data.resource]);
    }
    setSaving(false);
  }

  if (!lesson) return <p>Đang tải...</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý bài học</h1>
          <p className="text-sm text-gray-500">Video, tài liệu, bài tập thực hành</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/admin/courses/${courseId}/sessions/${sessionId}/lessons`)}>
          Quay lại
        </Button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <Tabs defaultValue="video">
        <TabsList>
          <TabsTrigger value="video">Video bài giảng</TabsTrigger>
          <TabsTrigger value="resources">Tài liệu hướng dẫn</TabsTrigger>
          <TabsTrigger value="assignment">Bài tập thực hành</TabsTrigger>
        </TabsList>

        <TabsContent value="video">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên bài học</Label>
                <Input value={lesson.title ?? ""} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Video URL</Label>
                <Input value={lesson.videoUrl ?? ""} onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value })} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Loại video</Label>
                  <Select value={lesson.videoType} onValueChange={(value) => setLesson({ ...lesson, videoType: value ?? "YOUTUBE" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YOUTUBE">YouTube</SelectItem>
                      <SelectItem value="VIMEO">Vimeo</SelectItem>
                      <SelectItem value="S3">S3/MP4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thời lượng (giây)</Label>
                  <Input type="number" value={lesson.duration ?? ""} onChange={(e) => setLesson({ ...lesson, duration: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div className="space-y-2">
                  <Label>Thứ tự</Label>
                  <Input type="number" value={lesson.orderIndex} onChange={(e) => setLesson({ ...lesson, orderIndex: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả / nội dung bài học</Label>
                <Textarea rows={5} value={lesson.description ?? ""} onChange={(e) => setLesson({ ...lesson, description: e.target.value })} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={lesson.isFree} onChange={(e) => setLesson({ ...lesson, isFree: e.target.checked })} />
                  Bài học miễn phí
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={lesson.isGated} onChange={(e) => setLesson({ ...lesson, isGated: e.target.checked })} />
                  Khóa theo tiến độ
                </label>
              </div>
              <Button onClick={saveLesson} disabled={saving}>{saving ? "Đang lưu..." : "Lưu video bài học"}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Tài liệu / bài viết hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.length === 0 ? (
                <p className="text-sm text-gray-500">Chưa có tài liệu nào.</p>
              ) : (
                resources.map((resource) => (
                  <div key={resource.id} className="rounded-lg border p-4">
                    <p className="font-medium">{resource.title}</p>
                    {resource.url && <a className="text-sm text-blue-600" href={resource.url}>{resource.url}</a>}
                    {resource.content && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{resource.content}</p>}
                  </div>
                ))
              )}
              <Button variant="outline" onClick={addResource} disabled={saving}>Thêm tài liệu mẫu</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment">
          <Card>
            <CardHeader>
              <CardTitle>Bài tập thực hành / bài tập về nhà</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tiêu đề bài tập</Label>
                <Input value={assignment?.title ?? ""} onChange={(e) => setAssignment({ ...assignment, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Mô tả yêu cầu</Label>
                <Textarea rows={8} value={assignment?.description ?? ""} onChange={(e) => setAssignment({ ...assignment, description: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={assignment?.isRequired ?? true} onChange={(e) => setAssignment({ ...assignment, isRequired: e.target.checked })} />
                Bắt buộc hoàn thành để qua bài tiếp theo
              </label>
              <Button onClick={saveAssignment} disabled={saving}>{saving ? "Đang lưu..." : "Lưu bài tập"}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
