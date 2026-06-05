"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RoadmapEditorPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === "new";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [badgeColor, setBadgeColor] = useState("blue");
  const [orderIndex, setOrderIndex] = useState("0");
  const [steps, setSteps] = useState<string[]>([""]);

  useEffect(() => {
    let active = true;
    async function fetchRoadmapDetails() {
      try {
        const res = await fetch(`/api/admin/roadmaps/${id}`);
        if (res.ok && active) {
          const data = await res.json();
          const r = data.roadmap;
          setTitle(r.title);
          setLevel(r.level);
          setSummary(r.summary);
          setDescription(r.description);
          setBadgeColor(r.badgeColor);
          setOrderIndex(String(r.orderIndex));
          try {
            setSteps(JSON.parse(r.steps) || [""]);
          } catch {
            setSteps([""]);
          }
        } else if (active) {
          toast.error("Không thể tải chi tiết lộ trình");
          router.push("/admin/roadmaps");
        }
      } catch {
        if (active) {
          toast.error("Đã xảy ra lỗi khi tải dữ liệu");
          router.push("/admin/roadmaps");
        }
      } finally {
        if (active) setFetching(false);
      }
    }

    if (!isNew) {
      fetchRoadmapDetails();
    }
    return () => {
      active = false;
    };
  }, [id, isNew, router]);

  // Handle steps
  function handleAddStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function handleRemoveStep(index: number) {
    if (steps.length === 1) {
      toast.error("Lộ trình cần ít nhất một bước");
      return;
    }
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStepChange(index: number, value: string) {
    setSteps((prev) => {
      const newSteps = [...prev];
      newSteps[index] = value;
      return newSteps;
    });
  }

  function moveStepUp(index: number) {
    if (index === 0) return;
    setSteps((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
      return list;
    });
  }

  function moveStepDown(index: number) {
    if (index === steps.length - 1) return;
    setSteps((prev) => {
      const list = [...prev];
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
      return list;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (steps.some((s) => s.trim() === "")) {
      toast.error("Vui lòng không để trống nội dung các bước");
      return;
    }

    setLoading(true);
    const body = {
      title,
      level,
      summary,
      description,
      steps: steps.map((s) => s.trim()),
      badgeColor,
      orderIndex: parseInt(orderIndex) || 0,
    };

    try {
      const url = isNew ? "/api/admin/roadmaps" : `/api/admin/roadmaps/${id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(isNew ? "Tạo lộ trình thành công" : "Cập nhật lộ trình thành công");
        router.push("/admin/roadmaps");
      } else {
        const data = await res.json();
        toast.error(data.error || "Đã xảy ra lỗi");
      }
    } catch {
      toast.error("Đã xảy ra lỗi hệ thống");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="py-20 text-center text-slate-400">Đang tải dữ liệu lộ trình...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/roadmaps")}
          className="rounded-xl h-9 px-3"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Quay lại</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Tạo lộ trình học mới" : "Chỉnh sửa lộ trình"}</h1>
          <p className="text-sm text-slate-500">Khởi tạo và cấu hình các bước của lộ trình đào tạo lập trình viên.</p>
        </div>
      </div>

      <Card className="border border-slate-100 shadow-sm rounded-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-slate-700">Tên lộ trình</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Frontend Developer"
                  required
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="font-semibold text-slate-700">Cấp độ (Độ khó)</Label>
                <Input
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  placeholder="VD: Beginner → Intermediate"
                  required
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Màu sắc Badge hiển thị</Label>
                <Select value={badgeColor} onValueChange={(val) => setBadgeColor(val ?? "blue")}>
                  <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-blue-500 rounded-xl">
                    <SelectValue placeholder="Chọn màu badge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Xanh dương (Blue)</SelectItem>
                    <SelectItem value="purple">Tím (Purple)</SelectItem>
                    <SelectItem value="indigo">Chàm (Indigo)</SelectItem>
                    <SelectItem value="emerald">Lục bảo (Emerald)</SelectItem>
                    <SelectItem value="rose">Hồng (Rose)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order" className="font-semibold text-slate-700">Thứ tự hiển thị (càng nhỏ càng đứng trước)</Label>
                <Input
                  id="order"
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(e.target.value)}
                  min="0"
                  required
                  className="rounded-xl border-slate-200 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary" className="font-semibold text-slate-700">Tóm tắt (Hiển thị ở thẻ Trang chủ)</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Mô tả tóm tắt ngắn gọn lộ trình để hiển thị ngoài trang chủ..."
                rows={2}
                required
                className="rounded-xl border-slate-200 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-semibold text-slate-700">Mô tả chi tiết (Hiển thị ở trang Lộ trình)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả đầy đủ hơn về mục tiêu đầu ra và lợi ích của lộ trình..."
                rows={4}
                required
                className="rounded-xl border-slate-200 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-slate-900 text-sm">Các bước học tập trong lộ trình ({steps.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="rounded-lg h-8 px-2.5 flex items-center gap-1 text-xs hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm bước học</span>
                </Button>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                      {index + 1}
                    </div>
                    <Input
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Bước ${index + 1}: VD: HTML/CSS, React, API Node.js...`}
                      required
                      className="rounded-lg border-slate-200 focus:ring-blue-500 h-9 bg-white"
                    />
                    
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStepUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveStepDown(index)}
                        disabled={index === steps.length - 1}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStep(index)}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-md shadow-blue-500/10"
              >
                {loading ? "Đang lưu..." : isNew ? "Tạo lộ trình" : "Lưu thay đổi"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/roadmaps")}
                className="rounded-xl px-5 py-2.5"
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
