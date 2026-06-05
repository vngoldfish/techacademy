"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ban, ShieldCheck } from "lucide-react";
import { ImpersonateButton } from "@/components/admin/ImpersonateButton";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  dateOfBirth: string | null;
  isLocked: boolean;
  instructorActive?: boolean;
  instructorExpiresAt?: string | null;
  wallet?: {
    balance: number;
  };
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<AdminUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [role, setRole] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [instructorActive, setInstructorActive] = useState(false);
  const [instructorExpiresAt, setInstructorExpiresAt] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSelf, setIsSelf] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name ?? "");
          setEmail(data.user.email ?? "");
          setPhone(data.user.phone ?? "");
          setDateOfBirth(data.user.dateOfBirth ? new Date(data.user.dateOfBirth).toISOString().split('T')[0] : "");
          setRole(data.user.role);
          setIsLocked(data.user.isLocked ?? false);
          setInstructorActive(data.user.instructorActive ?? false);
          setInstructorExpiresAt(data.user.instructorExpiresAt ? new Date(data.user.instructorExpiresAt).toISOString().split('T')[0] : "");
          setWalletBalance(data.user.wallet?.balance ?? 0);
          setIsSelf(data.isSelf ?? false);
        }
      });
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          dateOfBirth: dateOfBirth || null,
          role,
          isLocked,
          walletBalance: Number(walletBalance),
          instructorActive,
          instructorExpiresAt: instructorExpiresAt || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Đã xảy ra lỗi");
        setLoading(false);
        return;
      }

      setLoading(false);
      router.push("/admin/users");
    } catch {
      setError("Đã xảy ra lỗi khi lưu thông tin");
      setLoading(false);
    }
  }

  if (!user) return <p className="p-6 text-slate-500 font-medium">Đang tải thông tin...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa người dùng</h1>
          <p className="text-sm text-slate-500 mt-1">Cập nhật thông tin chi tiết và cài đặt trạng thái tài khoản.</p>
        </div>
        <div className="flex items-center gap-3">
          {user.role !== "ADMIN" && (
            <ImpersonateButton userId={user.id} />
          )}
          {isLocked ? (
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-xl">
              <Ban className="h-3.5 w-3.5" />
              <span>Đã bị khóa</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Hoạt động</span>
            </span>
          )}
        </div>
      </div>

      <Card className="border border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            {error && <div className="rounded-lg bg-red-50 p-3.5 text-sm font-medium text-red-600 border border-red-100">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold text-slate-700">Họ và tên</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-semibold text-slate-700">Email đăng nhập</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold text-slate-700">Số điện thoại</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại..." className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob" className="font-semibold text-slate-700">Ngày sinh</Label>
              <Input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletBalance" className="font-semibold text-slate-700">Số dư ví (Credits)</Label>
              <Input id="walletBalance" type="number" value={walletBalance} onChange={(e) => setWalletBalance(Number(e.target.value))} min={0} className="rounded-xl border-slate-200 focus:ring-blue-500" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="font-semibold text-slate-700">Vai trò / Phân quyền</Label>
              <Select value={role} onValueChange={(val) => setRole(val || "STUDENT")} disabled={isSelf}>
                <SelectTrigger className="w-full bg-white border-slate-200 rounded-xl">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Học viên (Student)</SelectItem>
                  <SelectItem value="INSTRUCTOR">Giảng viên (Instructor)</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên (Admin)</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && <p className="text-xs text-amber-600 font-medium mt-1">Bạn không thể tự thay đổi vai trò của chính mình.</p>}
            </div>

            {/* Instructor Override Option */}
            {role === "INSTRUCTOR" && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-blue-600" />
                  Cấu hình quyền Giảng viên
                </h3>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="instructorActive"
                    checked={instructorActive}
                    onChange={(e) => setInstructorActive(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <Label htmlFor="instructorActive" className="font-semibold text-slate-700 cursor-pointer">
                      Kích hoạt quyền Giảng viên (Active)
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">Giảng viên có thể đăng khóa học và nhận doanh thu từ người mua.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instructorExpiresAt" className="text-xs font-semibold text-slate-600">
                    Ngày hết hạn quyền Giảng viên
                  </Label>
                  <Input
                    id="instructorExpiresAt"
                    type="date"
                    value={instructorExpiresAt}
                    onChange={(e) => setInstructorExpiresAt(e.target.value)}
                    className="rounded-xl border-slate-200 bg-white focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-400">Để trống nếu không giới hạn hoặc muốn hủy kích hoạt thời gian.</p>
                </div>
              </div>
            )}

            {/* Lock Account Option */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isLocked"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor="isLocked" className="font-bold text-rose-600 cursor-pointer flex items-center gap-1.5">
                    <Ban className="h-4 w-4" />
                    <span>Khóa tài khoản này</span>
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">Người dùng sẽ bị chặn, không thể đăng nhập hoặc mua khóa học trên hệ thống.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 font-medium shadow-md shadow-blue-500/10">
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl px-5 py-2.5">Hủy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
