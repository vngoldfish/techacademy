import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface WalletBalanceProps {
  balance: number;
}

export function WalletBalance({ balance }: WalletBalanceProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">Số dư credit</CardTitle>
        <Wallet className="h-5 w-5 text-blue-600" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-blue-600">{formatCurrency(balance)}</p>
        <p className="mt-1 text-xs text-gray-400">1 credit = 1.000 VND</p>
      </CardContent>
    </Card>
  );
}
