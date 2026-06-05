"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PurchaseButtonProps {
  courseSlug: string;
}

export function PurchaseButton({ courseSlug }: PurchaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseSlug}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    <Button
      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/10"
      size="lg"
      onClick={handlePurchase}
      disabled={loading}
    >
      {loading ? "Đang xử lý..." : "Mua khóa học"}
    </Button>
  );
}
