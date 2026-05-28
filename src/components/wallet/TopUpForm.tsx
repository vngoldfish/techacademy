"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const presetAmounts = [100, 200, 500, 1000];

export function TopUpForm() {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTopUp() {
    if (!selected) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selected }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi");
        setLoading(false);
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Nạp credit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          {presetAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setSelected(amount)}
              className={`rounded-lg border-2 p-4 text-center transition-colors ${
                selected === amount
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="text-lg font-bold">{amount}</p>
              <p className="text-xs text-gray-500">credit</p>
            </button>
          ))}
        </div>
        <Button className="w-full" size="lg" disabled={!selected || loading} onClick={handleTopUp}>
          {loading ? "Đang xử lý..." : selected ? `Nạp ${selected} credit qua Stripe` : "Chọn số lượng"}
        </Button>
        <p className="text-center text-xs text-gray-400">
          Thanh toán an toàn qua Stripe. 1 credit = 1.000 VND
        </p>
      </CardContent>
    </Card>
  );
}
