"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuestionItem {
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
}

export default function NewQuizPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quizType, setQuizType] = useState("MIDTERM");
  const [passScore, setPassScore] = useState("60");
  const [duration, setDuration] = useState("0");
  
  const [mode, setMode] = useState<"MANUAL" | "JSON">("MANUAL");

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

  const [manualQuestions, setManualQuestions] = useState<QuestionItem[]>([
    {
      text: "React là gì?",
      options: [
        { label: "A", text: "Ngôn ngữ lập trình" },
        { label: "B", text: "Thư viện JavaScript để xây dựng UI" },
        { label: "C", text: "Database" },
        { label: "D", text: "Package manager" }
      ],
      correctAnswer: "B"
    }
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSwitchToJson = () => {
    setQuestionsJson(JSON.stringify(manualQuestions, null, 2));
    setMode("JSON");
    setError("");
  };

  const handleSwitchToManual = () => {
    try {
      const parsed = JSON.parse(questionsJson);
      if (Array.isArray(parsed)) {
        const formatted = parsed.map((q: any) => {
          const options = Array.isArray(q.options) ? q.options : [];
          const optA = options.find((o: any) => o.label === "A")?.text || options[0]?.text || "";
          const optB = options.find((o: any) => o.label === "B")?.text || options[1]?.text || "";
          const optC = options.find((o: any) => o.label === "C")?.text || options[2]?.text || "";
          const optD = options.find((o: any) => o.label === "D")?.text || options[3]?.text || "";
          return {
            text: q.text || "",
            options: [
              { label: "A", text: optA },
              { label: "B", text: optB },
              { label: "C", text: optC },
              { label: "D", text: optD },
            ],
            correctAnswer: q.correctAnswer || "A",
          };
        });
        setManualQuestions(formatted);
      }
      setError("");
      setMode("MANUAL");
    } catch {
      setError("Không thể chuyển sang chế độ thủ công vì JSON câu hỏi không hợp lệ.");
    }
  };

  const handleAddQuestion = () => {
    setManualQuestions([
      ...manualQuestions,
      {
        text: "",
        options: [
          { label: "A", text: "" },
          { label: "B", text: "" },
          { label: "C", text: "" },
          { label: "D", text: "" },
        ],
        correctAnswer: "A",
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setManualQuestions(manualQuestions.filter((_, idx) => idx !== index));
  };

  const handleQuestionTextChange = (index: number, text: string) => {
    const updated = [...manualQuestions];
    updated[index].text = text;
    setManualQuestions(updated);
  };

  const handleOptionTextChange = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...manualQuestions];
    updated[qIndex].options[oIndex].text = text;
    setManualQuestions(updated);
  };

  const handleCorrectAnswerChange = (index: number, val: string) => {
    const updated = [...manualQuestions];
    updated[index].correctAnswer = val;
    setManualQuestions(updated);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let questions: QuestionItem[] = [];
      if (mode === "JSON") {
        questions = JSON.parse(questionsJson);
        if (!Array.isArray(questions) || questions.length === 0) {
          throw new Error("Danh sách câu hỏi JSON phải là một mảng không rỗng");
        }
      } else {
        questions = manualQuestions;
        if (questions.length === 0) {
          throw new Error("Cần thêm ít nhất 1 câu hỏi");
        }
        for (const q of questions) {
          if (!q.text.trim()) {
            throw new Error("Tất cả tiêu đề câu hỏi không được để trống");
          }
          if (q.options.some((opt) => !opt.text.trim())) {
            throw new Error("Tất cả các lựa chọn câu hỏi không được để trống");
          }
        }
      }

      const res = await fetch(`/api/admin/courses/${courseId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          quizType,
          passScore: Number(passScore),
          duration: Number(duration),
          questions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Không thể tạo bài kiểm tra");
        setLoading(false);
        return;
      }
      router.push(`/admin/courses/${courseId}`);
    } catch (err: any) {
      setError(err?.message ?? "JSON câu hỏi không hợp lệ");
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
            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <Label>Thời gian làm bài (phút, 0 = không giới hạn)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="0" />
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="pt-4">
              <div className="flex border-b mb-4">
                <button
                  type="button"
                  onClick={handleSwitchToManual}
                  className={`px-4 py-2 font-medium text-sm border-b-2 -mb-[2px] transition-colors ${
                    mode === "MANUAL"
                      ? "border-blue-600 text-blue-600 font-semibold"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Nhập thủ công
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToJson}
                  className={`px-4 py-2 font-medium text-sm border-b-2 -mb-[2px] transition-colors ${
                    mode === "JSON"
                      ? "border-blue-600 text-blue-600 font-semibold"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Nhập JSON
                </button>
              </div>

              {mode === "JSON" ? (
                <div className="space-y-2">
                  <Label>Câu hỏi (JSON)</Label>
                  <Textarea value={questionsJson} onChange={(e) => setQuestionsJson(e.target.value)} rows={16} className="font-mono text-xs" />
                  <p className="text-xs text-gray-500">Dùng JSON để tạo nhanh câu hỏi trắc nghiệm A/B/C/D.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {manualQuestions.map((q, qIndex) => (
                    <Card key={qIndex} className="relative border border-gray-200">
                      <CardHeader className="flex flex-row items-center justify-between py-3 bg-gray-50">
                        <CardTitle className="text-sm font-semibold">Câu hỏi {qIndex + 1}</CardTitle>
                        {manualQuestions.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveQuestion(qIndex)}
                          >
                            Xóa
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Nội dung câu hỏi</Label>
                          <Textarea
                            value={q.text}
                            onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                            placeholder="Nhập câu hỏi..."
                            required
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          {q.options.map((opt, oIndex) => (
                            <div key={opt.label} className="space-y-1">
                              <Label>Lựa chọn {opt.label}</Label>
                              <Input
                                value={opt.text}
                                onChange={(e) => handleOptionTextChange(qIndex, oIndex, e.target.value)}
                                placeholder={`Nội dung lựa chọn ${opt.label}...`}
                                required
                              />
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2 w-1/3">
                          <Label>Đáp án đúng</Label>
                          <Select
                            value={q.correctAnswer}
                            onValueChange={(val) => handleCorrectAnswerChange(qIndex, val || "")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn đáp án đúng" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A">Lựa chọn A</SelectItem>
                              <SelectItem value="B">Lựa chọn B</SelectItem>
                              <SelectItem value="C">Lựa chọn C</SelectItem>
                              <SelectItem value="D">Lựa chọn D</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button type="button" variant="outline" onClick={handleAddQuestion} className="w-full">
                    Thêm câu hỏi mới
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo bài kiểm tra"}</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
