"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface LessonCompletionPanelProps {
  lessonId: string;
  videoCompleted: boolean;
  completed: boolean;
  assignment: {
    id: string;
    title: string;
    description: string;
    isRequired: boolean;
  } | null;
  submission: {
    id: string;
    content: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    feedback: string | null;
  } | null;
}

function getStatusLabel(props: LessonCompletionPanelProps) {
  if (props.completed) return { label: "Hoàn thành", variant: "default" as const };
  if (props.assignment?.isRequired && props.submission?.status === "PENDING") {
    return { label: "Chờ chấm bài", variant: "secondary" as const };
  }
  if (props.assignment?.isRequired && props.submission?.status === "REJECTED") {
    return { label: "Cần sửa bài", variant: "destructive" as const };
  }
  if (props.videoCompleted) return { label: "Đã xem video", variant: "secondary" as const };
  return { label: "Đang học", variant: "secondary" as const };
}

export function LessonCompletionPanel(props: LessonCompletionPanelProps) {
  const router = useRouter();
  const [content, setContent] = useState(props.submission?.content ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const status = getStatusLabel(props);

  async function markComplete() {
    setLoading(true);
    await fetch(`/api/lessons/${props.lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoCompleted: true, completed: true }),
    });
    setLoading(false);
    router.refresh();
  }

  async function submitAssignment() {
    if (!props.assignment) return;
    setError("");
    setLoading(true);

    const res = await fetch(`/api/assignments/${props.assignment.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Không thể nộp bài");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Trạng thái học tập</CardTitle>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
          <p>Video: {props.videoCompleted ? "Đã xem" : "Chưa hoàn thành"}</p>
          <p>Bài học: {props.completed ? "Hoàn thành" : "Chưa hoàn thành"}</p>
        </div>

        {!props.assignment && !props.completed && (
          <Button onClick={markComplete} disabled={loading}>
            {loading ? "Đang lưu..." : "Đánh dấu hoàn thành"}
          </Button>
        )}

        {props.assignment && (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <h3 className="font-medium text-gray-900">{props.assignment.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{props.assignment.description}</p>
            </div>

            {props.submission?.feedback && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                Phản hồi: {props.submission.feedback}
              </div>
            )}

            {props.submission?.status === "APPROVED" ? (
              <p className="text-sm font-medium text-green-600">Bài tập đã được duyệt.</p>
            ) : (
              <div className="space-y-2">
                <Textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập bài làm, link GitHub, hoặc mô tả kết quả thực hành..."
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button onClick={submitAssignment} disabled={loading || !content.trim()}>
                  {loading ? "Đang nộp..." : props.submission ? "Nộp lại bài" : "Nộp bài"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
