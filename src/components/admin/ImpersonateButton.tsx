"use client";

import { useState } from "react";
import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImpersonateButtonProps {
  userId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
}

export function ImpersonateButton({ userId, variant = "outline", size = "sm" }: ImpersonateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Có lỗi xảy ra khi truy cập tài khoản");
      }

      toast.success("Đang chuyển hướng...");
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleImpersonate}
      disabled={loading}
      className="flex items-center gap-1.5"
    >
      <UserCheck className="size-4" />
      <span>Truy cập</span>
    </Button>
  );
}
