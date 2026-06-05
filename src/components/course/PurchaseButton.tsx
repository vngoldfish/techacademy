"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Ticket, Check, Coins, Tag, AlertCircle } from "lucide-react";

interface PurchaseButtonProps {
  courseSlug: string;
  courseId: string;
  originalPrice: number;
}

interface AppliedCoupon {
  code: string;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
}

export function PurchaseButton({ courseSlug, courseId, originalPrice }: PurchaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState("");

  // Check URL query parameters for discount code on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const couponParam = params.get("coupon");
      if (couponParam) {
        const cleaned = couponParam.trim().toUpperCase();
        setCouponInput(cleaned);
        validateCoupon(cleaned);
      }
    }
  }, []);

  const validateCoupon = async (codeStr: string) => {
    const targetCode = codeStr.trim().toUpperCase();
    if (!targetCode) {
      setCouponError("Vui lòng nhập mã giảm giá.");
      return;
    }

    setValidating(true);
    setCouponError("");
    try {
      const response = await fetch(
        `/api/coupons/validate?code=${encodeURIComponent(targetCode)}&courseId=${encodeURIComponent(courseId)}`
      );
      const data = await response.json();

      if (!response.ok || !data.valid) {
        setCouponError(data.error || "Mã giảm giá không hợp lệ.");
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.code,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          finalPrice: data.finalPrice,
        });
        toast.success(`Đã áp dụng mã giảm giá ${data.code} thành công!`);
      }
    } catch (err) {
      setCouponError("Không thể kết nối máy chủ để xác thực.");
      setAppliedCoupon(null);
    } finally {
      setValidating(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseSlug}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: appliedCoupon ? appliedCoupon.code : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          toast.error(data.error || "Không đủ credit. Vui lòng nạp thêm.");
          router.push("/profile");
          return;
        }
        throw new Error(data.error || "Có lỗi xảy ra khi mua khóa học");
      }

      toast.success(data.message || "Mua khóa học thành công!");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Display */}
      <div className="text-center bg-slate-50/50 rounded-2xl py-6 border border-slate-100">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Học phí khóa học</p>
        <div className="flex flex-col items-center justify-center gap-1">
          {appliedCoupon ? (
            <>
              <div className="flex items-center gap-2">
                <span className="line-through text-slate-400 text-sm font-semibold">
                  {formatCurrency(originalPrice)}
                </span>
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 font-bold text-[10px] px-2 py-0.5 rounded-md">
                  -{appliedCoupon.discountPercent}%
                </Badge>
              </div>
              <div className="inline-flex items-center gap-1.5 text-3xl font-black text-emerald-600">
                <Coins className="h-7 w-7 text-emerald-500 fill-emerald-500/10 shrink-0" />
                <span>{formatCurrency(appliedCoupon.finalPrice)}</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                Tiết kiệm {formatCurrency(appliedCoupon.discountAmount)} credit
              </p>
            </>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-3xl font-black text-blue-600">
              <Coins className="h-7 w-7 text-blue-500 fill-blue-500/10 shrink-0" />
              <span>{formatCurrency(originalPrice)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Coupon Input Area */}
      <div className="bg-slate-50/30 border border-slate-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-blue-500" />
            Mã giảm giá (Coupon)
          </span>
          {appliedCoupon && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs"
              onClick={() => {
                setAppliedCoupon(null);
                setCouponInput("");
              }}
            >
              Hủy áp dụng
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Nhập mã (ví dụ: GIAM50)"
            value={couponInput}
            onChange={(e) => {
              setCouponInput(e.target.value.toUpperCase());
              setCouponError("");
            }}
            disabled={loading || validating || !!appliedCoupon}
            className="bg-white rounded-xl text-xs font-semibold uppercase tracking-wider h-9"
          />
          {!appliedCoupon && (
            <Button
              size="sm"
              onClick={() => validateCoupon(couponInput)}
              disabled={loading || validating || !couponInput.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold px-4 shrink-0 h-9"
            >
              {validating ? "Đang check..." : "Áp dụng"}
            </Button>
          )}
        </div>

        {couponError && (
          <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            {couponError}
          </p>
        )}

        {appliedCoupon && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mt-1">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>Mã `{appliedCoupon.code}` đã được kích hoạt.</span>
          </div>
        )}
      </div>

      <Button
        className={`w-full py-6 rounded-xl font-bold text-white shadow-md transition-all duration-300 ${
          appliedCoupon
            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
            : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/10"
        }`}
        size="lg"
        onClick={handlePurchase}
        disabled={loading}
      >
        {loading ? "Đang xử lý..." : "Mua khóa học"}
      </Button>
    </div>
  );
}
