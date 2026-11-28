'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Send,
    RefreshCw,
    Clock,
    CheckCircle2,
    AlertCircle,
    XCircle,
    ExternalLink,
    RotateCw,
    MessageSquare,
    Mail,
    Globe,
    Smartphone
} from 'lucide-react';

interface OutboundMessage {
    id: number;
    ticketId: number;
    ticketCode?: string;
    channel: string;
    content: string;
    senderType: string;
    deliveryStatus: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
    deliveryAttempts: number;
    deliveryError?: string;
    createdAt: string;
    customerName?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export default function OutboundMonitorPage() {
    const [messages, setMessages] = useState<OutboundMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [retryingId, setRetryingId] = useState<number | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'FAILED' | 'SENT'>('ALL');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const fetchMessages = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const res = await fetch(`${API_BASE}/staff/messages/outbound-status`);
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data) ? data : []);
                setLastUpdated(new Date());
            }
        } catch (err) {
            console.error('Lỗi tải danh sách outbound:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
        const timer = setInterval(() => fetchMessages(false), 10000);
        return () => clearInterval(timer);
    }, [fetchMessages]);

    const handleRetry = async (msg: OutboundMessage) => {
        setRetryingId(msg.id);
        try {
            const res = await fetch(`${API_BASE}/staff/tickets/${msg.ticketId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg.content,
                    retryMessageId: msg.id
                })
            });
            if (res.ok) {
                await fetchMessages(true);
            }
        } catch (err) {
            console.error('Lỗi thử lại gửi tin:', err);
        } finally {
            setRetryingId(null);
        }
    };

    const stats = {
        pending: messages.filter(m => m.deliveryStatus === 'PENDING').length,
        sent: messages.filter(m => m.deliveryStatus === 'SENT').length,
        failed: messages.filter(m => m.deliveryStatus === 'FAILED').length,
        cancelled: messages.filter(m => m.deliveryStatus === 'CANCELLED').length,
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'ALL') return true;
        return m.deliveryStatus === filter;
    });

    const getChannelBadge = (channel: string) => {
        const ch = (channel || '').toUpperCase();
        if (ch === 'TELEGRAM') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/80 text-xs font-medium">
                    <Send size={12} /> Telegram
                </span>
            );
        }
        if (ch === 'EMAIL') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 text-xs font-medium">
                    <Mail size={12} /> Email
                </span>
            );
        }
        if (ch === 'ZALO' || ch === 'MESSENGER') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-medium">
                    <MessageSquare size={12} /> {ch}
                </span>
            );
        }
        if (ch === 'LIVECHAT' || ch === 'WEB') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-medium">
                    <Globe size={12} /> {ch}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
                <Smartphone size={12} /> {ch || 'KHÁC'}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                        <Clock size={12} /> PENDING
                    </span>
                );
            case 'SENT':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        <CheckCircle2 size={12} /> SENT
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                        <AlertCircle size={12} /> FAILED
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                        <XCircle size={12} /> CANCELLED
                    </span>
                );
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Cổng Gửi Tin Đa Kênh (L15)
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                        Giám sát hàng đợi giao tin phản hồi từ CSKH/AI qua Telegram, Email, Zalo, Messenger & Livechat
                        {lastUpdated && ` • Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}`}
                    </p>
                </div>

                <button
                    onClick={() => fetchMessages(true)}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Làm mới
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Đang chờ gửi</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stats.pending}</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Đã gửi thành công</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stats.sent}</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Gửi thất bại</span>
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <AlertCircle size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stats.failed}</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Đã hủy</span>
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <XCircle size={16} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mt-2">{stats.cancelled}</p>
                </div>
            </div>

            {/* Filter Tabs & Table */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        {(['ALL', 'PENDING', 'FAILED', 'SENT'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    filter === tab
                                        ? 'bg-white text-blue-600 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {tab === 'ALL' ? 'Tất cả' : tab}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-slate-500">
                        Hiển thị {filteredMessages.length} tin nhắn
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-xs text-slate-500">
                        Đang tải dữ liệu hàng đợi...
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="p-12 text-center">
                        <Send size={28} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-medium text-slate-600">Không có tin nhắn nào</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Hàng đợi gửi tin hiện đang trống hoặc không khớp bộ lọc.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="py-3 px-4">ID</th>
                                    <th className="py-3 px-4">Ticket</th>
                                    <th className="py-3 px-4">Kênh</th>
                                    <th className="py-3 px-4">Nội dung</th>
                                    <th className="py-3 px-4">Trạng thái</th>
                                    <th className="py-3 px-4 text-center">Số lần thử</th>
                                    <th className="py-3 px-4">Thời gian</th>
                                    <th className="py-3 px-4 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {filteredMessages.map(msg => {
                                    const truncatedContent =
                                        msg.content && msg.content.length > 60
                                            ? msg.content.slice(0, 60) + '...'
                                            : msg.content || '—';

                                    return (
                                        <tr key={msg.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-4 font-mono text-slate-500">
                                                #{msg.id}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <Link
                                                    href={`/staff/tickets/${msg.ticketId}`}
                                                    className="font-semibold text-blue-600 hover:underline"
                                                >
                                                    {msg.ticketCode || `#${msg.ticketId}`}
                                                </Link>
                                                {msg.customerName && (
                                                    <div className="text-[11px] text-slate-400 mt-0.5">
                                                        {msg.customerName}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {getChannelBadge(msg.channel)}
                                            </td>
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <p className="text-slate-700 truncate" title={msg.content}>
                                                    {truncatedContent}
                                                </p>
                                                {msg.deliveryError && (
                                                    <p className="text-[11px] text-rose-500 mt-0.5 truncate" title={msg.deliveryError}>
                                                        Lỗi: {msg.deliveryError}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {getStatusBadge(msg.deliveryStatus)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                                                {msg.deliveryAttempts ?? 0} / 3
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                                                {msg.createdAt
                                                    ? new Date(msg.createdAt).toLocaleString('vi-VN')
                                                    : '—'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-2">
                                                    {msg.deliveryStatus !== 'SENT' && (
                                                        <button
                                                            onClick={() => handleRetry(msg)}
                                                            disabled={retryingId === msg.id}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            <RotateCw
                                                                size={12}
                                                                className={retryingId === msg.id ? 'animate-spin' : ''}
                                                            />
                                                            Thử lại
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/staff/tickets/${msg.ticketId}`}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                                                    >
                                                        Xem Ticket
                                                        <ExternalLink size={12} />
                                                    </Link>
                                                </div>
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
    );
}
