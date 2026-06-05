"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash } from "lucide-react";

interface BlogDeleteButtonProps {
  postId: string;
}

export default function BlogDeleteButton({ postId }: BlogDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${postId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa bài viết");
      }

      toast.success("Đã xóa bài viết thành công!");
      router.push("/blog");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Đã xảy ra lỗi khi xóa bài viết");
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="rounded-lg shadow-sm font-medium px-3 py-1.5 flex items-center gap-1 cursor-pointer"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash className="h-4 w-4" />
      <span>{loading ? "Đang xóa..." : "Xóa bài"}</span>
    </Button>
  );
}
