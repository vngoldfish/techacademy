"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface CopyCouponButtonProps {
  code: string;
  courseSlug: string | null;
}

export function CopyCouponButton({ code, courseSlug }: CopyCouponButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof window === "undefined") return;

    const origin = window.location.origin;
    const url = courseSlug
      ? `${origin}/courses/${courseSlug}?coupon=${code}`
      : `${origin}/courses?coupon=${code}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Đã sao chép liên kết giới thiệu!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-8 rounded-lg text-xs font-bold flex items-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-emerald-600">Đã chép</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          <span>Sao chép link</span>
        </>
      )}
    </Button>
  );
}
