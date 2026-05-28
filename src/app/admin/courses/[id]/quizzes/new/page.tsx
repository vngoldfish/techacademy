"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewQuizPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quizType, setQuizType] = useState("MIDTERM");
  const [passScore, setPassScore] = useState("60");
  const [questionsJson, setQuestionsJson] = useState(`[
  {
    "text": "React là gì?",
    "options": [
      { "label": "A", "text": "Ngôn ngữ lập trình" },
      { "label": "B", "text": "Thư viện JavaScript để xây dựng UI" },
      { "label": "C", "text": "Database" },
      { "label": "D", "text": "Package manager" }
    ],
    "correctAnswer": "B"
  }
]`);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const questions = JSON.parse(questionsJson);
      const res = await fetch(`/api/admin/courses/${courseId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, quizType, passScore: Number(passScore), questions }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Không thể tạo bài kiểm tra");
        setLoading(false);
        return;
      }
      router.push(`/admin/courses/${courseId}`);
    } catch {
      setError("JSON câu hỏi không hợp lệ");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Tạo bài kiểm tra</h1>
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Loại bài kiểm tra</Label>
                <Select value={quizType} onValueChange={(value) => setQuizType(value ?? "MIDTERM")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MIDTERM">Giữa khóa</SelectItem>
                    <SelectItem value="FINAL">Cuối khóa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Điểm đạt (%)</Label>
                <Input type="number" value={passScore} onChange={(e) => setPassScore(e.target.value)} min="0" max="100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Câu hỏi (JSON)</Label>
              <Textarea value={questionsJson} onChange={(e) => setQuestionsJson(e.target.value)} rows={16} className="font-mono text-xs" />
              <p className="text-xs text-gray-500">MVP dùng JSON để tạo nhanh câu hỏi trắc nghiệm A/B/C/D.</p>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo bài kiểm tra"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
