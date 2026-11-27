'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Bell, 
    PackageCheck, 
    AlertTriangle, 
    ShieldCheck, 
    RotateCcw, 
    CheckCircle2, 
    Clock, 
    Settings, 
    Check, 
    Filter,
    ArrowRight,
    RefreshCw,
    Sparkles,
    SlidersHorizontal,
    VolumeX,
    Volume2
} from 'lucide-react';

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

export default function UserNotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [optOut, setOptOut] = useState(false);
    const [updatingOptOut, setUpdatingOptOut] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterUnread, setFilterUnread] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchNotifications = async () => {
        const saved = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        let customerId: number | null = null;
        let email: string | null = null;

        if (saved) {
            try {
                const u = JSON.parse(saved);
                setUser(u);
                customerId = u.customerId || u.id || null;
                email = u.email || null;
                if (typeof u.notifyOptOut === 'boolean') {
                    setOptOut(u.notifyOptOut);
                }
            } catch {
                // Ignore parse error
            }
        }

        try {
            const params = new URLSearchParams();
            if (customerId) params.set('customerId', String(customerId));
            if (email) params.set('email', email);

            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`http://localhost:8080/api/portal/notifications?${params.toString()}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setNotifications(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Lỗi khi tải thông báo:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleToggleOptOut = async () => {
        const nextState = !optOut;
        setUpdatingOptOut(true);
        try {
            const customerId = user?.customerId || user?.id || 1;
            const res = await fetch(`http://localhost:8080/api/portal/notifications/preferences?customerId=${customerId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notifyOptOut: nextState, customerId })
            });

            if (res.ok) {
                setOptOut(nextState);
                if (user) {
                    const updated = { ...user, notifyOptOut: nextState };
                    localStorage.setItem('user_account', JSON.stringify(updated));
                    setUser(updated);
                }
                showToast(nextState 
                    ? '🔕 Đã tắt nhận thông báo chủ động. Bạn sẽ không nhận tin nhắn tự động nữa.' 
                    : '🔔 Đã bật nhận thông báo chủ động về đơn hàng, bảo hành & hoàn tiền.');
            } else {
                showToast('❌ Không thể cập nhật tùy chọn thông báo. Vui lòng thử lại!');
            }
        } catch (e) {
            console.error(e);
            showToast('❌ Lỗi kết nối máy chủ.');
        } finally {
            setUpdatingOptOut(false);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            const customerId = user?.customerId || user?.id || 1;
            const res = await fetch(`http://localhost:8080/api/portal/notifications/${id}/read?customerId=${customerId}`, {
                method: 'PATCH'
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
                showToast('✅ Đã đánh dấu thông báo là đã đọc');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unreadItems = notifications.filter(n => !n.isRead);
        for (const item of unreadItems) {
            handleMarkAsRead(item.id);
        }
    };

    const getEventBadge = (type: string) => {
        switch (type) {
            case 'ORDER_DELIVERED':
                return {
                    label: 'Giao hàng thành công',
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: PackageCheck,
                    iconBg: 'bg-emerald-500/10 text-emerald-600'
                };
            case 'ORDER_LATE':
                return {
                    label: 'Cập nhật trễ đơn',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: AlertTriangle,
                    iconBg: 'bg-amber-500/10 text-amber-600'
                };
            case 'WARRANTY_STATUS':
                return {
                    label: 'Tiến độ bảo hành',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: ShieldCheck,
                    iconBg: 'bg-blue-500/10 text-blue-600'
                };
            case 'REFUND_RESULT':
                return {
                    label: 'Kết quả hoàn tiền',
                    color: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: RotateCcw,
                    iconBg: 'bg-purple-500/10 text-purple-600'
                };
            default:
                return {
                    label: 'Thông báo',
                    color: 'bg-slate-50 text-slate-700 border-slate-200',
                    icon: Bell,
                    iconBg: 'bg-slate-500/10 text-slate-600'
                };
        }
    };

    const filtered = notifications.filter(n => {
        if (filterType !== 'ALL' && n.eventType !== filterType) return false;
        if (filterUnread && n.isRead) return false;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            
            {/* TOAST THÔNG BÁO TỨC THÌ */}
            {toastMessage && (
                <div className="fixed top-24 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 text-sm font-medium animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-400 shrink-0" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* HEADER TIÊU ĐỀ TRANG */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                Thông Báo Của Tôi
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                Theo dõi thông báo chủ động về tiến độ đơn hàng, bảo hành & kết quả hoàn tiền (Luồng L21)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => { setRefreshing(true); fetchNotifications(); }}
                        disabled={refreshing}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'} />
                        <span>Làm mới</span>
                    </button>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                        >
                            <Check size={14} />
                            <span>Đọc tất cả ({unreadCount})</span>
                        </button>
                    )}
                </div>
            </div>

            {/* CARD CÀI ĐẶT BẬT/TẮT NHẬN THÔNG BÁO CHỦ ĐỘNG (PROACTIVE PREFERENCES) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
                        optOut ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                        {optOut ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                                Nhận thông báo chủ động (L21)
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                optOut 
                                    ? 'bg-amber-100/80 text-amber-800 border-amber-300' 
                                    : 'bg-emerald-100/80 text-emerald-800 border-emerald-300'
                            }`}>
                                {optOut ? 'Đã tắt nhận tin' : 'Đang bật nhận tin'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                            Hệ thống sẽ chủ động nhắn tin khi đơn hàng được giao, đơn bị chậm trễ, phiếu bảo hành sửa xong hoặc tiền hoàn đã chuyển.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs font-semibold text-slate-600">
                        {optOut ? 'Từ chối nhận' : 'Đồng ý nhận'}
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={!optOut}
                        disabled={updatingOptOut}
                        onClick={handleToggleOptOut}
                        className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                            !optOut ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                !optOut ? 'translate-x-6' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* BỘ LỌC THÔNG BÁO */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    {[
                        { key: 'ALL', label: 'Tất cả' },
                        { key: 'ORDER_DELIVERED', label: 'Đơn giao' },
                        { key: 'ORDER_LATE', label: 'Đơn trễ' },
                        { key: 'WARRANTY_STATUS', label: 'Bảo hành' },
                        { key: 'REFUND_RESULT', label: 'Hoàn tiền' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilterType(tab.key)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                filterType === tab.key
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setFilterUnread(!filterUnread)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                        filterUnread
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                    <Filter size={12} />
                    <span>Chỉ tin chưa đọc</span>
                </button>
            </div>

            {/* DANH SÁCH THÔNG BÁO */}
            {loading ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Đang tải thông báo từ máy chủ...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
                        <Bell size={26} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                        Không có thông báo nào phù hợp
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Khi có cập nhật mới về đơn hàng, phiếu bảo hành hoặc tiền hoàn, thông báo chủ động sẽ hiển thị tại đây.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(item => {
                        const badge = getEventBadge(item.eventType);
                        const Icon = badge.icon;

                        return (
                            <div
                                key={item.id}
                                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                                    !item.isRead
                                        ? 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                                        : 'bg-white/70 border-slate-200/80 hover:bg-white'
                                }`}
                            >
                                <div className="flex items-start gap-3.5 min-w-0">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${badge.iconBg}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                            {!item.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" title="Chưa đọc" />
                                            )}
                                            <span className="text-[11px] text-slate-400 font-mono">
                                                #{item.refId}
                                            </span>
                                        </div>

                                        <h3 className={`text-sm font-bold text-slate-900 leading-snug ${!item.isRead ? 'font-extrabold' : ''}`}>
                                            {item.title}
                                        </h3>

                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {item.content}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400 font-medium">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {item.sentAt 
                                                    ? new Date(item.sentAt).toLocaleString('vi-VN') 
                                                    : new Date(item.createdAt).toLocaleString('vi-VN')}
                                            </span>
                                            <span>•</span>
                                            <span className="uppercase text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {item.channel}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    {!item.isRead && (
                                        <button
                                            onClick={() => handleMarkAsRead(item.id)}
                                            className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <CheckCircle2 size={13} />
                                            <span>Đã đọc</span>
                                        </button>
                                    )}

                                    {item.ticketId && (
                                        <Link
                                            href={`/user/tickets`}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <span>Xem vé hỗ trợ</span>
                                            <ArrowRight size={12} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
