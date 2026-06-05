"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteCouponButtonProps {
  id: string;
  code: string;
}

export function DeleteCouponButton({ id, code }: DeleteCouponButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Có lỗi xảy ra khi xóa.");
      }

      toast.success(`Đã xóa mã giảm giá ${code} thành công!`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể xóa mã.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          />
        }
      >
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border border-slate-200">
        <DialogHeader>
          <DialogTitle className="font-extrabold text-slate-900 text-lg">Xóa mã giảm giá</DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Bạn có chắc chắn muốn xóa mã giảm giá <strong className="text-slate-800 font-bold">`{code}`</strong>?
            Học viên sẽ không thể sử dụng mã này được nữa. Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="rounded-xl font-bold text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
          >
            {loading ? "Đang xóa..." : "Xác nhận xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
