"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

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
  quiz?: {
    id: string;
    title: string;
    passScore: number;
    duration: number;
    attempts: {
      id: string;
      score: number;
      passed: boolean;
    }[];
  } | null;
  prevLessonId?: string | null;
  nextLessonId?: string | null;
  courseId?: string;
}

function getStatusLabel(props: LessonCompletionPanelProps) {
  if (props.completed) return { label: "Hoàn thành", variant: "default" as const };
  if (props.assignment?.isRequired && props.submission?.status === "PENDING") {
    return { label: "Chờ chấm bài", variant: "secondary" as const };
  }
  if (props.assignment?.isRequired && props.submission?.status === "REJECTED") {
    return { label: "Cần sửa bài", variant: "destructive" as const };
  }
  if (props.quiz && (!props.quiz.attempts[0] || !props.quiz.attempts[0].passed)) {
    return { label: "Chưa hoàn thành trắc nghiệm", variant: "secondary" as const };
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

  async function handleResetProgress() {
    if (!confirm("Bạn có chắc muốn học lại bài này? Thao tác này sẽ đặt lại tiến độ và xóa kết quả bài làm hiện tại.")) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/lessons/${props.lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Không thể học lại bài này");
      } else {
        router.refresh();
      }
    } catch {
      setError("Đã xảy ra lỗi khi reset tiến độ.");
    } finally {
      setLoading(false);
    }
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

        {!props.quiz && !props.assignment && !props.completed && (
          <Button onClick={markComplete} disabled={loading}>
            {loading ? "Đang lưu..." : "Đánh dấu hoàn thành"}
          </Button>
        )}

        {props.quiz && (
          <div className="space-y-3 rounded-lg border p-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Bài tập trắc nghiệm</h3>
                {props.quiz.attempts[0]?.passed ? (
                  <Badge className="bg-green-600">Đã đạt</Badge>
                ) : (
                  <Badge variant="secondary">Chưa đạt</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700 font-medium">{props.quiz.title}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                <span>Điểm đạt: {props.quiz.passScore}%</span>
                {props.quiz.duration > 0 && <span>Thời gian: {props.quiz.duration} phút</span>}
              </div>
            </div>

            {props.quiz.attempts.length > 0 && (
              <div className="rounded-md bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-700">Điểm số gần nhất: <span className={props.quiz.attempts[0].passed ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{props.quiz.attempts[0].score}%</span></p>
                {props.quiz.attempts[0].passed ? (
                  <p className="text-xs text-green-600 mt-1 font-medium">Chúc mừng! Bạn đã vượt qua bài tập trắc nghiệm.</p>
                ) : (
                  <p className="text-xs text-red-500 mt-1 font-medium">Bạn chưa đạt điểm yêu cầu. Hãy thử lại!</p>
                )}
              </div>
            )}

            {props.quiz.attempts[0]?.passed ? (
              <p className="text-sm font-medium text-green-600">Bạn đã vượt qua bài trắc nghiệm.</p>
            ) : (
                <Link href={`/quiz/${props.quiz.id}`} className="w-full block">
                  <Button className="w-full">
                    {props.quiz.attempts.length > 0 ? "Làm lại bài trắc nghiệm" : "Làm bài tập trắc nghiệm"}
                  </Button>
                </Link>
            )}
          </div>
        )}

        {props.assignment && (
          <div className="space-y-4 rounded-2xl border border-slate-100 p-4 bg-slate-50/50 shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">📝 Bài tập tự luận về nhà</h3>
                {props.submission ? (
                  <Badge 
                    className={
                      props.submission.status === "APPROVED" 
                        ? "bg-green-600" 
                        : props.submission.status === "REJECTED" 
                        ? "bg-red-600" 
                        : "bg-amber-500"
                    }
                  >
                    {props.submission.status === "APPROVED" 
                      ? "Đã duyệt" 
                      : props.submission.status === "REJECTED" 
                      ? "Cần sửa lại" 
                      : "Chờ duyệt"}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Chưa nộp</Badge>
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-700">{props.assignment.title}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-500 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100">{props.assignment.description}</p>
            </div>

            {props.submission?.feedback && (
              <div className="rounded-xl bg-blue-50 p-3.5 text-xs text-blue-700 font-medium border border-blue-100">
                <span className="font-bold">Giáo viên phản hồi:</span> {props.submission.feedback}
              </div>
            )}

            {props.submission?.status === "APPROVED" ? (
              <p className="text-sm font-bold text-green-600 text-center py-2">✓ Chúc mừng! Bài làm tự luận của bạn đã được giáo viên thông qua.</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 font-semibold">Bài làm của bạn</Label>
                  <Textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Nhập nội dung câu trả lời tự luận chi tiết của bạn tại đây..."
                    className="rounded-xl border-slate-200 bg-white focus:ring-blue-500 text-sm"
                  />
                </div>
                {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                <Button 
                  onClick={submitAssignment} 
                  disabled={loading || !content.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-md shadow-blue-500/10"
                >
                  {loading ? "Đang gửi bài..." : props.submission ? "Gửi lại bài làm tự luận" : "Nộp bài làm tự luận"}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        {props.completed && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
            {props.prevLessonId && (
              <Link href={`/learn/${props.courseId}/lesson/${props.prevLessonId}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Học lại bài trước
                </Button>
              </Link>
            )}
            <Button onClick={handleResetProgress} variant="secondary" className="flex-1" disabled={loading}>
              Học lại bài hiện tại
            </Button>
            {props.nextLessonId && (
              <Link href={`/learn/${props.courseId}/lesson/${props.nextLessonId}`} className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Bài tiếp theo
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
