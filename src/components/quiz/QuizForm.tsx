"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: string;
  text: string;
  options: { label: string; text: string }[];
  correctAnswer?: string;
}

interface QuizFormProps {
  quizId: string;
  title: string;
  questions: Question[];
  passScore: number;
  onSubmit: (answers: Record<string, string>) => Promise<{
    score: number;
    passed: boolean;
    results: { questionId: string; selectedAnswer: string; correctAnswer: string; isCorrect: boolean }[];
  }>;
}

export function QuizForm({ quizId, title, questions, passScore, onSubmit }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof onSubmit>> | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSelect(questionId: string, label: string) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: label }));
  }

  async function handleSubmit() {
    if (Object.keys(answers).length !== questions.length) return;
    setLoading(true);
    const res = await onSubmit(answers);
    setResult(res);
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted && result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Kết quả</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className={`text-5xl font-bold ${result.passed ? "text-green-600" : "text-red-600"}`}>
              {result.score}%
            </p>
            <Badge className={result.passed ? "bg-green-600" : "bg-red-600"}>
              {result.passed ? "Đạt" : "Chưa đạt"} (Yêu cầu: {passScore}%)
            </Badge>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q, i) => {
            const r = result.results.find((x) => x.questionId === q.id);
            return (
              <Card key={q.id}>
                <CardContent className="p-4 space-y-3">
                  <p className="font-medium">
                    {i + 1}. {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const isSelected = r?.selectedAnswer === opt.label;
                      const isCorrect = r?.correctAnswer === opt.label;
                      return (
                        <div
                          key={opt.label}
                          className={`flex items-center gap-2 rounded-md p-2 text-sm ${
                            isCorrect
                              ? "bg-green-50 text-green-700"
                              : isSelected && !isCorrect
                                ? "bg-red-50 text-red-700"
                                : ""
                          }`}
                        >
                          {isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : isSelected ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                          <span className="font-medium">{opt.label}.</span>
                          <span>{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Badge variant="secondary">{answeredCount}/{questions.length} câu</Badge>
      </div>

      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="p-4 space-y-3">
            <p className="font-medium">{i + 1}. {q.text}</p>
            <RadioGroup value={answers[q.id] || ""} onValueChange={(val: string) => handleSelect(q.id, val)}>
              {q.options.map((opt) => (
                <div key={opt.label} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-gray-50">
                  <RadioGroupItem value={opt.label} id={`${q.id}-${opt.label}`} />
                  <Label htmlFor={`${q.id}-${opt.label}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{opt.label}.</span> {opt.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={answeredCount !== questions.length || loading}>
        {loading ? "Đang nộp bài..." : "Nộp bài"}
      </Button>
    </div>
  );
}
