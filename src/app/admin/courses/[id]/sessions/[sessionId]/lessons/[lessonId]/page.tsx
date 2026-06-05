"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, Download, Upload, Trash2, X, Plus, Edit } from "lucide-react";

interface QuestionItem {
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
}

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  videoType: string;
  type: "VIDEO" | "DOCUMENT" | "QUIZ";
  duration: number | null;
  orderIndex: number;
  isFree: boolean;
  isGated: boolean;
}

interface AssignmentData {
  id?: string;
  title: string;
  description: string;
  isRequired: boolean;
}

interface ResourceData {
  id: string;
  title: string;
  url?: string | null;
  content?: string | null;
  orderIndex: number;
}

export default function AdminLessonEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const sessionId = params.sessionId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [resources, setResources] = useState<ResourceData[]>([]);
  
  // Quiz states
  const [hasQuiz, setHasQuiz] = useState<boolean>(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizPassScore, setQuizPassScore] = useState("60");
  const [quizDuration, setQuizDuration] = useState("0");
  const [quizMode, setQuizMode] = useState<"MANUAL" | "JSON">("MANUAL");
  const [questionsJson, setQuestionsJson] = useState("");
  const [manualQuestions, setManualQuestions] = useState<QuestionItem[]>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quizFileInputRef = useRef<HTMLInputElement>(null);

  // Edit resource inline state
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [editResourceTitle, setEditResourceTitle] = useState("");
  const [editResourceUrl, setEditResourceUrl] = useState("");
  const [editResourceContent, setEditResourceContent] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/lessons/${lessonId}`).then((res) => res.json()),
      fetch(`/api/admin/lessons/${lessonId}/assignment`).then((res) => res.json()),
      fetch(`/api/admin/lessons/${lessonId}/resources`).then((res) => res.json()),
      fetch(`/api/admin/lessons/${lessonId}/quiz`).then((res) => res.json()),
    ]).then(([lessonData, assignmentData, resourceData, quizData]) => {
      setLesson(lessonData.lesson);
      setAssignment(assignmentData.assignment ?? { title: "", description: "", isRequired: true });
      setResources(resourceData.resources ?? []);
      
      if (quizData.quiz) {
        setHasQuiz(true);
        setQuizTitle(quizData.quiz.title ?? "");
        setQuizDescription(quizData.quiz.description ?? "");
        setQuizPassScore(String(quizData.quiz.passScore ?? 60));
        setQuizDuration(String(quizData.quiz.duration ?? 0));
        
        const qList = quizData.quiz.questions ?? [];
        const formatted = qList.map((q: any) => {
          let optionsList: { label: string; text: string }[] = [];
          const options = q.options;
          if (typeof options === "string") {
            try {
              optionsList = JSON.parse(options);
            } catch {
              optionsList = [];
            }
          } else if (Array.isArray(options)) {
            optionsList = options;
          }
          const optA = optionsList.find((o) => o.label === "A")?.text || optionsList[0]?.text || "";
          const optB = optionsList.find((o) => o.label === "B")?.text || optionsList[1]?.text || "";
          const optC = optionsList.find((o) => o.label === "C")?.text || optionsList[2]?.text || "";
          const optD = optionsList.find((o) => o.label === "D")?.text || optionsList[3]?.text || "";
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
        setQuestionsJson(JSON.stringify(formatted, null, 2));
      } else {
        setHasQuiz(false);
        setQuizTitle("");
        setQuizDescription("");
        setQuizPassScore("60");
        setQuizDuration("0");
        setManualQuestions([
          {
            text: "",
            options: [
              { label: "A", text: "" },
              { label: "B", text: "" },
              { label: "C", text: "" },
              { label: "D", text: "" },
            ],
            correctAnswer: "A",
          }
        ]);
        setQuestionsJson(`[
  {
    "text": "Câu hỏi ví dụ?",
    "options": [
      { "label": "A", "text": "Đáp án A" },
      { "label": "B", "text": "Đáp án B" },
      { "label": "C", "text": "Đáp án C" },
      { "label": "D", "text": "Đáp án D" }
    ],
    "correctAnswer": "A"
  }
]`);
      }
    });
  }, [lessonId]);

  async function saveLesson() {
    if (!lesson) return;
    setSaving(true);
    setError("");
    const payload = {
      ...lesson,
      videoUrl: lesson.type === "VIDEO" ? lesson.videoUrl : "",
      videoType: lesson.type === "VIDEO" ? lesson.videoType : "YOUTUBE",
    };
    const res = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Không thể lưu bài học");
    } else {
      if (lesson.type === "QUIZ") {
        setHasQuiz(true);
      }
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

  // Handle uploading resource attachment
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Không thể upload file");
      }

      const uploadData = await uploadRes.json();

      // Create resource in DB
      const res = await fetch(`/api/admin/lessons/${lessonId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file.name,
          url: uploadData.url,
          content: `Kích thước: ${Math.round(file.size / 1024)} KB`,
          orderIndex: resources.length + 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể lưu tài liệu vào cơ sở dữ liệu");
      }

      const data = await res.json();
      setResources((prev) => [...prev, data.resource]);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải tài liệu");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Edit / Delete Resource
  const startEditResource = (res: ResourceData) => {
    setEditingResourceId(res.id);
    setEditResourceTitle(res.title);
    setEditResourceUrl(res.url || "");
    setEditResourceContent(res.content || "");
  };

  const cancelEditResource = () => {
    setEditingResourceId(null);
  };

  const saveEditedResource = async (id: string) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/resources`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: editResourceTitle,
          url: editResourceUrl || null,
          content: editResourceContent || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể cập nhật tài liệu");
      }

      const data = await res.json();
      setResources((prev) => prev.map((r) => (r.id === id ? data.resource : r)));
      setEditingResourceId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteResource = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/resources?resourceId=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa tài liệu");
      }

      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Switch Quiz mode
  const handleSwitchToQuizJson = () => {
    setQuestionsJson(JSON.stringify(manualQuestions, null, 2));
    setQuizMode("JSON");
    setError("");
  };

  const handleSwitchToQuizManual = () => {
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
      setQuizMode("MANUAL");
    } catch {
      setError("Không thể chuyển sang chế độ thủ công vì JSON câu hỏi không hợp lệ.");
    }
  };

  const handleQuizAddQuestion = () => {
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

  const handleQuizRemoveQuestion = (index: number) => {
    setManualQuestions(manualQuestions.filter((_, idx) => idx !== index));
  };

  const handleQuizQuestionTextChange = (index: number, text: string) => {
    const updated = [...manualQuestions];
    updated[index].text = text;
    setManualQuestions(updated);
  };

  const handleQuizOptionTextChange = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...manualQuestions];
    updated[qIndex].options[oIndex].text = text;
    setManualQuestions(updated);
  };

  const handleQuizCorrectAnswerChange = (index: number, val: string) => {
    const updated = [...manualQuestions];
    updated[index].correctAnswer = val;
    setManualQuestions(updated);
  };

  // Import/Export Quiz Questions
  const handleExportJson = () => {
    const currentQuestions = quizMode === "JSON" ? JSON.parse(questionsJson) : manualQuestions;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentQuestions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `trac-nghiem-${lesson?.title || "bai-hoc"}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const currentQuestions = quizMode === "JSON" ? JSON.parse(questionsJson) : manualQuestions;
    const headers = "Câu hỏi,Lựa chọn A,Lựa chọn B,Lựa chọn C,Lựa chọn D,Đáp án đúng (A/B/C/D)\n";
    const rows = currentQuestions.map((q: any) => {
      const escape = (val: string) => `"${(val || "").replace(/"/g, '""')}"`;
      const optA = q.options.find((o: any) => o.label === "A")?.text || q.options[0]?.text || "";
      const optB = q.options.find((o: any) => o.label === "B")?.text || q.options[1]?.text || "";
      const optC = q.options.find((o: any) => o.label === "C")?.text || q.options[2]?.text || "";
      const optD = q.options.find((o: any) => o.label === "D")?.text || q.options[3]?.text || "";
      return `${escape(q.text)},${escape(optA)},${escape(optB)},${escape(optC)},${escape(optD)},${q.correctAnswer}`;
    }).join("\n");

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(headers + rows);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `trac-nghiem-${lesson?.title || "bai-hoc"}-${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error("Dữ liệu JSON phải là một mảng");
          setManualQuestions(parsed);
          setQuestionsJson(JSON.stringify(parsed, null, 2));
          setError("");
        } catch (err: any) {
          setError("Lỗi parse file JSON: " + err.message);
        }
      } else if (file.name.endsWith(".csv")) {
        try {
          const lines = text.split(/\r?\n/);
          if (lines.length <= 1) throw new Error("File CSV rỗng hoặc thiếu tiêu đề");

          const parsed: QuestionItem[] = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = [];
            let current = "";
            let inQuotes = false;
            for (let c = 0; c < line.length; c++) {
              const char = line[c];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                parts.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
                current = "";
              } else {
                current += char;
              }
            }
            parts.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

            if (parts.length < 6) continue;

            const [questionText, aText, bText, cText, dText, correctAns] = parts;

            if (!questionText || !aText || !bText || !cText || !dText || !correctAns) {
              continue;
            }

            const cleanCorrectAns = correctAns.trim().toUpperCase();
            if (!["A", "B", "C", "D"].includes(cleanCorrectAns)) {
              throw new Error(`Dòng ${i + 1}: Đáp án phải là A, B, C hoặc D. Nhận được: ${correctAns}`);
            }

            parsed.push({
              text: questionText,
              options: [
                { label: "A", text: aText },
                { label: "B", text: bText },
                { label: "C", text: cText },
                { label: "D", text: dText },
              ],
              correctAnswer: cleanCorrectAns,
            });
          }

          if (parsed.length === 0) throw new Error("Không tìm thấy câu hỏi hợp lệ");
          setManualQuestions(parsed);
          setQuestionsJson(JSON.stringify(parsed, null, 2));
          setError("");
        } catch (err: any) {
          setError("Lỗi parse file CSV: " + err.message);
        }
      }
    };
    reader.readAsText(file);
    if (quizFileInputRef.current) quizFileInputRef.current.value = "";
  };

  async function saveQuiz() {
    setSaving(true);
    setError("");

    try {
      let questions: QuestionItem[] = [];
      if (quizMode === "JSON") {
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

      const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          passScore: Number(quizPassScore),
          duration: Number(quizDuration),
          questions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Không thể lưu bài trắc nghiệm");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dữ liệu câu hỏi không hợp lệ");
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuiz() {
    if (!confirm("Bạn có chắc chắn muốn xóa bài trắc nghiệm này?")) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Không thể xóa bài trắc nghiệm");
    } else {
      setHasQuiz(false);
      setQuizTitle("");
      setQuizDescription("");
      setQuizPassScore("60");
      setQuizDuration("0");
      setManualQuestions([
        {
          text: "",
          options: [
            { label: "A", text: "" },
            { label: "B", text: "" },
            { label: "C", text: "" },
            { label: "D", text: "" },
          ],
          correctAnswer: "A",
        }
      ]);
      setQuestionsJson(`[
  {
    "text": "",
    "options": [
      { "label": "A", "text": "" },
      { "label": "B", "text": "" },
      { "label": "C", "text": "" },
      { "label": "D", "text": "" }
    ],
    "correctAnswer": "A"
  }
]`);
    }
    setSaving(false);
  }

  if (!lesson) return <p className="p-6 text-center text-slate-500 font-medium">Đang tải cấu hình bài học...</p>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý bài học</h1>
          <p className="text-sm text-slate-500 mt-1">Cấu hình video bài giảng, tài liệu bổ sung, bài tập trắc nghiệm và tự luận.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/admin/courses/${courseId}/sessions/${sessionId}/lessons`)} className="rounded-xl">
          Quay lại danh sách
        </Button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Tabs defaultValue="video" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full md:w-auto flex flex-wrap md:inline-flex">
          <TabsTrigger value="video" className="rounded-lg font-semibold text-xs px-4 py-2 flex-1 md:flex-initial">Cấu hình bài học</TabsTrigger>
          <TabsTrigger value="resources" className="rounded-lg font-semibold text-xs px-4 py-2 flex-1 md:flex-initial">Tài liệu học tập ({resources.length})</TabsTrigger>
          <TabsTrigger value="assignment" className="rounded-lg font-semibold text-xs px-4 py-2 flex-1 md:flex-initial">Bài tập tự luận</TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-lg font-semibold text-xs px-4 py-2 flex-1 md:flex-initial">Trắc nghiệm bài học</TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Config */}
        <TabsContent value="video">
          <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <CardTitle className="text-sm font-bold text-slate-800">Cấu hình cơ bản bài học</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Tên bài học</Label>
                  <Input 
                    value={lesson.title ?? ""} 
                    onChange={(e) => setLesson({ ...lesson, title: e.target.value })} 
                    className="rounded-xl border-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Loại bài học</Label>
                  <Select value={lesson.type || "VIDEO"} onValueChange={(val) => setLesson({ ...lesson, type: val as any })}>
                    <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video bài giảng</SelectItem>
                      <SelectItem value="DOCUMENT">Tài liệu đọc lý thuyết</SelectItem>
                      <SelectItem value="QUIZ">Bài kiểm tra (Trắc nghiệm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {lesson.type === "VIDEO" && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-slate-600 text-xs font-semibold">Đường dẫn Video URL</Label>
                    <Input 
                      value={lesson.videoUrl ?? ""} 
                      onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value })} 
                      className="rounded-xl border-slate-200 bg-white"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-600 text-xs font-semibold">Loại Video</Label>
                      <Select value={lesson.videoType} onValueChange={(value) => setLesson({ ...lesson, videoType: value ?? "YOUTUBE" })}>
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YOUTUBE">YouTube</SelectItem>
                          <SelectItem value="VIMEO">Vimeo</SelectItem>
                          <SelectItem value="S3">Link trực tiếp (S3/MP4)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-600 text-xs font-semibold">Thời lượng video (giây)</Label>
                      <Input 
                        type="number" 
                        value={lesson.duration ?? ""} 
                        onChange={(e) => setLesson({ ...lesson, duration: e.target.value ? Number(e.target.value) : null })} 
                        className="rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {lesson.type === "DOCUMENT" && (
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Label className="text-slate-700 text-xs font-semibold">Nội dung bài viết lý thuyết</Label>
                  <Textarea 
                    rows={8} 
                    value={lesson.description ?? ""} 
                    onChange={(e) => setLesson({ ...lesson, description: e.target.value })} 
                    placeholder="Nhập lý thuyết bằng Markdown hoặc văn bản thô..."
                    className="rounded-xl border-slate-200 bg-white focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={lesson.isFree} onChange={(e) => setLesson({ ...lesson, isFree: e.target.checked })} className="h-4 w-4 rounded text-blue-600 border-slate-300" />
                  Bài học miễn phí (Học thử)
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={lesson.isGated} onChange={(e) => setLesson({ ...lesson, isGated: e.target.checked })} className="h-4 w-4 rounded text-blue-600 border-slate-300" />
                  Khóa theo tiến độ (Phải học xong bài trước)
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button onClick={saveLesson} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                  {saving ? "Đang lưu..." : "Lưu cấu hình bài học"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Resource Attachments */}
        <TabsContent value="resources">
          <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <CardTitle className="text-sm font-bold text-slate-800">Tài liệu học tập & tập tin đính kèm</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Uploader */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex justify-center text-slate-400">
                  <UploadCloud className="h-8 w-8 text-blue-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700">
                    {uploading ? "Đang tải tệp lên..." : "Kéo thả hoặc Click để tải tài liệu bài học lên"}
                  </p>
                  <p className="text-[10px] text-slate-400">PDF, PPTX, Docx, Zip, Rar, v.v.</p>
                </div>
              </div>

              {/* Resources list */}
              {resources.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-500">
                  Chưa có tài liệu đính kèm cho bài học này.
                </div>
              ) : (
                <div className="grid gap-3">
                  {resources.map((res) => (
                    <div key={res.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm text-sm">
                      {editingResourceId === res.id ? (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500 font-semibold">Tên tài liệu</Label>
                            <Input 
                              value={editResourceTitle} 
                              onChange={(e) => setEditResourceTitle(e.target.value)} 
                              className="rounded-xl h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500 font-semibold">Đường dẫn tệp / Link tải</Label>
                            <Input 
                              value={editResourceUrl} 
                              onChange={(e) => setEditResourceUrl(e.target.value)} 
                              className="rounded-xl h-9"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500 font-semibold">Mô tả / Kích thước</Label>
                            <Input 
                              value={editResourceContent} 
                              onChange={(e) => setEditResourceContent(e.target.value)} 
                              className="rounded-xl h-9"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              onClick={() => saveEditedResource(res.id)} 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 h-8 text-xs font-semibold"
                            >
                              Lưu thay đổi
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={cancelEditResource} 
                              size="sm" 
                              className="rounded-lg px-3 h-8 text-xs font-semibold"
                            >
                              Hủy
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-6 w-6 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{res.title}</p>
                              <div className="flex gap-2 text-xs text-slate-400 mt-0.5">
                                {res.url && <span className="truncate max-w-[200px]">{res.url}</span>}
                                {res.content && <span>• {res.content}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => startEditResource(res)} 
                              className="h-8 w-8 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteResource(res.id)} 
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Essay Assignment (Tự luận) */}
        <TabsContent value="assignment">
          <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
              <CardTitle className="text-sm font-bold text-slate-800">Bài tập tự luận về nhà</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Tiêu đề câu hỏi tự luận</Label>
                <Input 
                  value={assignment?.title ?? ""} 
                  onChange={(e) => setAssignment(prev => prev ? { ...prev, title: e.target.value } : { title: e.target.value, description: "", isRequired: true })} 
                  placeholder="Nhập tiêu đề hoặc chủ đề bài tập..."
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Yêu cầu / Câu hỏi tự luận chi tiết</Label>
                <Textarea 
                  rows={8} 
                  value={assignment?.description ?? ""} 
                  onChange={(e) => setAssignment(prev => prev ? { ...prev, description: e.target.value } : { title: "", description: e.target.value, isRequired: true })} 
                  placeholder="Sinh viên sẽ đọc đề bài này và viết câu trả lời trực tiếp trong khung làm bài của họ..."
                  className="rounded-xl border-slate-200 bg-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 cursor-pointer pt-1">
                <input 
                  type="checkbox" 
                  checked={assignment?.isRequired ?? true} 
                  onChange={(e) => setAssignment(prev => prev ? { ...prev, isRequired: e.target.checked } : { title: "", description: "", isRequired: e.target.checked })} 
                  className="h-4 w-4 rounded text-blue-600 border-slate-300"
                />
                Yêu cầu hoàn thành bài tập tự luận này mới cho phép qua bài tiếp theo
              </label>
              <div className="pt-2 border-t border-slate-100">
                <Button onClick={saveAssignment} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                  {saving ? "Đang lưu..." : "Lưu cấu hình bài tập"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Quiz (Trắc nghiệm) */}
        <TabsContent value="quiz">
          {!hasQuiz ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
              <p className="text-sm text-slate-500 mb-4 font-medium">Bài học này hiện chưa được cấu hình câu hỏi trắc nghiệm.</p>
              <Button type="button" onClick={() => setHasQuiz(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                Khởi tạo bài trắc nghiệm bài học
              </Button>
            </div>
          ) : (
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
              <div className="flex flex-wrap gap-2 items-center justify-between py-3 px-6 bg-slate-50 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">Soạn thảo câu hỏi trắc nghiệm</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="file"
                    ref={quizFileInputRef}
                    onChange={handleImportFile}
                    accept=".json,.csv"
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => quizFileInputRef.current?.click()}
                    className="text-xs font-semibold rounded-lg bg-white"
                  >
                    <Upload className="h-3 w-3 mr-1" /> Import (.json, .csv)
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportJson}
                    className="text-xs font-semibold rounded-lg bg-white"
                  >
                    <Download className="h-3 w-3 mr-1" /> Export JSON
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleExportCsv}
                    className="text-xs font-semibold rounded-lg bg-white"
                  >
                    <Download className="h-3 w-3 mr-1" /> Export CSV
                  </Button>
                </div>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Tiêu đề bài trắc nghiệm</Label>
                  <Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} required className="rounded-xl border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Mô tả tóm tắt</Label>
                  <Textarea value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} rows={3} className="rounded-xl border-slate-200" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Điểm đạt (%)</Label>
                    <Input type="number" value={quizPassScore} onChange={(e) => setQuizPassScore(e.target.value)} min="0" max="100" className="rounded-xl border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-slate-700">Thời gian làm bài (phút, 0 = không giới hạn)</Label>
                    <Input type="number" value={quizDuration} onChange={(e) => setQuizDuration(e.target.value)} min="0" className="rounded-xl border-slate-200" />
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="pt-2">
                  <div className="flex border-b border-slate-100 mb-4">
                    <button
                      type="button"
                      onClick={handleSwitchToQuizManual}
                      className={`px-4 py-2 font-medium text-sm border-b-2 -mb-[1px] transition-colors ${
                        quizMode === "MANUAL"
                          ? "border-blue-600 text-blue-600 font-semibold"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Nhập thủ công
                    </button>
                    <button
                      type="button"
                      onClick={handleSwitchToQuizJson}
                      className={`px-4 py-2 font-medium text-sm border-b-2 -mb-[1px] transition-colors ${
                        quizMode === "JSON"
                          ? "border-blue-600 text-blue-600 font-semibold"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Nhập JSON
                    </button>
                  </div>

                  {quizMode === "JSON" ? (
                    <div className="space-y-2">
                      <Label className="font-semibold text-slate-750">Câu hỏi (JSON)</Label>
                      <Textarea value={questionsJson} onChange={(e) => setQuestionsJson(e.target.value)} rows={12} className="font-mono text-xs rounded-xl" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {manualQuestions.map((q, qIndex) => (
                        <Card key={qIndex} className="relative border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                          <div className="flex items-center justify-between py-2 px-4 bg-slate-50 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-700">CÂU HỎI {qIndex + 1}</span>
                            {manualQuestions.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleQuizRemoveQuestion(qIndex)}
                                className="h-7 text-xs rounded-lg px-2"
                              >
                                Xóa câu hỏi
                              </Button>
                            )}
                          </div>
                          <CardContent className="p-4 space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-slate-500">Nội dung câu hỏi</Label>
                              <Textarea
                                value={q.text}
                                onChange={(e) => handleQuizQuestionTextChange(qIndex, e.target.value)}
                                placeholder="Nhập nội dung câu hỏi..."
                                rows={2}
                                required
                                className="rounded-xl border-slate-200 bg-white"
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {q.options.map((opt, oIndex) => (
                                <div key={opt.label} className="space-y-1.5">
                                  <Label className="text-xs text-slate-500">Lựa chọn {opt.label}</Label>
                                  <Input
                                    value={opt.text}
                                    onChange={(e) => handleQuizOptionTextChange(qIndex, oIndex, e.target.value)}
                                    placeholder={`Nhập đáp án ${opt.label}...`}
                                    required
                                    className="rounded-xl border-slate-200 bg-white"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="space-y-1.5 w-1/3">
                              <Label className="text-xs text-slate-500">Đáp án đúng</Label>
                              <Select
                                value={q.correctAnswer}
                                onValueChange={(val) => handleQuizCorrectAnswerChange(qIndex, val || "")}
                              >
                                <SelectTrigger className="h-9 text-xs rounded-xl bg-white border-slate-200">
                                  <SelectValue />
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

                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleQuizAddQuestion} 
                        className="w-full text-xs font-semibold rounded-xl h-10 border-dashed border-2 hover:border-blue-500 hover:text-blue-500"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Thêm câu hỏi mới
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" onClick={saveQuiz} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold">
                    {saving ? "Đang lưu..." : "Lưu bài trắc nghiệm"}
                  </Button>
                  <Button type="button" variant="destructive" onClick={deleteQuiz} disabled={saving} className="rounded-xl font-semibold">
                    Xóa bài trắc nghiệm
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
