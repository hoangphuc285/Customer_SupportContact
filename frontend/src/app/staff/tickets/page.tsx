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
    Ticket as TicketIcon,
    ShieldAlert,
    Filter,
    CheckCircle2,
    Flame,
    Bot,
    Languages,
    Zap
} from 'lucide-react';

export default function StaffTicketListPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [slaOverview, setSlaOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [triggeringSla, setTriggeringSla] = useState(false);
    const [slaNotice, setSlaNotice] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Filters as specified in prompt table
    const [channelFilter, setChannelFilter] = useState('');
    const [intentFilter, setIntentFilter] = useState('');
    const [urgencyFilter, setUrgencyFilter] = useState('');
    const [needHumanReviewFilter, setNeedHumanReviewFilter] = useState<boolean | null>(null);

    const getAuthHeaders = (withJson = false): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (withJson) headers['Content-Type'] = 'application/json';
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    const fetchSlaOverview = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/sla/overview', { headers: getAuthHeaders() });
            if (res.ok) {
                setSlaOverview(await res.json());
            }
        } catch (err) {
            console.error('Lỗi tải SLA overview:', err);
        }
    };

    const fetchTickets = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const params = new URLSearchParams();
            if (channelFilter) params.append('channel', channelFilter);
            if (intentFilter) params.append('intent', intentFilter);
            if (urgencyFilter) params.append('priority', urgencyFilter);
            if (needHumanReviewFilter !== null) params.append('needHumanReview', String(needHumanReviewFilter));

            const res = await fetch(`http://localhost:8080/api/staff/tickets?${params.toString()}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setTickets(Array.isArray(data) ? data : []);
            } else {
                const errData = await res.json().catch(() => null);
                setErrorMsg(errData?.error || errData?.message || `Không thể tải danh sách ticket (HTTP ${res.status})`);
            }
        } catch (err: any) {
            console.error('Lỗi khi tải danh sách ticket từ DB:', err);
            setErrorMsg('Không thể kết nối máy chủ Backend để tải danh sách ticket.');
        } finally {
            setLoading(false);
        }
    };

    const handleTriggerSla = async () => {
        setTriggeringSla(true);
        setSlaNotice(null);
        try {
            const res = await fetch('http://localhost:8080/api/sla/trigger', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ actor: 'TICKET_INBOX', reason: 'Quét SLA từ danh sách Ticket' })
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.success) {
                setSlaNotice(`✅ ${data.message || 'Đã kích hoạt quét giám sát SLA L07!'}`);
                if (data.overview) {
                    setSlaOverview(data.overview);
                }
                await Promise.all([fetchTickets(), fetchSlaOverview()]);
                if (data.mode === 'N8N_WORKFLOW') {
                    setTimeout(() => {
                        fetchTickets();
                        fetchSlaOverview();
                    }, 2500);
                }
            } else {
                setSlaNotice('⚠️ Lỗi: ' + (data?.error || data?.message || `HTTP ${res.status}`));
            }
        } catch (err: any) {
            setSlaNotice('❌ Lỗi kết nối tới Backend SLA: ' + (err?.message || 'Unknown error'));
        } finally {
            setTriggeringSla(false);
            setTimeout(() => setSlaNotice(null), 7000);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchSlaOverview();
    }, [channelFilter, intentFilter, urgencyFilter, needHumanReviewFilter]);

    const filteredTickets = tickets.filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (t.ticketCode && t.ticketCode.toLowerCase().includes(q)) ||
            (t.subject && t.subject.toLowerCase().includes(q)) ||
            (t.customerName && t.customerName.toLowerCase().includes(q))
        );
    });

    const getSlaBadge = (ticket: any) => {
        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    Đã hoàn tất{ticket.slaBreached ? ' (Trễ SLA)' : ''}
                </span>
            );
        }
        if (ticket.slaBreached) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    SLA: Đỏ (Vi phạm)
                </span>
            );
        }
        if (ticket.dueAt) {
            const due = new Date(ticket.dueAt).getTime();
            const now = Date.now();
            const diffMins = Math.round((due - now) / 60000);
            if (diffMins <= 0) {
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        SLA: Đỏ (Quá hạn)
                    </span>
                );
            }
            if (diffMins <= 60) {
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Clock size={12} />
                        SLA: Vàng ({diffMins}p)
                    </span>
                );
            }
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={12} />
                SLA: Xanh (An toàn)
            </span>
        );
    };

    const getRiskScoreBadge = (score?: number) => {
        if (!score && score !== 0) return null;
        if (score >= 70) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
                    <Flame size={12} /> Rủi ro cao: {score}/100
                </span>
            );
        }
        if (score >= 40) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950 text-amber-400 border border-amber-800">
                    Rủi ro TB: {score}/100
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                Rủi ro thấp: {score}/100
            </span>
        );
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                L01, L02, L07
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                                Inbox Ticket & Phân luồng
                            </h1>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">
                            Hộp thư đa kênh tổng hợp, theo dõi SLA thời gian thực & cảnh báo can thiệp nhân viên
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={handleTriggerSla}
                            disabled={triggeringSla}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-sm font-black transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
                            title="Kích hoạt n8n L07 quét SLA và cập nhật trạng thái tự động"
                        >
                            <Zap size={16} className={triggeringSla ? 'animate-spin' : ''} />
                            <span>{triggeringSla ? 'Đang quét SLA...' : '⚡ Quét SLA (L07)'}</span>
                        </button>
                        <button
                            onClick={fetchTickets}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-semibold text-slate-200 transition-colors shadow-sm cursor-pointer"
                        >
                            <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* SLA NOTIFICATION BANNER */}
                {slaNotice && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <Zap size={15} className="text-amber-400 shrink-0" />
                        <span>{slaNotice}</span>
                    </div>
                )}

                {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle size={15} className="text-rose-400 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* SLA OVERVIEW STRIP (L07) */}
                {slaOverview && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-semibold block">Tuân thủ SLA</span>
                            <span className="text-lg font-black text-emerald-400 font-mono">{slaOverview.slaComplianceRate ?? 100}%</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                            <span className="text-[11px] text-slate-400 font-semibold block">An toàn (&lt;80%)</span>
                            <span className="text-lg font-black text-white font-mono">{slaOverview.safeCount ?? 0}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/20">
                            <span className="text-[11px] text-amber-400 font-semibold block">Cảnh báo (80-100%)</span>
                            <span className="text-lg font-black text-amber-400 font-mono">{slaOverview.warning80Count ?? 0}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-orange-500/20">
                            <span className="text-[11px] text-orange-400 font-semibold block">Quá hạn (100-150%)</span>
                            <span className="text-lg font-black text-orange-400 font-mono">{slaOverview.breached100Count ?? 0}</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/20 col-span-2 sm:col-span-1">
                            <span className="text-[11px] text-rose-400 font-semibold block">Nghiêm trọng (&gt;150%)</span>
                            <span className="text-lg font-black text-rose-400 font-mono">{slaOverview.critical150Count ?? 0}</span>
                        </div>
                    </div>
                )}

                {/* FILTERS TOOLBAR */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {/* Search input */}
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                type="text"
                                placeholder="Tìm mã ticket, tiêu đề, khách hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Channel filter */}
                        <div>
                            <select
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Tất cả kênh</option>
                                <option value="WEB">Cổng Web Khách</option>
                                <option value="LIVECHAT">Live Chat</option>
                                <option value="TELEGRAM">Telegram</option>
                                <option value="ZALO">Zalo OA</option>
                                <option value="EMAIL">Email</option>
                            </select>
                        </div>

                        {/* Intent filter */}
                        <div>
                            <select
                                value={intentFilter}
                                onChange={(e) => setIntentFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Tất cả Ý định (L02)</option>
                                <option value="COMPLAINT">Khiếu nại (L08)</option>
                                <option value="REFUND">Hoàn tiền (L09)</option>
                                <option value="WARRANTY">Bảo hành (L10)</option>
                                <option value="ORDER_STATUS">Tra cứu đơn (L02)</option>
                                <option value="FAQ">Hỏi đáp chính sách</option>
                            </select>
                        </div>

                        {/* Urgency filter */}
                        <div>
                            <select
                                value={urgencyFilter}
                                onChange={(e) => setUrgencyFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Độ khẩn cấp</option>
                                <option value="P1">P1 - Khẩn cấp / Nghiêm trọng</option>
                                <option value="P2">P2 - Cao</option>
                                <option value="P3">P3 - Trung bình</option>
                                <option value="P4">P4 - Thấp</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick filter pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
                        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
                            <Filter size={13} /> Lọc nhanh:
                        </span>
                        <button
                            onClick={() => setNeedHumanReviewFilter(null)}
                            className={`px-3 py-1 rounded-lg font-medium transition-all ${
                                needHumanReviewFilter === null 
                                    ? 'bg-indigo-600 text-white shadow' 
                                    : 'bg-slate-900 text-slate-400 hover:text-white'
                            }`}
                        >
                            Tất cả ({tickets.length})
                        </button>
                        <button
                            onClick={() => setNeedHumanReviewFilter(true)}
                            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                                needHumanReviewFilter === true 
                                    ? 'bg-amber-500 text-slate-950 shadow' 
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                            }`}
                        >
                            <ShieldAlert size={13} />
                            Cần nhân viên can thiệp (need_human_review)
                        </button>
                    </div>
                </div>

                {/* TICKET LIST TABLE */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">
                            <RotateCcw className="animate-spin inline-block mb-3" size={24} />
                            <p>Đang tải danh sách ticket...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <TicketIcon className="inline-block mb-3 opacity-30" size={36} />
                            <p className="font-medium text-slate-400">Không có ticket nào thỏa mãn bộ lọc</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                        <th className="py-3.5 px-4">Ticket</th>
                                        <th className="py-3.5 px-4">Khách hàng / Kênh</th>
                                        <th className="py-3.5 px-4">Ý định / Phụ trách</th>
                                        <th className="py-3.5 px-4">Cờ Review</th>
                                        <th className="py-3.5 px-4">SLA (L07)</th>
                                        <th className="py-3.5 px-4">Rủi ro (L06)</th>
                                        <th className="py-3.5 px-4 text-right">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredTickets.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-mono font-bold text-indigo-400">
                                                    #{t.ticketCode || t.id}
                                                </div>
                                                <div className="text-xs text-slate-300 font-medium max-w-xs truncate mt-0.5">
                                                    {t.subject || 'Yêu cầu hỗ trợ'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="text-white font-medium">
                                                    {t.customerName || 'Khách vãng lai'}
                                                </div>
                                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                                    {t.channel}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="px-2 py-1 rounded text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800">
                                                    {t.intent || 'CHỜ PHÂN LOẠI'}
                                                </span>
                                                <div className="text-[11px] text-slate-400 mt-1">
                                                    {t.assignee ? `👤 ${t.assignee}` : '⏳ Chưa phân công'} &bull; {t.status}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {t.needHumanReview ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                                                        <ShieldAlert size={12} /> Cần duyệt
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-slate-500">
                                                        <Bot size={13} className="text-slate-400" /> Tự động
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getSlaBadge(t)}
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {getRiskScoreBadge(t.riskScore)}
                                            </td>

                                            <td className="py-3.5 px-4 text-right">
                                                <Link
                                                    href={`/staff/tickets/${t.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow"
                                                >
                                                    Mở <ArrowRight size={13} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
