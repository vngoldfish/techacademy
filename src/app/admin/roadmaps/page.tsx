"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Map, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Roadmap {
  id: string;
  title: string;
  level: string;
  summary: string;
  steps: string;
  badgeColor: string;
  orderIndex: number;
}

export default function AdminRoadmapsPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadRoadmaps() {
      try {
        const res = await fetch("/api/admin/roadmaps");
        if (res.ok && active) {
          const data = await res.json();
          setRoadmaps(data.roadmaps || []);
        } else if (active) {
          toast.error("Không thể tải danh sách lộ trình");
        }
      } catch {
        if (active) toast.error("Đã xảy ra lỗi khi tải danh sách");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRoadmaps();
    return () => {
      active = false;
    };
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa lộ trình này không?")) return;

    try {
      const res = await fetch(`/api/admin/roadmaps/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Xóa lộ trình thành công");
        setRoadmaps((prev) => prev.filter((r) => r.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || "Không thể xóa lộ trình");
      }
    } catch {
      toast.error("Đã xảy ra lỗi khi xóa");
    }
  }

  function getBadgeColorClass(color: string) {
    switch (color) {
      case "purple":
        return "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200";
      case "indigo":
        return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200";
      case "emerald":
        return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200";
      case "rose":
        return "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200";
      default:
        return "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Quản lý Lộ trình Học</h1>
          <p className="text-sm text-slate-500">Tạo mới, chỉnh sửa cấu trúc các bước học của lộ trình nghề nghiệp.</p>
        </div>
        <Link href="/admin/roadmaps/new">
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10 rounded-xl px-4 py-2.5 flex items-center gap-1.5 text-white font-medium">
            <Plus className="h-4.5 w-4.5" />
            <span>Tạo lộ trình</span>
          </Button>
        </Link>
      </div>

      <Card className="border border-slate-100 shadow-sm overflow-hidden rounded-xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-600" />
            <span>Tất cả lộ trình ({roadmaps.length})</span>
          </CardTitle>
          <CardDescription>Danh sách lộ trình nghề nghiệp hiển thị ngoài Trang chủ và Trang Lộ trình.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">Đang tải danh sách...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                    <th className="p-4 pl-6">Thứ tự</th>
                    <th className="p-4">Lộ trình học</th>
                    <th className="p-4">Cấp độ</th>
                    <th className="p-4">Các bước chính</th>
                    <th className="p-4 text-right pr-6">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roadmaps.map((roadmap) => {
                    let stepList: string[] = [];
                    try {
                      stepList = JSON.parse(roadmap.steps) || [];
                    } catch {}

                    return (
                      <tr key={roadmap.id} className="hover:bg-slate-50/40 transition-colors group">
                        <td className="p-4 pl-6 font-semibold text-slate-500 w-16">
                          {roadmap.orderIndex}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {roadmap.title}
                            </span>
                            <span className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                              {roadmap.summary}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getBadgeColorClass(roadmap.badgeColor)} border font-medium px-2.5 py-0.5`}>
                            {roadmap.level}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 flex-wrap max-w-md">
                            {stepList.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-1.5">
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded font-medium">
                                  {step}
                                </span>
                                {sIdx < stepList.length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-slate-300" />
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right pr-6 space-x-1 w-28">
                          <Link href={`/admin/roadmaps/${roadmap.id}`}>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(roadmap.id)}
                            className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && roadmaps.length === 0 && (
            <div className="py-20 text-center text-sm text-slate-400">
              <Map className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p>Chưa có lộ trình học nào được tạo.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
