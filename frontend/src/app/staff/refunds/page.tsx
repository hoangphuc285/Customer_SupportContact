'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    RotateCcw, 
    Search, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    DollarSign, 
    Building2, 
    RefreshCw, 
    Filter,
    Check,
    X,
    ExternalLink,
    ShieldAlert
} from 'lucide-react';

interface RefundItem {
    id: number;
    refundCode: string;
    orderCode: string;
    amount: number;
    reason: string;
    status: string;
    approvalLevel: string;
    createdAt: string;
    staffId?: number | null;
    staffName?: string | null;
    ticketCode?: string | null;
}

export default function StaffRefundsPage() {
    const [refunds, setRefunds] = useState<RefundItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    const fetchRefunds = async () => {
        setLoading(true);
        const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const res = await fetch('http://localhost:8080/api/staff/refunds');
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setRefunds(data);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách hoàn tiền:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefunds();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    };

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return iso || 'N/A';
        }
    };

    const handleApprove = async (id: number, code: string) => {
        try {
            await fetch(`http://localhost:8080/api/staff/refunds/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            setActionMsg(`Đã phê duyệt hoàn tiền cho yêu cầu #${code}. Hệ thống kích hoạt chi trả.`);
            setRefunds(prev => prev.map(r => r.refundCode === code ? { ...r, status: 'APPROVED' } : r));
            setTimeout(() => setActionMsg(null), 4000);
        } catch (e) {
            console.error(e);
        }
    };

    const filteredRefunds = refunds.filter(r => {
        const matchesSearch = !searchTerm || 
            r.refundCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.reason.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <RotateCcw className="text-emerald-600" size={24} />
                        <span>Quản Lý & Phê Duyệt Hoàn Tiền Đổi Trả (Luồng L09)</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Thẩm định yêu cầu hoàn tiền 7 ngày • Phân cấp duyệt: AUTO (≤ 500k), TEAM_LEAD (≤ 5tr), MANAGER (&gt; 5tr)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchRefunds}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                        title="Làm mới"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {refunds.length} Yêu Cầu
                    </span>
                </div>
            </div>

            {/* ACTION ALERT */}
            {actionMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{actionMsg}</span>
                </div>
            )}

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">TỔNG HOÀN TIỀN</span>
                    <span className="text-xl font-black text-slate-900 mt-1 block">
                        {formatCurrency(refunds.reduce((acc, r) => acc + (r.amount || 0), 0))}
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">DUYỆT TỰ ĐỘNG (AUTO)</span>
                    <span className="text-xl font-black text-emerald-600 mt-1 block">
                        {refunds.filter(r => r.approvalLevel === 'AUTO').length} ca
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CHỜ TEAM LEAD DUYỆT</span>
                    <span className="text-xl font-black text-blue-600 mt-1 block">
                        {refunds.filter(r => r.approvalLevel === 'TEAM_LEAD').length} ca
                    </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CHỜ QUẢN LÝ DUYỆT</span>
                    <span className="text-xl font-black text-amber-600 mt-1 block">
                        {refunds.filter(r => r.approvalLevel === 'MANAGER').length} ca
                    </span>
                </div>
            </div>

            {/* SEARCH & FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm mã refund, mã đơn hàng (#DH...), lý do..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="APPROVED">Đã duyệt (APPROVED)</option>
                    <option value="PAID">Đã thanh toán (PAID)</option>
                    <option value="PENDING_APPROVAL">Chờ duyệt (PENDING)</option>
                </select>
            </div>

            {/* TABLE LIST */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                                <th className="p-4">Mã Refund</th>
                                <th className="p-4">Mã Đơn Hàng</th>
                                <th className="p-4">Số Tiền</th>
                                <th className="p-4">Cấp Duyệt</th>
                                <th className="p-4">Lý Do Hoàn</th>
                                <th className="p-4">Trạng Thái</th>
                                <th className="p-4">Thời Gian</th>
                                <th className="p-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRefunds.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        Không tìm thấy yêu cầu hoàn tiền nào phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredRefunds.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="p-4 font-mono font-bold text-slate-900">{item.refundCode}</td>
                                        <td className="p-4 font-mono font-bold text-slate-700">
                                            <span>{item.orderCode}</span>
                                        </td>
                                        <td className="p-4 font-black text-slate-900">{formatCurrency(item.amount)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                                item.approvalLevel === 'AUTO' ? 'bg-emerald-100 text-emerald-800' :
                                                item.approvalLevel === 'TEAM_LEAD' ? 'bg-blue-100 text-blue-800' :
                                                'bg-amber-100 text-amber-800'
                                            }`}>
                                                {item.approvalLevel}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600 max-w-xs truncate" title={item.reason}>
                                            {item.reason}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                item.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                item.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">{formatDate(item.createdAt)}</td>
                                        <td className="p-4 text-right">
                                            {item.status !== 'PAID' && item.status !== 'APPROVED' ? (
                                                <button
                                                    onClick={() => handleApprove(item.id, item.refundCode)}
                                                    className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                                                >
                                                    Duyệt Chi Trả
                                                </button>
                                            ) : (
                                                <span className="text-emerald-600 font-semibold text-[11px]">Đã duyệt/chi trả</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
