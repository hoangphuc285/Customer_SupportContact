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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                Trung tâm Điều phối Chăm sóc Khách hàng
              </span>
              {lastUpdated && (
                <span className="text-xs text-slate-500 font-medium">
                  Cập nhật lúc: {lastUpdated}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Tổng quan hoạt động
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Theo dõi tình trạng yêu cầu, tải công việc chuyên viên và chỉ số
              chất lượng dịch vụ
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 shadow-sm transition active:scale-95 disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={
                  loading ? "animate-spin text-indigo-600" : "text-slate-500"
                }
              />
              <span>{loading ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}</span>
            </button>
            <Link
              href="/staff/tickets"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition active:scale-95"
            >
              <Ticket size={15} />
              <span>Xem phiếu hỗ trợ</span>
            </Link>
          </div>
        </div>

        {/* 4 STAT METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* THẺ 1: Tổng Ticket
           */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-50/60 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-indigo-100/70 transition" />
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tổng yêu cầu
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                <Inbox size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.totalTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Toàn bộ các kênh hỗ trợ</span>
              <span className="font-semibold text-indigo-600">100%</span>
            </div>
          </div>

          {/* THẺ 2: Mới tiếp nhận */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-50/60 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-purple-100/70 transition" />
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mới / Đang chờ
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                <AlertCircle size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-purple-600 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.openTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Cần phân công xử lý</span>
              <span className="font-semibold text-purple-600">{newPercent}%</span>
            </div>
          </div>

          {/* THẺ 3: Đang xử lý */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-50/60 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-amber-100/70 transition" />
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Đang xử lý
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                <Clock size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-amber-600 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.inProgressTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Chuyên viên đang tư vấn</span>
              <span className="font-semibold text-amber-600">
                {inProgressPercent}%
              </span>
            </div>
          </div>

          {/* THẺ 4: Đã hoàn tất */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50/60 rounded-full blur-2xl -mr-8 -mt-8 group-hover:bg-emerald-100/70 transition" />
            <div className="flex items-center justify-between relative z-10 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Đã giải quyết
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="text-3xl md:text-4xl font-bold text-emerald-600 tracking-tight">
              {loading ? (
                <span className="inline-block w-14 h-9 bg-slate-100 animate-pulse rounded-lg" />
              ) : (
                stats.resolvedTickets
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500">Tỷ lệ hoàn thành</span>
              <span className="font-semibold text-emerald-600">
                {resolvedPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* HÀNG 2: TIẾN ĐỘ XỬ LÝ & TRUY CẬP NHANH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT 1 & 2: PHÂN BỐ VÀ TIẾN ĐỘ XỬ LÝ */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900 text-base md:text-lg">
                  Phân bố trạng thái và Tỷ lệ xử lý
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Tỷ lệ hoàn thành trên tổng số {stats.totalTickets} yêu cầu đã
                  tiếp nhận
                </p>
              </div>
              <span className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
                {stats.totalTickets} Phiếu
              </span>
            </div>

            {/* THANH SEGMENTED TOÀN CẢNH */}
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-700">
                <span>Tiến trình xử lý chung</span>
                <span className="font-semibold text-slate-900">
                  {resolvedPercent}% hoàn thành
                </span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5">
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
                  className="bg-purple-500 rounded-r-full transition-all duration-500"
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
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Chờ tiếp nhận ({stats.openTickets})</span>
                </div>
              </div>
            </div>

            {/* CÁC THANH CHI TIẾT */}
            <div className="space-y-4 pt-2">
              {/* NEW */}
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100/90">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span className="font-semibold text-slate-900">
                      Mới tiếp nhận
                    </span>
                  </div>
                  <span className="font-semibold text-purple-700">
                    {stats.openTickets} ({newPercent}%)
                  </span>
                </div>
                <div className="w-full bg-purple-100/70 rounded-full h-2.5">
                  <div
                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, newPercent))}%`,
                    }}
                  />
                </div>
              </div>

              {/* IN PROGRESS */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/90">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-900">
                      Đang xử lý
                    </span>
                  </div>
                  <span className="font-semibold text-amber-700">
                    {stats.inProgressTickets} ({inProgressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-amber-100/70 rounded-full h-2.5">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, inProgressPercent))}%`,
                    }}
                  />
                </div>
              </div>

              {/* RESOLVED */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100/90">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-semibold text-slate-900">
                      Đã giải quyết hoàn tất
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-700">
                    {stats.resolvedTickets} ({resolvedPercent}%)
                  </span>
                </div>
                <div className="w-full bg-emerald-100/70 rounded-full h-2.5">
                  <div
                    className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
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
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm md:text-base">
                  Thao tác nhanh
                </h3>
                <span className="text-xs text-slate-400">5 phân hệ</span>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/staff/chat"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                      <MessageSquare size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        Trò chuyện trực tuyến
                      </div>
                      <div className="text-xs text-slate-500">
                        Tư vấn trực tiếp theo phiên
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/tickets"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                      <Ticket size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        Quản lý phiếu hỗ trợ
                      </div>
                      <div className="text-xs text-slate-500">
                        Phân công và soạn giải pháp
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/reports"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                      <BarChart3 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        Báo cáo & Cam kết chất lượng dịch vụ
                      </div>
                      <div className="text-xs text-slate-500">
                        Chỉ số hiệu suất Chăm sóc Khách hàng
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/customers"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                      <Users size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        Hồ sơ Khách hàng
                      </div>
                      <div className="text-xs text-slate-500">
                        Tra cứu thông tin liên hệ
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>

                <Link
                  href="/staff/knowledge"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        Kho tri thức AI RAG
                      </div>
                      <div className="text-xs text-slate-500">
                        Qdrant Vector Database
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition"
                  />
                </Link>
              </div>
            </div>

            {/* TRẠNG THÁI HỆ THỐNG / AI BOT */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-2xl p-6 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <span className="font-semibold text-xs uppercase tracking-wider text-indigo-200">
                    Trợ lý AI & n8n
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Hoạt động
                </span>
              </div>

              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                Trí tuệ nhân tạo tự động trả lời tức thì các câu hỏi thường gặp và chuyển giao
                cho chuyên viên khi nhận diện yêu cầu phức tạp.
              </p>

              <div className="pt-3 border-t border-indigo-800/60 flex items-center justify-between text-xs text-indigo-300">
                <span>
                  Tỷ lệ tự động hoá:{" "}
                  <strong className="text-white font-semibold">~68%</strong>
                </span>
                <Link
                  href="/staff/knowledge"
                  className="text-indigo-300 hover:text-white inline-flex items-center gap-1 font-medium transition"
                >
                  Cấu hình <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
