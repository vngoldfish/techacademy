import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TransactionHistory } from "@/components/wallet/TransactionHistory";
import { TopUpForm } from "@/components/wallet/TopUpForm";
import { Separator } from "@/components/ui/separator";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const wallet = await prisma.creditWallet.findUnique({
    where: { userId: session.user.id },
    select: {
      balance: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ví credit</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <WalletBalance balance={wallet?.balance ?? 0} />
        <TopUpForm />
      </div>
      <Separator className="my-6" />
      <TransactionHistory transactions={wallet?.transactions ?? []} />
    </div>
  );
}
