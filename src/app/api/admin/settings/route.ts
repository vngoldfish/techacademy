import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const settingsSchema = z.object({
  CREDIT_PRICE_VND: z.coerce.number().int().min(1, "Giá credit phải lớn hơn 0"),
  MIN_TOPUP_CREDIT: z.coerce.number().int().min(1, "Nạp tối thiểu phải lớn hơn 0"),
  MAX_TOPUP_CREDIT: z.coerce.number().int().min(1, "Nạp tối đa phải lớn hơn 0"),
  INSTRUCTOR_MONTHLY_FEE: z.coerce.number().int().min(0, "Phí hàng tháng không được âm"),
  ADMIN_REVENUE_SHARE_PERCENT: z.coerce.number().int().min(0, "Phần trăm từ 0 đến 100").max(100, "Phần trăm từ 0 đến 100"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.setting.findMany();
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  // Fill in default values if not present
  const data = {
    CREDIT_PRICE_VND: settingsMap["CREDIT_PRICE_VND"] || "1000",
    MIN_TOPUP_CREDIT: settingsMap["MIN_TOPUP_CREDIT"] || "100",
    MAX_TOPUP_CREDIT: settingsMap["MAX_TOPUP_CREDIT"] || "10000",
    INSTRUCTOR_MONTHLY_FEE: settingsMap["INSTRUCTOR_MONTHLY_FEE"] || "200",
    ADMIN_REVENUE_SHARE_PERCENT: settingsMap["ADMIN_REVENUE_SHARE_PERCENT"] || "30",
  };

  return NextResponse.json({ settings: data });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = settingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const updates = Object.entries(result.data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await prisma.$transaction(updates);
    return NextResponse.json({ success: true, message: "Cập nhật cấu hình thành công" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Đã xảy ra lỗi" }, { status: 500 });
  }
}
