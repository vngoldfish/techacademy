"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setRole(data.user.role);
        }
      });
  }, [userId]);

  async function handleSave() {
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setLoading(false);
    router.push("/admin/users");
  }

  if (!user) return <p className="p-6">Đang tải...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Chỉnh sửa người dùng</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Tên</p>
            <p className="font-medium">{user.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Vai trò</p>
            <Select value={role} onValueChange={(val) => setRole(val ?? "STUDENT")}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Học viên</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={loading}>{loading ? "Đang lưu..." : "Lưu"}</Button>
            <Button variant="outline" onClick={() => router.back()}>Hủy</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
