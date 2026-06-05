import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyCouponButton } from "@/components/admin/CopyCouponButton";
import { DeleteCouponButton } from "@/components/admin/DeleteCouponButton";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, Percent, Users, Calendar, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
    redirect("/signin");
  }

  // 1. Fetch coupons based on role
  let coupons = [];
  if (user.role === "ADMIN") {
    coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
  } else {
    coupons = await prisma.coupon.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
    });
  }

  // 2. Fetch courses to resolve course names and slugs for links
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, slug: true },
  });

  const courseMap = new Map(courses.map((c) => [c.id, { title: c.title, slug: c.slug }]));

  // 3. Compute stats
  const totalCoupons = coupons.length;
  const totalUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const activeCoupons = coupons.filter((c) => {
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    const isFullyUsed = c.usedCount >= c.maxUses;
    return !isExpired && !isFullyUsed;
  }).length;

  const formatDate = (date: Date | null) => {
    if (!date) return "Không giới hạn";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Block */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Ticket className="h-6 w-6 text-blue-600" />
            Quản lý Mã giảm giá (Coupons)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user.role === "ADMIN"
              ? "Quản trị toàn bộ hệ thống mã giảm giá thúc đẩy chuyển đổi khóa học."
              : "Tạo và chia sẻ mã giảm giá giới thiệu riêng cho các khóa học của bạn."}
          </p>
        </div>
        <Link href="/admin/coupons/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/10 h-11 px-5">
            <Plus className="h-4.5 w-4.5" />
            Tạo Coupon mới
          </Button>
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng mã giảm giá</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Ticket className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{totalCoupons}</div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Mã đã được khởi tạo</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Số lượt đã sử dụng</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{totalUses}</div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Lượt mua khóa học thành công</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Mã đang hoạt động</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{activeCoupons}</div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Còn hiệu lực và số lượng sử dụng</p>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
              <Ticket className="h-6 w-6" />
            </div>
            <div className="max-w-xs mx-auto">
              <h3 className="font-extrabold text-slate-900 text-sm">Chưa có mã giảm giá nào</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tạo mã đầu tiên để gửi tặng học viên hoặc đăng tải lên mạng xã hội nhằm tiếp thị khóa học của bạn.
              </p>
            </div>
            <Link href="/admin/coupons/new" className="inline-block">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs h-9 px-4">
                Tạo Coupon ngay
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Mã</th>
                  <th className="px-6 py-4">Tỷ lệ giảm</th>
                  <th className="px-6 py-4">Đối tượng áp dụng</th>
                  <th className="px-6 py-4">Số lượt dùng</th>
                  <th className="px-6 py-4">Hạn dùng</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                {coupons.map((coupon) => {
                  const targetCourse = coupon.courseId ? courseMap.get(coupon.courseId) : null;
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isFullyUsed = coupon.usedCount >= coupon.maxUses;
                  const active = !isExpired && !isFullyUsed;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <span className="font-mono text-xs border border-dashed border-slate-300 rounded px-2.5 py-1 bg-slate-50/50 tracking-wider">
                          {coupon.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-extrabold text-blue-600 text-base">
                        {coupon.discountPercent}%
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 max-w-[200px] truncate">
                        {targetCourse ? (
                          <span className="title" title={targetCourse.title}>
                            {targetCourse.title}
                          </span>
                        ) : (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-[10px]">
                            Toàn hệ thống
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>
                            {coupon.usedCount} / {coupon.maxUses}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({Math.round((coupon.usedCount / coupon.maxUses) * 100)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDate(coupon.expiresAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {active ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Hoạt động
                          </Badge>
                        ) : isExpired ? (
                          <Badge className="bg-rose-500 hover:bg-rose-500 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Hết hạn
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Hết lượt
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <CopyCouponButton code={coupon.code} courseSlug={targetCourse?.slug ?? null} />
                          <DeleteCouponButton id={coupon.id} code={coupon.code} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
