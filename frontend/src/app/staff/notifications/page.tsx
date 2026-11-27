'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
    Bell,
    Sparkles,
    RefreshCw,
    Search,
    Filter,
    PackageCheck,
    AlertTriangle,
    ShieldCheck,
    RotateCcw,
    Clock,
    CheckCircle2,
    Calendar,
    Eye,
    Zap,
    ExternalLink,
    VolumeX,
    Send
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
    id: number;
    customerId: number;
    customerName: string;
    customerEmail: string;
    ticketId: number | null;
    ticketCode: string | null;
    eventType: 'ORDER_DELIVERED' | 'ORDER_LATE' | 'WARRANTY_STATUS' | 'REFUND_RESULT';
    refId: string;
    channel: string;
    status: string;
    dedupeKey: string;
    title: string;
    content: string;
    metadata: any;
    sentAt: string | null;
    isRead: boolean;
    createdAt: string;
}

interface OverviewData {
    total: number;
    sentCount: number;
    scheduledCount: number;
    skippedCount: number;
    failedCount: number;
    notifications: NotificationItem[];
}

export default function StaffNotificationsPage() {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventFilter, setEventFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToastMessage(msg);
        setToastType(type);
        setTimeout(() => setToastMessage(null), 6000);
    };

    const getAuthHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('agent_token') || localStorage.getItem('jwt_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'ALL') params.set('status', statusFilter);
            if (eventFilter !== 'ALL') params.set('eventType', eventFilter);

            const res = await fetch(`http://localhost:8080/api/staff/notifications?${params.toString()}`, {
                headers: getAuthHeaders()
            });

            if (res.ok) {
                const data = await res.json();
                setOverview(data);
            } else {
                showToast(`Không thể tải danh sách thông báo (HTTP ${res.status})`, 'error');
            }
        } catch (err: any) {
            console.error('Lỗi tải thông báo:', err);
            showToast('Lỗi kết nối máy chủ Backend.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [eventFilter, statusFilter]);

    const handleTriggerScan = async () => {
        setScanning(true);
        try {
            const res = await fetch('http://localhost:8080/api/staff/notifications/trigger', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ actor: 'STAFF_PORTAL' })
            });

            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                showToast(`⚡ ${data.message || 'Quét thông báo thành công!'} (Chế độ: ${data.mode || 'Tự động'})`, 'success');
                await fetchNotifications();
            } else {
                showToast(data?.error || data?.message || `Lỗi quét thông báo (HTTP ${res.status})`, 'error');
            }
        } catch (e: any) {
            console.error(e);
            showToast('Lỗi kết nối khi quét thông báo.', 'error');
        } finally {
            setScanning(false);
        }
    };

    const getEventBadge = (type: string) => {
        switch (type) {
            case 'ORDER_DELIVERED':
                return {
                    label: 'Đơn giao thành công',
                    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: PackageCheck
                };
            case 'ORDER_LATE':
                return {
                    label: 'Đơn trễ hạn',
                    badge: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: AlertTriangle
                };
            case 'WARRANTY_STATUS':
                return {
                    label: 'Tiến độ bảo hành',
                    badge: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: ShieldCheck
                };
            case 'REFUND_RESULT':
                return {
                    label: 'Kết quả hoàn tiền',
                    badge: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: RotateCcw
                };
            default:
                return {
                    label: type,
                    badge: 'bg-slate-50 text-slate-700 border-slate-200',
                    icon: Bell
                };
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SENT':
                return {
                    label: 'ĐÃ GỬI',
                    badge: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-extrabold'
                };
            case 'SCHEDULED':
                return {
                    label: 'CHỜ SÁNG (GIỜ YÊN LẶNG)',
                    badge: 'bg-indigo-500/15 text-indigo-600 border-indigo-500/30 font-bold'
                };
            case 'SKIPPED_OPT_OUT':
                return {
                    label: 'KHÁCH TỪ CHỐI (OPT-OUT)',
                    badge: 'bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold'
                };
            case 'FAILED':
                return {
                    label: 'THẤT BẠI',
                    badge: 'bg-rose-500/15 text-rose-600 border-rose-500/30 font-bold'
                };
            default:
                return {
                    label: status,
                    badge: 'bg-slate-100 text-slate-700 border-slate-300'
                };
        }
    };

    const notificationsList = overview?.notifications || [];
    const filtered = notificationsList.filter(item => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (item.title && item.title.toLowerCase().includes(q)) ||
            (item.customerName && item.customerName.toLowerCase().includes(q)) ||
            (item.customerEmail && item.customerEmail.toLowerCase().includes(q)) ||
            (item.dedupeKey && item.dedupeKey.toLowerCase().includes(q)) ||
            (item.refId && item.refId.toLowerCase().includes(q))
        );
    });

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                
                {/* TOAST THÔNG BÁO TỨC THÌ */}
                {toastMessage && (
                    <div className={`fixed top-20 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 ${
                        toastType === 'success' 
                            ? 'bg-slate-900 text-white border border-slate-700' 
                            : 'bg-rose-600 text-white shadow-rose-600/20'
                    }`}>
                        <Sparkles size={16} className="text-amber-400 shrink-0" />
                        <span>{toastMessage}</span>
                    </div>
                )}

                {/* HEADER TIÊU ĐỀ & NÚT KÍCH HOẠT QUÉT THÔNG BÁO L21 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                                <Bell size={20} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                                    Quản Lý Thông Báo Chủ Động
                                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        LUỒNG 21
                                    </span>
                                </h1>
                                <p className="text-xs text-slate-500 font-medium">
                                    Tự động thông báo đơn đã giao, đơn trễ hẹn, đổi trạng thái bảo hành & kết quả hoàn tiền
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchNotifications}
                            disabled={loading}
                            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
                            <span>Làm mới</span>
                        </button>

                        <button
                            onClick={handleTriggerScan}
                            disabled={scanning}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 active:from-indigo-800 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            <Zap size={15} className={scanning ? 'animate-bounce text-amber-300' : 'text-amber-300'} />
                            <span>{scanning ? 'Đang Quét Hệ Thống...' : '⚡ Kích Hoạt Quét Thông Báo Chủ Động (L21)'}</span>
                        </button>
                    </div>
                </div>

                {/* 4 CARDS THỐNG KÊ KPI TỔNG QUAN */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                Tổng Thông Báo
                            </span>
                            <span className="text-2xl font-black text-slate-900 mt-1 block">
                                {overview?.total || 0}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                            <Bell size={20} />
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                                Đã Gửi Thành Công
                            </span>
                            <span className="text-2xl font-black text-emerald-700 mt-1 block">
                                {overview?.sentCount || 0}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 block">
                                Chờ Sáng (Giờ Yên Lặng)
                            </span>
                            <span className="text-2xl font-black text-indigo-700 mt-1 block">
                                {overview?.scheduledCount || 0}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200">
                            <Clock size={20} />
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
                                Khách Từ Chối (Opt-out)
                            </span>
                            <span className="text-2xl font-black text-amber-700 mt-1 block">
                                {overview?.skippedCount || 0}
                            </span>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                            <VolumeX size={20} />
                        </div>
                    </div>
                </div>

                {/* THANH TÌM KIẾM & BỘ LỌC */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm theo tên khách, email, tiêu đề hoặc khóa dedupe..."
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* LỌC THEO SỰ KIỆN */}
                        <select
                            value={eventFilter}
                            onChange={(e) => setEventFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden cursor-pointer"
                        >
                            <option value="ALL">Tất cả sự kiện</option>
                            <option value="ORDER_DELIVERED">Đơn giao thành công</option>
                            <option value="ORDER_LATE">Đơn trễ hạn giao</option>
                            <option value="WARRANTY_STATUS">Tiến độ bảo hành</option>
                            <option value="REFUND_RESULT">Kết quả hoàn tiền</option>
                        </select>

                        {/* LỌC THEO TRẠNG THÁI */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 focus:outline-hidden cursor-pointer"
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="SENT">Đã gửi (SENT)</option>
                            <option value="SCHEDULED">Chờ sáng (SCHEDULED)</option>
                            <option value="SKIPPED_OPT_OUT">Khách từ chối (SKIPPED)</option>
                            <option value="FAILED">Thất bại (FAILED)</option>
                        </select>
                    </div>
                </div>

                {/* BẢNG DANH SÁCH THÔNG BÁO CHI TIẾT */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="py-3.5 px-4">ID</th>
                                    <th className="py-3.5 px-4">Khách Hàng</th>
                                    <th className="py-3.5 px-4">Loại Sự Kiện</th>
                                    <th className="py-3.5 px-4">Tiêu Đề & Nội Dung</th>
                                    <th className="py-3.5 px-4">Khóa Dedupe</th>
                                    <th className="py-3.5 px-4">Trạng Thái</th>
                                    <th className="py-3.5 px-4 text-right">Thời Gian</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                            Đang nạp dữ liệu thông báo...
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            Không có bản ghi thông báo nào phù hợp với bộ lọc.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(item => {
                                        const ev = getEventBadge(item.eventType);
                                        const st = getStatusBadge(item.status);
                                        const EvIcon = ev.icon;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">
                                                    #{item.id}
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className="font-bold text-slate-900 block">
                                                        {item.customerName || 'N/A'}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 block truncate max-w-[150px]">
                                                        {item.customerEmail || 'Mã #' + item.customerId}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold ${ev.badge}`}>
                                                        <EvIcon size={13} />
                                                        {ev.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 max-w-sm">
                                                    <span className="font-bold text-slate-900 block truncate">
                                                        {item.title}
                                                    </span>
                                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                        {item.content}
                                                    </p>
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                                                        {item.dedupeKey}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] ${st.badge}`}>
                                                        {st.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                                    {item.sentAt 
                                                        ? new Date(item.sentAt).toLocaleString('vi-VN') 
                                                        : new Date(item.createdAt).toLocaleString('vi-VN')}
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
