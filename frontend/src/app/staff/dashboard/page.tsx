"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Ticket,
  MessageSquare,
  BarChart3,
  Users,
  BookOpen,
  ArrowUpRight,
  Bot,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Shield
} from "lucide-react";

export default function StaffDashboardPage() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:8080/api/support/dashboard/stats",
      );
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalTickets: data.totalTickets ?? 0,
          openTickets: data.openTickets ?? 0,
          inProgressTickets: data.inProgressTickets ?? 0,
          resolvedTickets: data.resolvedTickets ?? 0,
        });
        setLastUpdated(
          new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        );
      }
    } catch (err) {
      console.error("Không thể tải thống kê thời gian thực:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const total = stats.totalTickets || 1;
  const newPercent = Math.round((stats.openTickets / total) * 100);
  const inProgressPercent = Math.round((stats.inProgressTickets / total) * 100);
  const resolvedPercent = Math.round((stats.resolvedTickets / total) * 100);

  return (
    <ProtectedRoute>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* TOP HEADER & ACTIONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Trung tâm Điều phối CSKH
              </span>
              {lastUpdated && (
                <span className="text-xs text-slate-400 font-medium">
                  Cập nhật lúc: {lastUpdated}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Tổng quan hoạt động Contact Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi tiến độ yêu cầu, tải công việc chuyên viên và chỉ số chất lượng dịch vụ
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 shadow-2xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                size={15}
                className={
                  loading ? "animate-spin text-blue-600" : "text-slate-400"
                }
              />
              <span>{loading ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}</span>
            </button>
            <Link
              href="/staff/tickets"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition active:scale-95"
            >
              <Ticket size={15} />
              <span>Xem Hộp Thư Ticket</span>
            </Link>
          </div>
        </div>

        {/* 4 STAT METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* THẺ 1: Tổng Ticket */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-200 hover:shadow-sm transition group relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tổng yêu cầu
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <Inbox size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.totalTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Toàn bộ các kênh hỗ trợ</span>
              <span className="font-bold text-blue-600">100%</span>
            </div>
          </div>

          {/* THẺ 2: Mới tiếp nhận */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-200 hover:shadow-sm transition group relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Mới / Chờ xử lý
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-blue-700 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.openTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Cần phân công xử lý</span>
              <span className="font-bold text-blue-700">{newPercent}%</span>
            </div>
          </div>

          {/* THẺ 3: Đang xử lý */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-200 hover:shadow-sm transition group relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Đang xử lý
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-amber-600 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.inProgressTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Chuyên viên đang tư vấn</span>
              <span className="font-bold text-amber-600">
                {inProgressPercent}%
              </span>
            </div>
          </div>

          {/* THẺ 4: Đã hoàn tất */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-200 hover:shadow-sm transition group relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Đã giải quyết
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-emerald-600 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.resolvedTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tỷ lệ hoàn thành</span>
              <span className="font-bold text-emerald-600">
                {resolvedPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* HÀNG 2: TIẾN ĐỘ XỬ LÝ & TRUY CẬP NHANH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT 1 & 2: PHÂN BỐ VÀ TIẾN ĐỘ XỬ LÝ */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base md:text-lg">
                  Phân bố trạng thái và Tỷ lệ xử lý
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Tỷ lệ hoàn thành trên tổng số {stats.totalTickets} yêu cầu đã tiếp nhận
                </p>
              </div>
              <span className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                {stats.totalTickets} Ticket
              </span>
            </div>

            {/* THANH SEGMENTED TOÀN CẢNH */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-700">
                <span>Tiến trình giải quyết chung</span>
                <span className="font-bold text-blue-700">
                  {resolvedPercent}% hoàn thành
                </span>
              </div>
              <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                <div
                  className="bg-emerald-500 rounded-l-full transition-all duration-500"
                  style={{ width: `${Math.max(0, resolvedPercent)}%` }}
                  title={`Đã giải quyết: ${stats.resolvedTickets}`}
                />
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${Math.max(0, inProgressPercent)}%` }}
                  title={`Đang xử lý: ${stats.inProgressTickets}`}
                />
                <div
                  className="bg-blue-500 rounded-r-full transition-all duration-500"
                  style={{ width: `${Math.max(0, newPercent)}%` }}
                  title={`Chờ xử lý: ${stats.openTickets}`}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Đã xử lý ({stats.resolvedTickets})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Đang hỗ trợ ({stats.inProgressTickets})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Chờ tiếp nhận ({stats.openTickets})</span>
                </div>
              </div>
            </div>

            {/* CÁC THANH CHI TIẾT */}
            <div className="space-y-3.5 pt-2">
              {/* NEW */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="font-bold text-slate-800">
                      Mới tiếp nhận (Chờ điều phối L14)
                    </span>
                  </div>
                  <span className="font-extrabold text-blue-700">
                    {stats.openTickets} ({newPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, newPercent))}%`,
                    }}
                  />
                </div>
              </div>

              {/* IN PROGRESS */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-slate-800">
                      Đang trao đổi & xử lý
                    </span>
                  </div>
                  <span className="font-extrabold text-amber-600">
                    {stats.inProgressTickets} ({inProgressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, inProgressPercent))}%`,
                    }}
                  />
                </div>
              </div>

              {/* RESOLVED */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-bold text-slate-800">
                      Đã giải quyết hoàn tất (L13 / Đóng ticket)
                    </span>
                  </div>
                  <span className="font-extrabold text-emerald-600">
                    {stats.resolvedTickets} ({resolvedPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, resolvedPercent))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CỘT 3: TRUY CẬP NHANH VÀ HỆ THỐNG */}
          <div className="space-y-6">
            {/* TRUY CẬP NHANH */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Phân hệ Nghiệp vụ Chính
                </h3>
                <span className="text-[11px] text-blue-600 font-semibold">5 luồng cốt lõi</span>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/staff/complaints"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        Xử lý Khiếu nại (L08)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Phối hợp phòng ban & đánh thức n8n
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/refunds"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                      <RotateCcw size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        Phê duyệt Hoàn tiền (L09)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Thẩm định & kích hoạt cổng chi trả
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/warranty"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                      <Shield size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        Tiếp nhận Bảo hành (L10)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Tra cứu serial & phân bổ kỹ thuật
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/chat"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        Live Chat CSKH
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Tư vấn trực tiếp theo phiên
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/knowledge"
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-700">
                        Kho Tri Thức AI RAG (L04)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Cơ sở dữ liệu Vector Qdrant
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={15}
                    className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>
              </div>
            </div>

            {/* TRẠNG THÁI HỆ THỐNG / AI BOT */}
            <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-wider text-blue-100">
                    Trợ lý AI & Điều phối n8n
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng
                </span>
              </div>

              <p className="text-xs text-blue-100/90 leading-relaxed">
                Tự động phân loại ý định (L02), điều phối phòng ban (L14), giám sát SLA (L07) và phản hồi tự động cho các thắc mắc thường gặp.
              </p>

              <div className="pt-3 border-t border-blue-700/60 flex items-center justify-between text-xs text-blue-200">
                <span>
                  Tỷ lệ tự động hoá:{" "}
                  <strong className="text-white font-bold">~68%</strong>
                </span>
                <Link
                  href="/staff/knowledge"
                  className="text-white hover:underline inline-flex items-center gap-1 font-semibold transition"
                >
                  Cấu hình RAG <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
