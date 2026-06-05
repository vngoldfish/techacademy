"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Ticket, Save, Calendar, Percent, Users, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CourseOption {
  id: string;
  title: string;
}

interface CouponFormProps {
  courses: CourseOption[];
  userRole: string;
}

export function CouponForm({ courses, userRole }: CouponFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    code: "",
    discountPercent: 30,
    maxUses: 100,
    expiresAt: "",
    courseId: "",
  });

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.code.trim()) {
      tempErrors.code = "Mã giảm giá không được để trống.";
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code.trim().toUpperCase())) {
      tempErrors.code = "Mã chỉ gồm chữ cái viết hoa, số, dấu gạch ngang (-) hoặc gạch dưới (_).";
    }

    if (formData.discountPercent < 10 || formData.discountPercent > 90) {
      tempErrors.discountPercent = "Tỷ lệ giảm giá phải từ 10% đến 90%.";
    }

    if (formData.maxUses <= 0) {
      tempErrors.maxUses = "Số lượt sử dụng phải lớn hơn 0.";
    }

    if (formData.expiresAt) {
      const expDate = new Date(formData.expiresAt);
      if (expDate <= new Date()) {
        tempErrors.expiresAt = "Ngày hết hạn phải ở tương lai.";
      }
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code.trim().toUpperCase(),
          discountPercent: formData.discountPercent,
          maxUses: formData.maxUses,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
          courseId: formData.courseId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Không thể tạo mã giảm giá.");
      }

      toast.success("Tạo mã giảm giá thành công!");
      router.push("/admin/coupons");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi hệ thống.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/admin/coupons"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại danh sách
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-blue-600" />
            Biểu mẫu tạo mã giảm giá
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Điền đầy đủ thông tin bên dưới để phát hành mã coupon mới.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Code */}
          <div className="space-y-1.5">
            <Label htmlFor="code" className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Mã giảm giá
            </Label>
            <Input
              id="code"
              placeholder="ví dụ: GIAM50, HELLOSUMMER"
              value={formData.code}
              onChange={(e) => {
                setFormData({ ...formData, code: e.target.value.toUpperCase() });
                if (errors.code) setErrors({ ...errors, code: "" });
              }}
              disabled={loading}
              className="bg-white rounded-xl text-sm font-semibold uppercase tracking-wider h-11"
            />
            {errors.code ? (
              <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.code}
              </p>
            ) : (
              <p className="text-[10px] text-slate-400 font-semibold">
                Mã viết liền không dấu, không chứa ký tự đặc biệt trừ gạch ngang (-) và gạch dưới (_).
              </p>
            )}
          </div>

          {/* Grid for Discount and Max Uses */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Discount Percent */}
            <div className="space-y-1.5">
              <Label htmlFor="discountPercent" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Percent className="h-3.5 w-3.5 text-blue-500" />
                Tỷ lệ giảm giá (%)
              </Label>
              <Input
                id="discountPercent"
                type="number"
                min="10"
                max="90"
                value={formData.discountPercent}
                onChange={(e) => {
                  setFormData({ ...formData, discountPercent: parseInt(e.target.value, 10) || 0 });
                  if (errors.discountPercent) setErrors({ ...errors, discountPercent: "" });
                }}
                disabled={loading}
                className="bg-white rounded-xl text-sm font-semibold h-11"
              />
              {errors.discountPercent ? (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.discountPercent}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold">Tỷ lệ được chấp nhận từ 10% đến 90%.</p>
              )}
            </div>

            {/* Max Uses */}
            <div className="space-y-1.5">
              <Label htmlFor="maxUses" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-emerald-500" />
                Lượt sử dụng tối đa
              </Label>
              <Input
                id="maxUses"
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => {
                  setFormData({ ...formData, maxUses: parseInt(e.target.value, 10) || 0 });
                  if (errors.maxUses) setErrors({ ...errors, maxUses: "" });
                }}
                disabled={loading}
                className="bg-white rounded-xl text-sm font-semibold h-11"
              />
              {errors.maxUses ? (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.maxUses}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold">Giới hạn tổng lượt sử dụng trên hệ thống.</p>
              )}
            </div>
          </div>

          {/* Grid for Expiry and Target Course */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Expiry Date */}
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-500" />
                Ngày hết hạn (Tùy chọn)
              </Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => {
                  setFormData({ ...formData, expiresAt: e.target.value });
                  if (errors.expiresAt) setErrors({ ...errors, expiresAt: "" });
                }}
                disabled={loading}
                className="bg-white rounded-xl text-sm font-semibold h-11"
              />
              {errors.expiresAt ? (
                <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  {errors.expiresAt}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-semibold">Bỏ trống nếu không giới hạn ngày sử dụng.</p>
              )}
            </div>

            {/* Target Course */}
            <div className="space-y-1.5">
              <Label htmlFor="courseId" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Khóa học áp dụng
              </Label>
              <select
                id="courseId"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                disabled={loading}
                className="flex w-full rounded-xl border border-input bg-white px-3 h-11 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-slate-800"
              >
                {userRole === "ADMIN" && <option value="">Toàn bộ hệ thống (Tất cả khóa học)</option>}
                {courses.length === 0 ? (
                  <option value="" disabled>
                    Không có khóa học khả dụng
                  </option>
                ) : (
                  <>
                    {userRole !== "ADMIN" && <option value="" disabled>-- Chọn khóa học --</option>}
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <p className="text-[10px] text-slate-400 font-semibold">
                {userRole === "ADMIN"
                  ? "Chọn khóa học cụ thể hoặc để trống để áp dụng cho mọi khóa học."
                  : "Giảng viên chỉ có thể tạo mã áp dụng cho khóa học của chính mình."}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
            <Link href="/admin/coupons">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="rounded-xl font-bold text-xs h-10 px-4"
              >
                Hủy bỏ
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 h-10 px-5 shadow-md shadow-blue-500/10"
            >
              <Save className="h-4 w-4" />
              {loading ? "Đang lưu..." : "Lưu mã giảm giá"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
