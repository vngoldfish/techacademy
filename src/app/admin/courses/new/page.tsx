"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { slugify } from "@/lib/utils";

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [priceCredit, setPriceCredit] = useState("100");
  const [category, setCategory] = useState("Web Development");

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          priceCredit: parseInt(priceCredit),
          category,
        }),
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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tạo khóa học mới</h1>
        <p className="text-sm text-slate-500 mt-1">Khởi tạo thông tin cơ bản cho khóa học lập trình mới.</p>
      </div>
      <Card className="border border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="rounded-lg bg-red-50 p-3.5 text-sm font-medium text-red-600 border border-red-100">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold text-slate-700">Tên khóa học</Label>
              <Input id="title" value={title} onChange={(e) => handleTitleChange(e.target.value)} required className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug" className="font-semibold text-slate-700">Slug (URL)</Label>
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
            
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-md shadow-blue-500/10">
                {loading ? "Đang tạo..." : "Tạo khóa học"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl px-5 py-2.5">Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
