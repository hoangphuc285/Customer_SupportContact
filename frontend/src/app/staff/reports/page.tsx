'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StaffReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/reports/dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu Báo cáo:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-medium">
                    Đang tải dữ liệu báo cáo thống kê...
                </div>
            </ProtectedRoute>
        );
    }

    const stats = data?.stats || { totalTickets: 0, closedTickets: 0, inProgressTickets: 0, slaOverdueTickets: 0 };
    const charts = data?.charts || { ticketsByDate: {}, ticketsByCategory: {}, ticketsByStatus: {}, satisfactionDistribution: {} };
    const tableDetails = data?.tableDetails || [];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-100 p-6 space-y-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* TIÊU ĐỀ TRANG */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Báo Cáo & Thống Kê CSKH</h1>
                            <p className="text-xs text-slate-500 mt-1">Tổng hợp chỉ số hiệu suất xử lý Ticket và đánh giá khách hàng</p>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition shadow-sm"
                        >
                            🔄 Cập nhật dữ liệu
                        </button>
                    </div>

                    {/* PHẦN 1 – THẺ THỐNG KÊ */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Ticket</span>
                            <div className="text-3xl font-extrabold text-slate-800">{stats.totalTickets}</div>
                            <p className="text-[11px] text-slate-400">Yêu cầu đã tiếp nhận</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Đã Đóng</span>
                            <div className="text-3xl font-extrabold text-emerald-600">{stats.closedTickets}</div>
                            <p className="text-[11px] text-slate-400">Đã hoàn tất giải quyết</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Đang Xử Lý</span>
                            <div className="text-3xl font-extrabold text-blue-600">{stats.inProgressTickets}</div>
                            <p className="text-[11px] text-slate-400">Đang được hỗ trợ</p>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Quá Hạn SLA</span>
                            <div className="text-3xl font-extrabold text-rose-600">{stats.slaOverdueTickets}</div>
                            <p className="text-[11px] text-slate-400">Cần phản hồi khẩn cấp</p>
                        </div>
                    </div>

                    {/* PHẦN 2 – BIỂU ĐỒ TRỰC QUAN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 1. Biểu đồ Ticket theo ngày */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Số Ticket Theo Ngày</h3>
                            <div className="space-y-3">
                                {Object.keys(charts.ticketsByDate).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Chưa có dữ liệu</p>
                                ) : (
                                    Object.entries(charts.ticketsByDate).map(([date, count]: any) => (
                                        <div key={date} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium text-slate-600">
                                                <span>Ngày {date}</span>
                                                <span>{count} Ticket</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (count / Math.max(1, stats.totalTickets)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 2. Biểu đồ Ticket theo loại yêu cầu (Category) */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Số Ticket Theo Loại Yêu Cầu</h3>
                            <div className="space-y-3">
                                {Object.entries(charts.ticketsByCategory).map(([cat, count]: any) => (
                                    <div key={cat} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-600">
                                            <span className="uppercase">{cat}</span>
                                            <span>{count} Ticket</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-amber-500 h-2.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (count / Math.max(1, stats.totalTickets)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Biểu đồ Ticket theo trạng thái */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Số Ticket Theo Trạng Thái</h3>
                            <div className="space-y-3">
                                {Object.entries(charts.ticketsByStatus).map(([st, count]: any) => (
                                    <div key={st} className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-slate-600">
                                            <span className="uppercase">{st}</span>
                                            <span>{count} Ticket</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-purple-600 h-2.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, (count / Math.max(1, stats.totalTickets)) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Tỷ lệ hài lòng của khách hàng */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Tỷ Lệ Hài Lòng Của Khách Hàng</h3>
                            <div className="space-y-3">
                                {Object.keys(charts.satisfactionDistribution).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Chưa có đánh giá nào từ khách hàng</p>
                                ) : (
                                    Object.entries(charts.satisfactionDistribution).map(([sat, count]: any) => (
                                        <div key={sat} className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium text-slate-600">
                                                <span className="uppercase font-bold text-emerald-700">{sat}</span>
                                                <span>{count} Đánh giá</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-2.5 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (count / Math.max(1, stats.closedTickets || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>

                    {/* PHẦN 3 – BẢNG CHI TIẾT */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-sm">Chi Tiết Báo Cáo Xử Lý Ticket</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                <tr>
                                    <th className="p-4">Mã Ticket</th>
                                    <th className="p-4">Loại Yêu Cầu</th>
                                    <th className="p-4">Nhân Viên Phụ Trách</th>
                                    <th className="p-4">Thời Gian Xử Lý</th>
                                    <th className="p-4">Kết Quả</th>
                                    <th className="p-4">Mức Độ Hài Lòng</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                {tableDetails.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                                            Không có dữ liệu báo cáo.
                                        </td>
                                    </tr>
                                ) : (
                                    tableDetails.map((row: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition">
                                            <td className="p-4 font-bold text-indigo-600">{row.ticketCode}</td>
                                            <td className="p-4 uppercase text-xs font-semibold">{row.category}</td>
                                            <td className="p-4 font-medium">{row.agentName}</td>
                                            <td className="p-4">
                                          <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                                            ⏱ {row.handlingTimeMinutes} phút
                                          </span>
                                            </td>
                                            <td className="p-4 text-xs max-w-xs truncate">{row.resolution}</td>
                                            <td className="p-4">
                                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                              row.satisfaction === 'SATISFIED' ? 'bg-emerald-100 text-emerald-700' :
                                                  row.satisfaction === 'DISSATISFIED' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                          }`}>
                                            {row.satisfaction}
                                          </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}