'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    BarChart3, 
    RefreshCw, 
    CheckCircle2, 
    Clock, 
    AlertOctagon, 
    Layers, 
    Calendar, 
    PieChart, 
    Smile, 
    Frown, 
    Search, 
    Timer, 
    UserCheck
} from 'lucide-react';
import { formatCategory, formatStatus, formatSatisfaction } from '@/utils/formatters';

export default function StaffReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTable, setSearchTable] = useState('');

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

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const stats = data?.stats || { totalTickets: 0, closedTickets: 0, inProgressTickets: 0, slaOverdueTickets: 0 };
    const charts = data?.charts || { ticketsByDate: {}, ticketsByCategory: {}, ticketsByStatus: {}, satisfactionDistribution: {} };
    const tableDetails: any[] = data?.tableDetails || [];

    // Filter table details
    const filteredRows = tableDetails.filter((row) => {
        if (!searchTable.trim()) return true;
        const q = searchTable.toLowerCase();
        return (
            String(row.ticketCode || '').toLowerCase().includes(q) ||
            String(row.agentName || '').toLowerCase().includes(q) ||
            String(row.resolution || '').toLowerCase().includes(q) ||
            String(formatCategory(row.category) || '').toLowerCase().includes(q)
        );
    });

    // CSAT calculation
    const satisfiedCount = charts.satisfactionDistribution?.['SATISFIED'] || charts.satisfactionDistribution?.['Hài lòng'] || 0;
    const totalRated = Object.values(charts.satisfactionDistribution || {}).reduce((acc: number, val: any) => acc + Number(val || 0), 0) as number;
    const csatRate = totalRated > 0 ? Math.round((satisfiedCount / totalRated) * 100) : 100;

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
                {/* PAGE HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                                <BarChart3 size={14} />
                                Báo Cáo Hiệu Suất & SLA
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                            Chỉ số Vận hành CSKH
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Theo dõi mức độ tuân thủ SLA, khối lượng tiếp nhận và phản hồi từ khách hàng
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={fetchDashboardData}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 shadow-sm transition active:scale-95 disabled:opacity-60"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
                            <span>{loading ? 'Đang cập nhật...' : 'Cập nhật số liệu'}</span>
                        </button>
                    </div>
                </div>

                {/* 4 STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* TỔNG TICKET */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng Yêu Cầu</span>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Layers size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-900">
                            {loading ? '...' : stats.totalTickets}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Tổng ticket đã ghi nhận trong kỳ</p>
                    </div>

                    {/* ĐÃ ĐÓNG */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đã Hoàn Tất</span>
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-600">
                            {loading ? '...' : stats.closedTickets}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Tỷ lệ giải quyết: {stats.totalTickets ? Math.round((stats.closedTickets / stats.totalTickets) * 100) : 0}%
                        </p>
                    </div>

                    {/* ĐANG XỬ LÝ */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đang Giải Quyết</span>
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Clock size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-blue-600">
                            {loading ? '...' : stats.inProgressTickets}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Đang có chuyên viên xử lý</p>
                    </div>

                    {/* QUÁ HẠN SLA */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Vi Phạm SLA</span>
                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <AlertOctagon size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-rose-600">
                            {loading ? '...' : stats.slaOverdueTickets}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Cần ưu tiên xử lý khẩn cấp</p>
                    </div>
                </div>

                {/* 4 CHARTS & METRIC GRIDS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 1. TICKET THEO NGÀY */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-indigo-600" />
                                <h3 className="font-bold text-slate-900 text-sm md:text-base">Khối Lượng Tiếp Nhận Theo Ngày</h3>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">Theo thời gian</span>
                        </div>

                        <div className="space-y-3.5 pt-1">
                            {Object.keys(charts.ticketsByDate || {}).length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-6 text-center">Chưa có phân bố ngày</p>
                            ) : (
                                Object.entries(charts.ticketsByDate).map(([date, count]: any) => {
                                    const percent = Math.min(100, Math.round((Number(count) / Math.max(1, stats.totalTickets)) * 100));
                                    return (
                                        <div key={date} className="space-y-1.5">
                                            <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-700">
                                                <span className="font-mono">{date}</span>
                                                <span className="font-bold text-indigo-600">{count} Ticket ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 2. TICKET THEO LOẠI YÊU CẦU */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <PieChart size={18} className="text-amber-500" />
                                <h3 className="font-bold text-slate-900 text-sm md:text-base">Phân Loại Theo Danh Mục Yêu Cầu</h3>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">Chủ đề</span>
                        </div>

                        <div className="space-y-3.5 pt-1">
                            {Object.keys(charts.ticketsByCategory || {}).length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-6 text-center">Chưa có phân loại</p>
                            ) : (
                                Object.entries(charts.ticketsByCategory).map(([cat, count]: any) => {
                                    const percent = Math.min(100, Math.round((Number(count) / Math.max(1, stats.totalTickets)) * 100));
                                    return (
                                        <div key={cat} className="space-y-1.5">
                                            <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-700">
                                                <span className="font-semibold text-slate-800">{formatCategory(cat)}</span>
                                                <span className="font-bold text-amber-600">{count} Ticket ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 3. TICKET THEO TRẠNG THÁI */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-purple-600" />
                                <h3 className="font-bold text-slate-900 text-sm md:text-base">Phân Bố Trạng Thái Xử Lý</h3>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">Trạng thái</span>
                        </div>

                        <div className="space-y-3.5 pt-1">
                            {Object.keys(charts.ticketsByStatus || {}).length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-6 text-center">Chưa có dữ liệu trạng thái</p>
                            ) : (
                                Object.entries(charts.ticketsByStatus).map(([st, count]: any) => {
                                    const percent = Math.min(100, Math.round((Number(count) / Math.max(1, stats.totalTickets)) * 100));
                                    return (
                                        <div key={st} className="space-y-1.5">
                                            <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-700">
                                                <span className="font-semibold text-slate-800">{formatStatus(st)}</span>
                                                <span className="font-bold text-purple-600">{count} Ticket ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* 4. CHỈ SỐ HÀI LÒNG CSAT */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Smile size={18} className="text-emerald-600" />
                                <h3 className="font-bold text-slate-900 text-sm md:text-base">Chỉ Số Hài Lòng Khách Hàng (CSAT)</h3>
                            </div>
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs sm:text-sm font-extrabold">
                                {csatRate}% Hài lòng
                            </span>
                        </div>

                        <div className="space-y-3.5 pt-1">
                            {Object.keys(charts.satisfactionDistribution || {}).length === 0 ? (
                                <p className="text-sm text-slate-400 italic py-6 text-center">Chưa có đánh giá nào từ khách hàng</p>
                            ) : (
                                Object.entries(charts.satisfactionDistribution).map(([sat, count]: any) => {
                                    const isSat = String(sat).toUpperCase().includes('SATISFIED') || String(sat).includes('Hài lòng');
                                    const percent = totalRated > 0 ? Math.round((Number(count) / totalRated) * 100) : 0;
                                    return (
                                        <div key={sat} className="space-y-1.5">
                                            <div className="flex justify-between text-xs sm:text-sm font-medium text-slate-700">
                                                <span className={`font-bold flex items-center gap-1.5 ${isSat ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {isSat ? <Smile size={15} /> : <Frown size={15} />}
                                                    <span>{formatSatisfaction(sat)}</span>
                                                </span>
                                                <span className="font-bold text-slate-800">{count} Đánh giá ({percent}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-2.5 rounded-full transition-all duration-500 ${isSat ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* BẢNG CHI TIẾT BÁO CÁO XỬ LÝ */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="p-5 md:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
                        <div>
                            <h3 className="font-bold text-slate-900 text-base md:text-lg">
                                Chi Tiết Hồ Sơ Xử Lý Ticket
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                Danh sách các ticket đã ghi nhận cùng chuyên viên phụ trách và thời gian phản hồi
                            </p>
                        </div>

                        {/* SEARCH & FILTERS */}
                        <div className="relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm mã, chuyên viên..."
                                value={searchTable}
                                onChange={(e) => setSearchTable(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-4">Mã Ticket</th>
                                    <th className="p-4">Phân loại</th>
                                    <th className="p-4">Chuyên viên</th>
                                    <th className="p-4">Thời gian xử lý</th>
                                    <th className="p-4">Tóm tắt kết quả</th>
                                    <th className="p-4">Đánh giá</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {filteredRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-slate-400 text-sm">
                                            Không tìm thấy dữ liệu báo cáo nào phù hợp.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRows.map((row: any, idx: number) => {
                                        const isSat = String(row.satisfaction || '').toUpperCase().includes('SATISFIED');
                                        const isDissat = String(row.satisfaction || '').toUpperCase().includes('DISSATISFIED');

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition">
                                                <td className="p-4 font-bold font-mono text-indigo-600">
                                                    {row.ticketCode}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                        {formatCategory(row.category)}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 font-medium text-slate-900">
                                                        <UserCheck size={15} className="text-slate-400" />
                                                        <span>{row.agentName || 'Chưa gán'}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                                                        <Timer size={13} className="text-slate-500" />
                                                        <span>{row.handlingTimeMinutes ?? 0} phút</span>
                                                    </span>
                                                </td>
                                                <td className="p-4 max-w-xs truncate text-slate-600 text-xs sm:text-sm" title={row.resolution}>
                                                    {row.resolution || 'Chưa có tóm tắt'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                                                        isSat
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : isDissat
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}>
                                                        {isSat && <Smile size={13} />}
                                                        {isDissat && <Frown size={13} />}
                                                        <span>{formatSatisfaction(row.satisfaction)}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}