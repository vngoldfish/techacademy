"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";

interface InstructorSubscriptionPanelProps {
  instructorActive: boolean;
  instructorExpiresAt: Date | null;
  monthlyFee: number;
  adminSharePercent: number;
}

export function InstructorSubscriptionPanel({
  instructorActive,
  instructorExpiresAt,
  monthlyFee,
  adminSharePercent,
}: InstructorSubscriptionPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const now = new Date();
  const expiresAt = instructorExpiresAt ? new Date(instructorExpiresAt) : null;
  const isExpired = !expiresAt || expiresAt < now;
  const isActive = instructorActive && !isExpired;

  async function handleRenew() {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/instructor/renew", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gia hạn thất bại");

      setMessage(data.message || "Gia hạn tài khoản thành công!");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border bg-slate-50/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái tài khoản:</span>
            {isActive ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-0.5 shadow-sm">
                <CheckCircle2 className="h-3 w-3" />
                Hoạt động
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-2 py-0.5 shadow-sm animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                {isExpired ? "Hết hạn" : "Chưa kích hoạt"}
              </span>
            )}
          </div>
          
          {expiresAt && (
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 pt-1">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Hạn đăng ký: <strong className="text-slate-900">{expiresAt.toLocaleDateString("vi-VN")}</strong></span>
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-semibold pt-1">
            <p>
              Chi phí duy trì: <strong className="text-blue-600">{monthlyFee} credit</strong> / 30 ngày
            </p>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <p>
              Chia sẻ doanh thu: <strong className="text-indigo-600">Bạn giữ {100 - adminSharePercent}%</strong> (Hệ thống {adminSharePercent}%)
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Button
            onClick={handleRenew}
            disabled={loading}
            className={`rounded-xl font-bold shadow-md px-5 py-3 flex items-center gap-2 ${
              isActive 
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-950/10" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                {isActive ? "Gia hạn thêm 30 ngày" : "Kích hoạt tài khoản"}
              </>
            )}
          </Button>
        </div>
      </div>

      {message && (
        <p className="text-sm font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-center">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm font-bold text-rose-600 bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
