'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StaffTicketListPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterOnlyMyTickets, setFilterOnlyMyTickets] = useState(false);
    const [agentId, setAgentId] = useState<number | null>(null);

    useEffect(() => {
        // 1. Lấy thông tin Agent đang đăng nhập từ LocalStorage
        const savedInfo = localStorage.getItem('user_info');
        if (savedInfo) {
            try {
                const user = JSON.parse(savedInfo);
                if (user.id) setAgentId(user.id);
            } catch (e) {
                console.error('Lỗi parse user_info:', e);
            }
        }
    }, []);

    // 2. Fetch danh sách Ticket thật từ Spring Boot
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
                setTickets(data);
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

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-100 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Quản Lý Ticket Nội Bộ (DB Thật)</h1>
                            <p className="text-xs text-slate-500 mt-1">
                                {filterOnlyMyTickets ? 'Đang hiển thị Ticket do bạn phụ trách' : 'Hiển thị toàn bộ Ticket trong hệ thống'}
                            </p>
                        </div>
                        <button
                            onClick={fetchTickets}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition"
                        >
                            🔄 Tải lại dữ liệu
                        </button>
                    </div>

                    {/* Thanh Bộ Lọc */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex gap-4 items-center">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none"
                            >
                                <option value="">-- Tất cả trạng thái --</option>
                                <option value="NEW">NEW (Mới)</option>
                                <option value="ASSIGNED">ASSIGNED (Đã gán)</option>
                                <option value="IN_PROGRESS">IN_PROGRESS (Đang xử lý)</option>
                                <option value="RESOLVED">RESOLVED (Đã giải quyết)</option>
                            </select>

                            <label className="flex items-center text-sm gap-2 font-medium text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={filterOnlyMyTickets}
                                    onChange={(e) => setFilterOnlyMyTickets(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                Chỉ hiện Ticket của tôi
                            </label>
                        </div>

                        <span className="text-xs text-slate-400 font-medium">Tìm thấy {tickets.length} kết quả</span>
                    </div>

                    {/* Bảng Hiển thị */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-slate-400 text-sm">Đang tải dữ liệu từ CSDL...</div>
                        ) : tickets.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 text-sm">Không có Ticket nào trong CSDL!</div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                                <tr>
                                    <th className="p-4">Mã Ticket</th>
                                    <th className="p-4">Tiêu đề</th>
                                    <th className="p-4">Khách hàng</th>
                                    <th className="p-4">Nhân viên</th>
                                    <th className="p-4">SLA</th>
                                    <th className="p-4">Trạng thái</th>
                                    <th className="p-4 text-right">Thao tác</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                {tickets.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 font-bold text-indigo-600">
                                            <Link href={`/staff/tickets/${t.id}`}>{t.ticketCode}</Link>
                                        </td>
                                        <td className="p-4 font-medium text-slate-900">{t.subject}</td>
                                        <td className="p-4">{t.customerName}</td>
                                        <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.agentName === 'Chưa phân công' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {t.agentName}
                        </span>
                                        </td>
                                        <td className="p-4">
                                            {t.isSlaOverdue ? (
                                                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                            Quá hạn {Math.abs(t.slaRemainingMinutes)}p
                          </span>
                                            ) : (
                                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                            Còn {t.slaRemainingMinutes}p
                          </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                                t.status === 'NEW' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t.status}
                        </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/staff/tickets/${t.id}`}
                                                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 shadow-sm"
                                            >
                                                Xử lý
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}