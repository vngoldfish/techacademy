"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

export default function GradeSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;
  const [submission, setSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/submissions/${submissionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.submission) {
          setSubmission(data.submission);
          setFeedback(data.submission.feedback ?? "");
        }
      });
  }, [submissionId]);

  async function handleGrade(status: "APPROVED" | "REJECTED") {
    setLoading(true);
    await fetch(`/api/admin/submissions/${submissionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, feedback }),
    });
    setLoading(false);
    router.push("/admin/submissions");
  }

  if (!submission) return <p className="p-6">Đang tải...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Chấm bài</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Bài tập</p>
            <p className="font-medium">{submission.assignment?.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Học viên</p>
            <p className="font-medium">{submission.user?.name ?? submission.user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Bài nộp</p>
            <div className="mt-1 rounded-lg border p-4 bg-gray-50 whitespace-pre-wrap">
              {submission.content}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="feedback">Phản hồi cho học viên</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder="Nhận xét về bài làm..."
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => handleGrade("APPROVED")} disabled={loading} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" /> Đạt
            </Button>
            <Button onClick={() => handleGrade("REJECTED")} disabled={loading} variant="destructive">
              <XCircle className="mr-2 h-4 w-4" /> Chưa đạt
            </Button>
            <Button variant="outline" onClick={() => router.back()}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
