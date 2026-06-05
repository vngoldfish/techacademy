"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Coins, Percent, Sparkles } from "lucide-react";

type Application = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
} | null;

interface InstructorApplicationFormProps {
  application: Application;
  monthlyFee: number;
  adminSharePercent: number;
}

export function InstructorApplicationForm({
  application,
  monthlyFee,
  adminSharePercent,
}: InstructorApplicationFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState(application?.message ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/instructor/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Không thể gửi yêu cầu");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  if (application?.status === "PENDING") {
    return <p className="text-sm text-amber-700">Yêu cầu nâng cấp của bạn đang chờ admin duyệt.</p>;
  }

  if (application?.status === "APPROVED") {
    return <p className="text-sm text-green-700">Tài khoản đã được duyệt quyền đăng khóa học.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-blue-600 font-bold">
          <Sparkles className="h-5 w-5 animate-pulse" />
          <h3 className="text-sm uppercase tracking-wider">Thông tin quyền lợi & chi phí Giảng viên</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Phí duy trì tài khoản</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {monthlyFee} credits <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 ml-1">30 ngày đầu miễn phí</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Phân chia doanh thu bán khóa học</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                Bạn giữ {100 - adminSharePercent}% <span className="text-xs font-medium text-indigo-500">({adminSharePercent}% hệ thống thu phí vận hành)</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {application?.status === "REJECTED" && (
          <p className="text-sm text-red-600">Yêu cầu trước đó đã bị từ chối. Bạn có thể gửi lại yêu cầu mới.</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="space-y-2">
          <Label htmlFor="instructor-message">Lý do muốn đăng khóa học</Label>
          <Textarea
            id="instructor-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Giới thiệu ngắn về kinh nghiệm và khóa học bạn muốn tạo"
            className="rounded-xl border-slate-200 focus:ring-blue-500"
          />
        </div>
        <Button type="submit" disabled={loading} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10">
          {loading ? "Đang gửi..." : "Gửi yêu cầu nâng cấp"}
        </Button>
      </form>
    </div>
  );
}
