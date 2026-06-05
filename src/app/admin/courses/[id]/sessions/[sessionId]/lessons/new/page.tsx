"use client";

import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, Download, Upload, Trash2, X, Plus, ChevronUp, ChevronDown } from "lucide-react";

interface QuestionItem {
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
}

interface AttachmentItem {
  title: string;
  url: string;
  size?: number;
}

export default function NewLessonPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const sessionId = params.sessionId as string;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"VIDEO" | "DOCUMENT" | "QUIZ">("VIDEO");
  const [description, setDescription] = useState(""); // Document content or video description

  // Video settings
  const [videoUrl, setVideoUrl] = useState("");
  const [videoType, setVideoType] = useState("YOUTUBE");
  const [duration, setDuration] = useState("0");
  const [isFree, setIsFree] = useState(false);
  const [isGated, setIsGated] = useState(false);

  // Document/Attachment Uploads
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Essay Assignment (Bài tập tự luận)
  const [hasAssignment, setHasAssignment] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentIsRequired, setAssignmentIsRequired] = useState(true);

  // Quiz states (Bài tập trắc nghiệm)
  const [passScore, setPassScore] = useState("60");
  const [quizMode, setQuizMode] = useState<"MANUAL" | "JSON">("MANUAL");
  const [questionsJson, setQuestionsJson] = useState(`[
  {
    "text": "BawuiAcademy là gì?",
    "options": [
      { "label": "A", "text": "Hệ thống quản lý cơ sở dữ liệu" },
      { "label": "B", "text": "Nền tảng học trực tuyến đa ngành thực chiến" },
      { "label": "C", "text": "Một framework frontend" },
      { "label": "D", "text": "Một hệ điều hành" }
    ],
    "correctAnswer": "B"
  }
]`);
  const [manualQuestions, setManualQuestions] = useState<QuestionItem[]>([
    {
      text: "",
      options: [
        { label: "A", text: "" },
        { label: "B", text: "" },
        { label: "C", text: "" },
        { label: "D", text: "" }
      ],
      correctAnswer: "A"
    }
  ]);

  const quizFileInputRef = useRef<HTMLInputElement>(null);

  // File Upload logic
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể upload file");
      }

      const data = await res.json();
      setAttachments((prev) => [
        ...prev,
        {
          title: file.name,
          url: data.url,
          size: file.size,
        },
      ]);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi tải tài liệu lên");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Switch modes
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

  // Manual Question changes
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

  // Import/Export Quiz
  const handleExportJson = () => {
    const currentQuestions = quizMode === "JSON" ? JSON.parse(questionsJson) : manualQuestions;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentQuestions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `trac-nghiem-${title || "bai-hoc"}-${Date.now()}.json`);
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
    downloadAnchor.setAttribute("download", `trac-nghiem-${title || "bai-hoc"}-${Date.now()}.csv`);
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

  // Submit lesson details
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    let quizQuestions = undefined;
    if (type === "QUIZ") {
      try {
        if (quizMode === "JSON") {
          quizQuestions = JSON.parse(questionsJson);
          if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
            throw new Error("Mảng câu hỏi JSON không được để trống");
          }
        } else {
          quizQuestions = manualQuestions;
          if (quizQuestions.length === 0) {
            throw new Error("Hãy thêm ít nhất 1 câu hỏi");
          }
          for (const q of quizQuestions) {
            if (!q.text.trim()) throw new Error("Nội dung câu hỏi không được để trống");
            if (q.options.some((opt) => !opt.text.trim())) {
              throw new Error("Nội dung các lựa chọn không được để trống");
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "JSON câu hỏi trắc nghiệm không hợp lệ");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        title,
        type,
        duration: duration ? parseInt(duration) : null,
        isFree,
        isGated,
        description: type === "DOCUMENT" ? description : null,
        videoUrl: type === "VIDEO" ? videoUrl : "",
        videoType: type === "VIDEO" ? videoType : "YOUTUBE",
        passScore: type === "QUIZ" ? parseInt(passScore) : undefined,
        questions: type === "QUIZ" ? quizQuestions : undefined,
        resources: attachments.map((att) => ({
          title: att.title,
          url: att.url,
          content: att.size ? `Kích thước: ${Math.round(att.size / 1024)} KB` : null,
        })),
        assignment: hasAssignment
          ? {
              title: assignmentTitle,
              description: assignmentDescription,
              isRequired: assignmentIsRequired,
            }
          : undefined,
      };

      const res = await fetch(`/api/admin/sessions/${sessionId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể tạo bài học");
      }

      router.push(`/admin/courses/${courseId}/sessions/${sessionId}/lessons`);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi kết nối máy chủ");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thêm bài học mới</h1>
          <p className="text-sm text-slate-500 mt-1">Cấu hình video bài giảng, tài liệu, bài tập trắc nghiệm và tự luận.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} className="rounded-xl">
          Quay lại
        </Button>
      </div>

      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 flex items-center justify-between">
                <span>{error}</span>
                <button type="button" onClick={() => setError("")} className="text-red-500 hover:text-red-700">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Core Settings */}
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-slate-700">Tên bài học</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề bài học..."
                  required
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Loại bài học</Label>
                <Select value={type} onValueChange={(val) => setType(val as "VIDEO" | "DOCUMENT" | "QUIZ")}>
                  <SelectTrigger className="rounded-xl border-slate-200 focus:ring-blue-500 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIDEO">Video bài giảng</SelectItem>
                    <SelectItem value="DOCUMENT">Tài liệu lý thuyết / Đọc bài</SelectItem>
                    <SelectItem value="QUIZ">Bài kiểm tra (Trắc nghiệm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Render conditional inputs based on lesson type */}
            {type === "VIDEO" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Cài đặt Video</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="videoUrl" className="text-slate-600 text-xs">Video URL / Đường dẫn</Label>
                    <Input
                      id="videoUrl"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... hoặc link Vimeo/S3"
                      required
                      className="rounded-xl border-slate-200 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-600 text-xs">Nguồn phát Video</Label>
                      <Select value={videoType} onValueChange={(val) => setVideoType(val ?? "YOUTUBE")}>
                        <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YOUTUBE">YouTube</SelectItem>
                          <SelectItem value="VIMEO">Vimeo</SelectItem>
                          <SelectItem value="S3">Link trực tiếp (MP4/S3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="duration" className="text-slate-600 text-xs">Thời lượng video (giây)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        min="0"
                        className="rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {type === "DOCUMENT" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Nội dung bài viết lý thuyết</h3>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-600 text-xs">Bài viết chi tiết (hỗ trợ văn bản)</Label>
                  <Textarea
                    id="description"
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Soạn nội dung bài đọc lý thuyết..."
                    className="rounded-xl border-slate-200 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Document upload functionality (For Video and Document types) */}
            {type !== "QUIZ" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <h3 className="font-semibold text-slate-800 text-sm">Tài liệu đính kèm (PDF, Slide, Zip)</h3>
                
                {/* Upload drag drop zone */}
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
                    <UploadCloud className="h-10 w-10 text-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">
                      {uploading ? "Đang tải tệp lên..." : "Kéo thả hoặc Click để tải tài liệu lên"}
                    </p>
                    <p className="text-xs text-slate-400">Chấp nhận mọi định dạng tệp tin.</p>
                  </div>
                </div>

                {/* Uploaded files list */}
                {attachments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-slate-500 text-xs font-semibold">Tập tin đã chọn ({attachments.length})</Label>
                    <div className="grid gap-2">
                      {attachments.map((att, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 text-sm shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{att.title}</p>
                              {att.size && (
                                <p className="text-xs text-slate-400 font-medium">
                                  {Math.round(att.size / 1024)} KB
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveAttachment(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quiz Configuration (Trắc nghiệm) */}
            {type === "QUIZ" && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <h3 className="font-semibold text-slate-800 text-sm">Cài đặt bài tập trắc nghiệm</h3>
                  <div className="flex items-center gap-2">
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
                      className="text-xs font-semibold rounded-xl"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> Import (.json, .csv)
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportJson}
                      className="text-xs font-semibold rounded-xl"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Export JSON
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportCsv}
                      className="text-xs font-semibold rounded-xl"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="font-semibold text-slate-700">Thời gian làm bài (phút, 0 = không giới hạn)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="0"
                      required
                      className="rounded-xl border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passScore" className="font-semibold text-slate-700">Tỷ lệ điểm để đạt (%)</Label>
                    <Input
                      id="passScore"
                      type="number"
                      value={passScore}
                      onChange={(e) => setPassScore(e.target.value)}
                      min="0"
                      max="100"
                      required
                      className="rounded-xl border-slate-200"
                    />
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
                      <Label className="font-semibold text-slate-700">Câu hỏi dạng JSON</Label>
                      <Textarea
                        value={questionsJson}
                        onChange={(e) => setQuestionsJson(e.target.value)}
                        rows={12}
                        className="font-mono text-xs rounded-xl"
                      />
                      <p className="text-xs text-slate-400">Hỗ trợ mảng cấu trúc câu hỏi có keys: text, options (A/B/C/D), correctAnswer.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {manualQuestions.map((q, qIndex) => (
                        <Card key={qIndex} className="relative border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                          <div className="flex items-center justify-between py-2.5 px-4 bg-slate-50 border-b border-slate-100">
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
                              <Label className="text-slate-600 text-xs">Nội dung câu hỏi</Label>
                              <Textarea
                                value={q.text}
                                onChange={(e) => handleQuizQuestionTextChange(qIndex, e.target.value)}
                                placeholder="Nhập câu hỏi trắc nghiệm..."
                                rows={2}
                                required
                                className="rounded-xl border-slate-200 bg-white"
                              />
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              {q.options.map((opt, oIndex) => (
                                <div key={opt.label} className="space-y-1.5">
                                  <Label className="text-slate-500 text-xs font-semibold">Đáp án {opt.label}</Label>
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
                              <Label className="text-slate-600 text-xs">Đáp án đúng</Label>
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
              </div>
            )}

            {/* Homework Essay Assignment Integration (Tự luận) */}
            {type !== "QUIZ" && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-semibold text-slate-800 text-sm">Giao Bài tập tự luận về nhà</Label>
                    <p className="text-xs text-slate-400">Học sinh sẽ làm bài và nhập câu trả lời trực tiếp trên hệ thống.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasAssignment}
                    onChange={(e) => setHasAssignment(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                  />
                </div>

                {hasAssignment && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label htmlFor="assignmentTitle" className="text-slate-600 text-xs">Tên câu hỏi tự luận</Label>
                      <Input
                        id="assignmentTitle"
                        value={assignmentTitle}
                        onChange={(e) => setAssignmentTitle(e.target.value)}
                        placeholder="Ví dụ: Bài tập tự luận số 1, Hãy viết bài thu hoạch..."
                        required={hasAssignment}
                        className="rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignmentDescription" className="text-slate-600 text-xs">Yêu cầu / Câu hỏi tự luận chi tiết</Label>
                      <Textarea
                        id="assignmentDescription"
                        rows={4}
                        value={assignmentDescription}
                        onChange={(e) => setAssignmentDescription(e.target.value)}
                        placeholder="Nội dung câu hỏi tự luận để sinh viên làm bài..."
                        required={hasAssignment}
                        className="rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isRequired"
                        checked={assignmentIsRequired}
                        onChange={(e) => setAssignmentIsRequired(e.target.checked)}
                        className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                      />
                      <label htmlFor="isRequired" className="text-xs text-slate-500 font-semibold cursor-pointer">
                        Yêu cầu hoàn thành bài tập này mới được qua bài tiếp theo
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General progress lock controls */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-600">Bài học miễn phí (Học thử)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGated}
                  onChange={(e) => setIsGated(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-slate-300"
                />
                <span className="text-sm font-semibold text-slate-600">Khóa bài học (Phải hoàn thành bài trước)</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-semibold shadow-md shadow-blue-500/10"
              >
                {loading ? "Đang tạo..." : "Tạo bài học"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl px-5 py-2.5 font-semibold"
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
