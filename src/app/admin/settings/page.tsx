"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, Percent, Landmark, HelpCircle, Save, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    CREDIT_PRICE_VND: 1000,
    MIN_TOPUP_CREDIT: 100,
    MAX_TOPUP_CREDIT: 10000,
    INSTRUCTOR_MONTHLY_FEE: 200,
    ADMIN_REVENUE_SHARE_PERCENT: 30,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let active = true;
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error("Không thể tải cấu hình");
        const data = await res.json();
        if (active && data.settings) {
          setSettings({
            CREDIT_PRICE_VND: parseInt(data.settings.CREDIT_PRICE_VND, 10),
            MIN_TOPUP_CREDIT: parseInt(data.settings.MIN_TOPUP_CREDIT, 10),
            MAX_TOPUP_CREDIT: parseInt(data.settings.MAX_TOPUP_CREDIT, 10),
            INSTRUCTOR_MONTHLY_FEE: parseInt(data.settings.INSTRUCTOR_MONTHLY_FEE, 10),
            ADMIN_REVENUE_SHARE_PERCENT: parseInt(data.settings.ADMIN_REVENUE_SHARE_PERCENT, 10),
          });
        }
      } catch (err: any) {
        if (active) setErrorMsg(err.message || "Đã xảy ra lỗi");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchSettings();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lưu cấu hình thất bại");

      setSuccessMsg("Cập nhật tất cả cấu hình hệ thống thành công!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Đang tải cấu hình hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cấu hình hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản lý tài chính, giá credit, phí bản quyền giảng viên và tỷ lệ ăn chia doanh thu bán khóa học.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {successMsg && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/50 p-4 text-sm font-semibold text-emerald-800 shadow-sm">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200/50 p-4 text-sm font-semibold text-rose-800 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Section 1: Financial & Credits */}
        <Card className="border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Coins className="h-5 w-5 text-blue-600" />
              Cấu hình Ví & Nạp tiền (Credit Settings)
            </CardTitle>
            <CardDescription>Cấu hình tỷ giá quy đổi tiền mặt sang credit và hạn mức giao dịch ví điện tử.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price-vnd" className="text-xs font-bold text-slate-600">Giá 1 Credit (VND)</Label>
              <div className="relative">
                <Input
                  id="price-vnd"
                  type="number"
                  value={settings.CREDIT_PRICE_VND}
                  onChange={(e) => setSettings({ ...settings, CREDIT_PRICE_VND: Number(e.target.value) })}
                  className="rounded-xl border-slate-200 pl-3 pr-12 text-sm font-semibold"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">đ</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-topup" className="text-xs font-bold text-slate-600">Nạp tối thiểu (Credit)</Label>
              <Input
                id="min-topup"
                type="number"
                value={settings.MIN_TOPUP_CREDIT}
                onChange={(e) => setSettings({ ...settings, MIN_TOPUP_CREDIT: Number(e.target.value) })}
                className="rounded-xl border-slate-200 text-sm font-semibold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-topup" className="text-xs font-bold text-slate-600">Nạp tối đa (Credit)</Label>
              <Input
                id="max-topup"
                type="number"
                value={settings.MAX_TOPUP_CREDIT}
                onChange={(e) => setSettings({ ...settings, MAX_TOPUP_CREDIT: Number(e.target.value) })}
                className="rounded-xl border-slate-200 text-sm font-semibold"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Instructor Membership & Revenue Share */}
        <Card className="border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-indigo-600" />
              Chế độ Giảng viên & Phân chia Doanh thu
            </CardTitle>
            <CardDescription>Thiết lập chi phí duy trì tài khoản giảng viên hàng tháng và phân chia % doanh thu bán khóa học.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthly-fee" className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  Phí Giảng viên hàng tháng
                  <span title="Số lượng credit giảng viên phải trả mỗi 30 ngày để giữ tài khoản hoạt động">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="monthly-fee"
                    type="number"
                    value={settings.INSTRUCTOR_MONTHLY_FEE}
                    onChange={(e) => setSettings({ ...settings, INSTRUCTOR_MONTHLY_FEE: Number(e.target.value) })}
                    className="rounded-xl border-slate-200 pr-16 text-sm font-semibold"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">credit</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue-share" className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  Tỷ lệ doanh thu nộp Admin (%)
                  <span title="Phần trăm giá bán khóa học sẽ tự động được cộng vào ví của tài khoản Admin hệ thống khi học viên mua khóa học">
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="revenue-share"
                    type="number"
                    min={0}
                    max={100}
                    value={settings.ADMIN_REVENUE_SHARE_PERCENT}
                    onChange={(e) => setSettings({ ...settings, ADMIN_REVENUE_SHARE_PERCENT: Number(e.target.value) })}
                    className="rounded-xl border-slate-200 pr-12 text-sm font-semibold"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold"><Percent className="h-3 w-3" /></span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-50 bg-blue-50/30 p-5 space-y-2 text-sm text-slate-600 leading-relaxed font-medium">
              <span className="font-bold text-blue-900 block mb-1">💡 Cơ chế phân phối doanh thu hiện tại:</span>
              <p>
                • Khi học viên mua khóa học trị giá <strong className="text-slate-900">1,000 credit</strong> của một giảng viên.
              </p>
              <p>
                • Tài khoản <strong className="text-blue-700">Admin</strong> hệ thống sẽ nhận được:{" "}
                <strong className="text-slate-900">{(1000 * settings.ADMIN_REVENUE_SHARE_PERCENT) / 100} credit</strong> ({settings.ADMIN_REVENUE_SHARE_PERCENT}%).
              </p>
              <p>
                • Tài khoản <strong className="text-indigo-700">Giảng viên</strong> sở hữu khóa học sẽ nhận được:{" "}
                <strong className="text-slate-900">{1000 - (1000 * settings.ADMIN_REVENUE_SHARE_PERCENT) / 100} credit</strong> ({100 - settings.ADMIN_REVENUE_SHARE_PERCENT}%).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={saving} 
            className="rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-md shadow-blue-500/10 px-6 py-4 flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                Đang lưu cấu hình...
              </>
            ) : (
              <>
                <Save className="h-4.5 w-4.5" />
                Lưu cấu hình hệ thống
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
