'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    Search, 
    RotateCcw, 
    ArrowRight, 
    AlertTriangle, 
    Clock, 
    Ticket as TicketIcon 
} from 'lucide-react';
import { formatStatus, STATUS_MAP } from '@/utils/formatters';

export default function StaffTicketListPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterOnlyMyTickets, setFilterOnlyMyTickets] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [agentId, setAgentId] = useState<number | null>(null);

    useEffect(() => {
        const savedInfo = localStorage.getItem('staff_account') || localStorage.getItem('user_account');
        if (savedInfo) {
            try {
                const user = JSON.parse(savedInfo);
                const id = user.agentId || user.id || user.accountId;
                if (id) setAgentId(Number(id));
            } catch (e) {
                console.error('Lỗi parse staff info:', e);
            }
        }
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            let url = 'http://localhost:8080/api/agent/tickets?';
            if (filterOnlyMyTickets && agentId) {
                url += `agentId=${agentId}&`;
            }
            if (filterStatus) {
                url += `status=${filterStatus}&`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setTickets(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách ticket từ DB:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [agentId, filterStatus, filterOnlyMyTickets]);

    const filteredTickets = tickets.filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (t.ticketCode && t.ticketCode.toLowerCase().includes(q)) ||
            (t.subject && t.subject.toLowerCase().includes(q)) ||
            (t.customerName && t.customerName.toLowerCase().includes(q))
        );
    });

    const statusTabs = [
        { id: '', label: 'Tất cả trạng thái' },
        { id: 'NEW', label: 'Mới tiếp nhận' },
        { id: 'ASSIGNED', label: 'Đã phân công' },
        { id: 'IN_PROGRESS', label: 'Đang xử lý' },
        { id: 'RESOLVED', label: 'Đã giải quyết' },
        { id: 'CLOSED', label: 'Đã đóng' },
    ];

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            Quản lý Phiếu Hỗ Trợ Nội Bộ
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {filterOnlyMyTickets ? 'Đang lọc các phiếu hỗ trợ do bạn phụ trách' : 'Toàn bộ danh sách phiếu hỗ trợ yêu cầu trong hệ thống Chăm sóc Khách hàng'}
                        </p>
                    </div>

                    <button
                        onClick={fetchTickets}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                        <RotateCcw size={15} />
                        <span>Tải lại dữ liệu</span>
                    </button>
                </div>

                {/* FILTER TOOLBAR */}
                <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* SEARCH INPUT */}
                        <div className="relative w-full md:w-80">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo mã phiếu hỗ trợ, tiêu đề, tên khách..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                            />
                        </div>

                        {/* TOGGLE ONLY MY TICKETS */}
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer self-start md:self-auto">
                            <input
                                type="checkbox"
                                checked={filterOnlyMyTickets}
                                onChange={(e) => setFilterOnlyMyTickets(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded accent-indigo-600"
                            />
                            <span>Chỉ hiện phiếu hỗ trợ của tôi</span>
                        </label>
                    </div>

                    {/* STATUS PILL TABS */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                        {statusTabs.map((tab) => {
                            const isSelected = filterStatus === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilterStatus(tab.id)}
                                    className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                                        isSelected
                                            ? 'bg-slate-900 text-white shadow-xs font-semibold'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}

                        <span className="ml-auto text-sm font-medium text-slate-500">
                            Hiển thị {filteredTickets.length} phiếu hỗ trợ
                        </span>
                    </div>
                </div>

                {/* TICKETS TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center text-sm font-medium text-slate-500">
                            Đang tải danh sách phiếu hỗ trợ từ CSDL...
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-16 text-center space-y-2">
                            <TicketIcon size={36} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold text-slate-700">Không tìm thấy phiếu hỗ trợ nào phù hợp</p>
                            <p className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <th className="p-4 pl-6">Mã phiếu hỗ trợ</th>
                                        <th className="p-4">Tiêu đề yêu cầu</th>
                                        <th className="p-4">Khách hàng</th>
                                        <th className="p-4">Phụ trách</th>
                                        <th className="p-4">Cam kết chất lượng dịch vụ</th>
                                        <th className="p-4">Trạng thái</th>
                                        <th className="p-4 pr-6 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {filteredTickets.map((t) => {
                                        const statusMeta = STATUS_MAP[String(t.status || '').toUpperCase()];
                                        const statusLabel = statusMeta?.label || formatStatus(t.status);
                                        const statusBg = statusMeta?.bg || 'bg-slate-100';
                                        const statusColor = statusMeta?.color || 'text-slate-700';
                                        const statusBorder = statusMeta?.border || 'border-slate-200';

                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50/80 transition group">
                                                <td className="p-4 pl-6 font-mono font-semibold text-indigo-600">
                                                    <Link href={`/staff/tickets/${t.id}`} className="hover:underline">
                                                        {t.ticketCode || `#${t.id}`}
                                                    </Link>
                                                </td>
                                                <td className="p-4 font-medium text-slate-900 max-w-xs truncate" title={t.subject}>
                                                    {t.subject}
                                                </td>
                                                <td className="p-4 text-slate-600 font-normal">
                                                    {t.customerName || 'Khách vãng lai'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                                        !t.agentName || t.agentName === 'Chưa phân công'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                                                    }`}>
                                                        {t.agentName || 'Chưa phân công'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {t.isSlaOverdue ? (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                                                            <AlertTriangle size={13} /> Quá {Math.abs(t.slaRemainingMinutes || 0)}p
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                                            <Clock size={13} /> Còn {t.slaRemainingMinutes || 0}p
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusBg} ${statusColor} ${statusBorder}`}>
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="p-4 pr-6 text-right">
                                                    <Link
                                                        href={`/staff/tickets/${t.id}`}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-medium transition shadow-xs"
                                                    >
                                                        <span>Xử lý</span>
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}