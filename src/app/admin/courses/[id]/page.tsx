"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, HelpCircle, FileText, Settings, User } from "lucide-react";

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceCredit, setPriceCredit] = useState("100");
  const [isPublished, setIsPublished] = useState(false);
  const [creatorId, setCreatorId] = useState("");
  const [creatorInfo, setCreatorInfo] = useState<{ name: string | null; email: string } | null>(null);
  const [instructors, setInstructors] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [category, setCategory] = useState("Web Development");

  useEffect(() => {
    fetch(`/api/admin/courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.course) {
          setTitle(data.course.title);
          setSlug(data.course.slug);
          setDescription(data.course.description ?? "");
          setPriceCredit(String(data.course.priceCredit));
          setIsPublished(data.course.isPublished);
          setCreatorId(data.course.creatorId);
          setCreatorInfo(data.course.creator);
          setCategory(data.course.category ?? "Web Development");
        }
        if (data.instructors) {
          setInstructors(data.instructors);
        }
      });
  }, [courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: any = {
        title,
        slug,
        description,
        priceCredit: parseInt(priceCredit),
        isPublished,
        category,
      };
      if (creatorId) {
        payload.creatorId = creatorId;
      }

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Đã xảy ra lỗi");
        setLoading(false);
        return;
      }

      router.push("/admin/courses");
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Bạn có chắc muốn xóa khóa học này?")) return;
    await fetch(`/api/admin/courses/${courseId}`, { method: "DELETE" });
    router.push("/admin/courses");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa khóa học</h1>
          <p className="text-sm text-slate-500 mt-1">Cấu hình thông tin cơ bản và quyền quản trị khóa học.</p>
        </div>
        <Badge className={isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600"}>
          {isPublished ? "Đã xuất bản" : "Nháp"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={() => router.push(`/admin/courses/${courseId}/sessions`)} className="rounded-xl flex items-center gap-1.5">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <span>Quản lý buổi học / bài giảng</span>
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/admin/courses/${courseId}/quizzes/new`)} className="rounded-xl flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4 text-slate-500" />
          <span>Tạo bài kiểm tra</span>
        </Button>
        <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10" onClick={() => router.push(`/admin/courses/${courseId}/submissions`)}>
          <FileText className="h-4 w-4" />
          <span>Xem bài nộp học viên</span>
        </Button>
      </div>

      <Card className="border border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-lg bg-red-50 p-3.5 text-sm font-medium text-red-600 border border-red-100">{error}</div>}

            {/* Instructor Assignment / Owner Box */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>Giảng viên phụ trách</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-blue-600 bg-blue-50/60 px-2 py-0.5 rounded font-bold border border-blue-100/50">
                  Quyền quản trị
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Giảng viên được giao sẽ có toàn quyền biên tập bài học, cập nhật tài liệu và trực tiếp chấm điểm bài tập tự luận của học viên cho khóa học này.
              </p>
              
              {instructors.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <Select value={creatorId} onValueChange={(val) => setCreatorId(val || "")}>
                    <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Chọn giảng viên chịu trách nhiệm" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id}>
                          {ins.name ?? "Chưa đặt tên"} ({ins.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-sm font-medium text-slate-700 bg-white border border-slate-200/60 p-3 rounded-xl shadow-sm flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{creatorInfo ? `${creatorInfo.name ?? "Giảng viên"} (${creatorInfo.email})` : "Đang tải thông tin giảng viên..."}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold text-slate-700">Tên khóa học</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="font-semibold text-slate-700">Slug</Label>
              <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="font-semibold text-slate-700">Chủ đề / Phân loại khóa học</Label>
              <Select value={category} onValueChange={(val) => setCategory(val || "Web Development")}>
                <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-blue-500 rounded-xl">
                  <SelectValue placeholder="Chọn chủ đề khóa học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Web Development">Lập trình Web (Web Development)</SelectItem>
                  <SelectItem value="Software Engineering">Kỹ nghệ phần mềm (Software Engineering)</SelectItem>
                  <SelectItem value="Backend Development">Lập trình Backend (Backend Development)</SelectItem>
                  <SelectItem value="Data Science & AI">Khoa học dữ liệu & AI (Data Science & AI)</SelectItem>
                  <SelectItem value="UI/UX Design">Thiết kế UI/UX (UI/UX Design)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold text-slate-700">Mô tả</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="font-semibold text-slate-700">Giá (credit)</Label>
              <Input id="price" type="number" value={priceCredit} onChange={(e) => setPriceCredit(e.target.value)} min="0" required className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="flex items-center gap-3 bg-slate-50/20 p-3.5 border border-slate-100 rounded-2xl">
              <input
                type="checkbox"
                id="published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="grid gap-0.5 leading-none">
                <Label htmlFor="published" className="font-semibold text-slate-800 cursor-pointer">Xuất bản khóa học</Label>
                <p className="text-xs text-slate-500">Mở quyền truy cập cho tất cả học viên đăng ký trên hệ thống.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-md shadow-blue-500/10">
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl px-5 py-2.5">
                Hủy
              </Button>
              <Button type="button" variant="destructive" className="sm:ml-auto rounded-xl px-5 py-2.5" onClick={handleDelete}>
                Xóa khóa học
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
