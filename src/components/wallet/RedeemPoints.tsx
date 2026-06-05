"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Award, RefreshCw, Star, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface RedeemPointsProps {
  points: number;
  pointsEarned: number;
}

export function RedeemPoints({ points: initialPoints, pointsEarned }: RedeemPointsProps) {
  const router = useRouter();
  const [points, setPoints] = useState(initialPoints);
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (redeemAmount < 100) {
      toast.error("Số điểm quy đổi tối thiểu là 100 điểm");
      return;
    }
    if (redeemAmount % 100 !== 0) {
      toast.error("Số điểm quy đổi phải là bội số của 100");
      return;
    }
    if (points < redeemAmount) {
      toast.error("Bạn không đủ điểm thưởng để thực hiện quy đổi");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/wallet/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: redeemAmount }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Quy đổi điểm thất bại");
      }

      toast.success(data.message || `Đổi thành công ${redeemAmount} điểm!`);
      setPoints(data.points);
      // Reset input to 100 or max possible
      setRedeemAmount(Math.min(100, data.points));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Đã xảy ra lỗi khi quy đổi điểm.");
    } finally {
      setLoading(false);
    }
  };

  const calculatedCredits = Math.floor(redeemAmount / 10);

  return (
    <Card className="border border-amber-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white via-white to-amber-50/20 rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Award className="h-4.5 w-4.5 text-amber-500" />
            Điểm thưởng tích lũy
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-400 font-medium">Tích lũy từ việc mua khóa học & học bài</CardDescription>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xl font-black text-amber-500 flex items-center gap-0.5">
            {points.toLocaleString()}
            <Star className="h-4 w-4 fill-amber-500 text-amber-500 animate-pulse" />
          </span>
          <span className="text-[9px] text-slate-400 font-medium mt-0.5">Tổng tích lũy: {pointsEarned.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <form onSubmit={handleRedeem} className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label htmlFor="redeem-amount" className="text-slate-600 font-bold">Số điểm đổi</Label>
              <button 
                type="button" 
                onClick={() => setRedeemAmount(Math.floor(points / 100) * 100)}
                disabled={points < 100}
                className="text-amber-600 hover:text-amber-700 hover:underline font-bold disabled:opacity-50 text-[10px]"
              >
                Đổi tối đa
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                id="redeem-amount"
                type="number"
                min={100}
                max={Math.floor(points / 100) * 100}
                step={100}
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(parseInt(e.target.value, 10) || 0)}
                disabled={loading || points < 100}
                className="h-9 text-xs rounded-xl border-slate-200 w-full focus-visible:ring-amber-500"
              />
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold gap-1.5 select-none min-w-[100px]">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                <span className="text-emerald-600">+{calculatedCredits} Cr</span>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading || points < 100 || redeemAmount > points}
            className="w-full h-9 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
          >
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Quy đổi điểm thưởng"
            )}
          </Button>
          <p className="text-[9px] text-center text-slate-400 font-semibold leading-relaxed">
            Tỷ lệ quy đổi: 10 điểm = 1 Credit (Tối thiểu 100 điểm).
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
