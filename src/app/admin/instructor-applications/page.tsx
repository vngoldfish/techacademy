"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, XCircle, ShieldAlert, Award, Calendar, Mail, FileText, ArrowRight } from "lucide-react";

type Application = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { name: string | null; email: string; role: string };
  reviewer: { name: string | null; email: string } | null;
};

const statusConfig = {
  PENDING: { label: "Chờ duyệt", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-200/50", leftBorder: "border-l-amber-500" },
  APPROVED: { label: "Đã duyệt", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 border-emerald-200/50", leftBorder: "border-l-emerald-500" },
  REJECTED: { label: "Từ chối", icon: XCircle, color: "bg-rose-50 text-rose-700 border-rose-200/50", leftBorder: "border-l-rose-500" },
};

export default function InstructorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState("PENDING");
  const [loadingId, setLoadingId] = useState("");

  async function loadApplications(nextStatus = status) {
    const res = await fetch(`/api/admin/instructor-applications?status=${nextStatus}`);
    const data = await res.json();
    setApplications(data.applications ?? []);
  }

  useEffect(() => {
    loadApplications(status);
  }, [status]);

  async function review(id: string, action: "APPROVE" | "REJECT") {
    const confirmed = window.confirm(action === "APPROVE" ? "Duyệt yêu cầu nâng cấp này?" : "Từ chối yêu cầu nâng cấp này?");
    if (!confirmed) return;

    setLoadingId(id);
    const res = await fetch(`/api/admin/instructor-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoadingId("");

    if (res.ok) {
      loadApplications();
    } else {
      const data = await res.json();
      alert(data.error || "Không thể xử lý yêu cầu");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nâng cấp Giảng viên</h1>
          <p className="text-sm text-slate-500">Xem và xét duyệt các đơn ứng tuyển làm giảng viên của học viên.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase">Lọc đơn:</span>
          <Select value={status} onValueChange={(val) => setStatus(val || "PENDING")}>
            <SelectTrigger className="w-44 bg-white rounded-xl border-slate-200 text-sm font-medium shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Đã từ chối</SelectItem>
              <SelectItem value="ALL">Tất cả yêu cầu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {applications.map((app) => {
          const config = statusConfig[app.status] || { label: app.status, icon: Clock, color: "bg-slate-50 text-slate-600 border-slate-200", leftBorder: "border-l-slate-400" };
          const Icon = config.icon;
          return (
            <Card key={app.id} className={`border border-slate-100 shadow-sm border-l-4 ${config.leftBorder} hover:shadow-md transition-shadow overflow-hidden`}>
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                        {app.user.name ? app.user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-950">{app.user.name ?? "Chưa đặt tên"}</span>
                        <span className="text-xs text-slate-500 font-medium">{app.user.email}</span>
                      </div>
                    </div>
                    
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100/80 text-sm text-slate-700 leading-relaxed font-medium">
                      <span className="text-xs font-semibold text-slate-400 block mb-1">Thư ứng tuyển:</span>
                      {app.message || "Không để lại lời nhắn."}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Ngày nộp: {new Date(app.createdAt).toLocaleDateString("vi-VN")}</span>
                      </span>
                      {app.reviewer && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Duyệt bởi: {app.reviewer.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center lg:flex-col lg:items-end justify-between lg:justify-start gap-4 shrink-0 border-t border-slate-50 pt-4 lg:border-t-0 lg:pt-0">
                    <Badge className={`${config.color} border font-medium px-2.5 py-0.5 inline-flex items-center gap-1 shadow-none`}>
                      <Icon className="h-3.5 w-3.5" />
                      <span>{config.label}</span>
                    </Badge>
                    
                    {app.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => review(app.id, "APPROVE")} 
                          disabled={loadingId === app.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm font-medium px-3.5 py-1.5"
                        >
                          Duyệt đơn
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => review(app.id, "REJECT")} 
                          disabled={loadingId === app.id}
                          className="border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-lg font-medium px-3.5 py-1.5"
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {applications.length === 0 && (
          <Card className="border border-dashed border-slate-200">
            <CardContent className="p-16 text-center text-slate-400">
              <Award className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p>Không có yêu cầu nâng cấp nào trong bộ lọc này.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
