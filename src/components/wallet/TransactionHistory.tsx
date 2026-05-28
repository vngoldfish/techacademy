import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, RotateCcw } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "TOPUP" | "PURCHASE" | "REFUND";
  description: string | null;
  createdAt: Date | string;
}

const typeConfig = {
  TOPUP: { label: "Nạp credit", icon: ArrowUpCircle, color: "text-green-600", bgColor: "bg-green-50" },
  PURCHASE: { label: "Mua khóa học", icon: ArrowDownCircle, color: "text-red-600", bgColor: "bg-red-50" },
  REFUND: { label: "Hoàn credit", icon: RotateCcw, color: "text-blue-600", bgColor: "bg-blue-50" },
};

export function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-500">
          Chưa có giao dịch nào.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử giao dịch</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {transactions.map((tx) => {
            const config = typeConfig[tx.type];
            const Icon = config.icon;
            return (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${config.bgColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{config.label}</p>
                    {tx.description && (
                      <p className="text-xs text-gray-500">{tx.description}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <span className={`font-semibold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} credit
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
