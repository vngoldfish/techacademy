import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { TopUpForm } from "@/components/wallet/TopUpForm";
import { RedeemPoints } from "@/components/wallet/RedeemPoints";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InstructorApplicationForm } from "./InstructorApplicationForm";
import { InstructorSubscriptionPanel } from "./InstructorSubscriptionPanel";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const [wallet, application, dbUser, feeSetting, shareSetting] = await Promise.all([
    prisma.creditWallet.findUnique({
      where: { userId: session.user.id },
      select: {
        balance: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
    prisma.instructorApplication.findUnique({
      where: { userId: session.user.id },
      select: { status: true, message: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, instructorActive: true, instructorExpiresAt: true, points: true, pointsEarned: true },
    }),
    prisma.setting.findUnique({
      where: { key: "INSTRUCTOR_MONTHLY_FEE" },
    }),
    prisma.setting.findUnique({
      where: { key: "ADMIN_REVENUE_SHARE_PERCENT" },
    }),
  ]);

  const monthlyFee = feeSetting ? parseInt(feeSetting.value, 10) : 200;
  const adminSharePercent = shareSetting ? parseInt(shareSetting.value, 10) : 30;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ví credit</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <WalletBalance balance={wallet?.balance ?? 0} />
        <RedeemPoints points={dbUser?.points ?? 0} pointsEarned={dbUser?.pointsEarned ?? 0} />
        <TopUpForm />
      </div>
      <Separator className="my-6" />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Đăng ký đăng khóa học & Thành viên</CardTitle>
        </CardHeader>
        <CardContent>
          {dbUser?.role === "ADMIN" ? (
            <p className="text-sm text-green-700 font-semibold">Tài khoản của bạn là Quản trị viên (Admin), có toàn quyền quản lý hệ thống.</p>
          ) : dbUser?.role === "INSTRUCTOR" ? (
            <InstructorSubscriptionPanel
              instructorActive={dbUser.instructorActive}
              instructorExpiresAt={dbUser.instructorExpiresAt}
              monthlyFee={monthlyFee}
              adminSharePercent={adminSharePercent}
            />
          ) : (
            <InstructorApplicationForm
              application={application}
              monthlyFee={monthlyFee}
              adminSharePercent={adminSharePercent}
            />
          )}
        </CardContent>
      </Card>
      <TransactionHistory transactions={wallet?.transactions ?? []} />
    </div>
  );
}
