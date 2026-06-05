"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

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
  duration?: number;
  lessonId?: string;
  courseId?: string;
  onSubmit: (answers: Record<string, string>) => Promise<{
    score: number;
    passed: boolean;
    results: { questionId: string; selectedAnswer: string; correctAnswer: string; isCorrect: boolean }[];
  }>;
}

export function QuizForm({ title, questions, passScore, duration, lessonId, courseId, onSubmit }: QuizFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof onSubmit>> | null>(null);
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number | null>(
    duration && duration > 0 ? duration * 60 : null
  );
  const [isTimeOut, setIsTimeOut] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;

    if (timeLeft === 0) {
      const autoSubmit = async () => {
        setIsTimeOut(true);
        setLoading(true);
        const res = await onSubmit(answersRef.current);
        setResult(res);
        setSubmitted(true);
        setLoading(false);
      };
      autoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, onSubmit]);

  function handleSelect(questionId: string, label: string) {
    if (submitted || isTimeOut) return;
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

            {lessonId && courseId && (
              <div className="pt-4">
                <Link href={`/learn/${courseId}/lesson/${lessonId}`} className="inline-block">
                  <Button>Quay lại học bài</Button>
                </Link>
              </div>
            )}
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
      {timeLeft !== null && !submitted && (
        <div
          className={`sticky top-0 z-50 flex items-center justify-between rounded-md border p-3 shadow-md transition-colors ${
            timeLeft < 60
              ? "bg-red-50 border-red-300 text-red-700 animate-pulse font-bold"
              : "bg-white border-gray-200 text-gray-700"
          }`}
        >
          <span className="text-sm font-medium">Thời gian còn lại:</span>
          <span className="text-xl font-mono">{formatTime(timeLeft)}</span>
        </div>
      )}

      {isTimeOut && (
        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-600 font-medium">
          Hết giờ làm bài! Đang tự động nộp bài...
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Badge variant="secondary">{answeredCount}/{questions.length} câu</Badge>
      </div>

      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardContent className="p-4 space-y-3">
            <p className="font-medium">{i + 1}. {q.text}</p>
            <RadioGroup
              value={answers[q.id] || ""}
              onValueChange={(val: string) => handleSelect(q.id, val)}
              disabled={submitted || isTimeOut}
            >
              {q.options.map((opt) => (
                <div key={opt.label} className="flex items-center space-x-2 rounded-md border p-3 hover:bg-gray-50">
                  <RadioGroupItem value={opt.label} id={`${q.id}-${opt.label}`} disabled={submitted || isTimeOut} />
                  <Label htmlFor={`${q.id}-${opt.label}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{opt.label}.</span> {opt.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      ))}

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={answeredCount !== questions.length || loading || isTimeOut}>
        {loading ? "Đang nộp bài..." : "Nộp bài"}
      </Button>
    </div>
  );
}
