import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Users, ShieldAlert, UserCheck, GraduationCap, Ban, CheckCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { ImpersonateButton } from "@/components/admin/ImpersonateButton";

const roleConfig: Record<string, { label: string; icon: any; color: string }> = {
  ADMIN: { label: "Admin", icon: ShieldAlert, color: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200/50" },
  INSTRUCTOR: { label: "Giảng viên", icon: UserCheck, color: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200/50" },
  STUDENT: { label: "Học viên", icon: GraduationCap, color: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200/50" },
};

export default async function AdminUsersPage() {
  const session = await auth();
  const currentUserId = session?.user?.id;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isLocked: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
      wallet: { select: { balance: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h1>
        <p className="text-sm text-slate-500">Xem danh sách, phân quyền vai trò và quản lý thông tin thành viên hệ thống.</p>
      </div>

      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Danh sách thành viên ({users.length})</span>
          </CardTitle>
          <CardDescription>Toàn bộ tài khoản học viên, giảng viên và quản trị viên.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                  <th className="p-4 pl-6">Người dùng</th>
                  <th className="p-4">Liên hệ</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4">Số dư ví</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Khóa học đăng ký</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-right pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const rConfig = roleConfig[user.role] || { label: user.role, icon: GraduationCap, color: "bg-slate-50 text-slate-700" };
                  const Icon = rConfig.icon;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-950">{user.name ?? "—"}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">ID: {user.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-700 font-semibold">{user.email}</span>
                          {user.phone && <span className="text-xs text-slate-400 mt-0.5">{user.phone}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${rConfig.color} border font-medium inline-flex items-center gap-1 px-2.5 py-0.5 shadow-none`}>
                          <Icon className="h-3.5 w-3.5" />
                          <span>{rConfig.label}</span>
                        </Badge>
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {user.wallet?.balance ?? 0} credits
                      </td>
                      <td className="p-4">
                        {user.isLocked ? (
                          <Badge className="bg-rose-50 text-rose-700 border-rose-200/50 hover:bg-rose-100 font-medium inline-flex items-center gap-1 px-2 py-0.5 shadow-none">
                            <Ban className="h-3 w-3" />
                            <span>Bị khóa</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100 font-medium inline-flex items-center gap-1 px-2 py-0.5 shadow-none">
                            <CheckCircle className="h-3 w-3" />
                            <span>Hoạt động</span>
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-600">{user._count.enrollments} khóa</td>
                      <td className="p-4 text-xs font-medium text-slate-400">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {currentUserId !== user.id && user.role !== "ADMIN" && (
                            <ImpersonateButton userId={user.id} />
                          )}
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="py-16 text-center text-sm text-slate-400">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p>Chưa có người dùng nào đăng ký.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
