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
    Building2,
    Zap
} from 'lucide-react';

export default function StaffTicketListPage() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [slaOverview, setSlaOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [triggeringSla, setTriggeringSla] = useState(false);
    const [routingL14, setRoutingL14] = useState(false);
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
                await fetchTickets();
            } else {
                setSlaNotice(`⚠️ Kích hoạt SLA thất bại: ${data?.message || 'Lỗi không xác định'}`);
            }
            setTimeout(() => setSlaNotice(null), 6000);
        } catch (err: any) {
            setSlaNotice(`❌ Lỗi kết nối khi quét SLA: ${err?.message || 'Không thể gọi API'}`);
        } finally {
            setTriggeringSla(false);
        }
    };

    const handleTriggerL14 = async () => {
        setRoutingL14(true);
        setSlaNotice(null);
        try {
            const res = await fetch('http://localhost:8080/api/staff/tickets/auto-route-all', {
                method: 'POST',
                headers: getAuthHeaders(true)
            });
            const data = await res.json().catch(() => null);
            if (res.ok) {
                setSlaNotice(`🏢 ${data?.message || 'Đã kích hoạt phân chia phòng ban L14 qua n8n thành công!'}`);
                await fetchTickets();
            } else {
                setSlaNotice(`⚠️ Phân ban L14 thất bại: ${data?.message || 'Lỗi không xác định'}`);
            }
            setTimeout(() => setSlaNotice(null), 6000);
        } catch (err: any) {
            setSlaNotice(`❌ Lỗi kết nối phân ban L14: ${err?.message || 'Không thể gọi API'}`);
        } finally {
            setRoutingL14(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchSlaOverview();
    }, [channelFilter, intentFilter, urgencyFilter, needHumanReviewFilter]);

    const filteredTickets = tickets.filter(t => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (t.ticketCode && t.ticketCode.toLowerCase().includes(q)) ||
            (t.subject && t.subject.toLowerCase().includes(q)) ||
            (t.customerName && t.customerName.toLowerCase().includes(q)) ||
            (t.customerEmail && t.customerEmail.toLowerCase().includes(q))
        );
    });

    const getSlaBadge = (ticket: any) => {
        const slaStatus = ticket.slaStatus || (ticket.overdue ? 'BREACHED' : 'SAFE');
        const slaRatio = ticket.slaRatio;

        if (slaStatus === 'CRITICAL' || (slaRatio && slaRatio >= 1.5)) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <Clock size={11} className="animate-spin" /> Trễ &gt;150% (Đỏ)
                </span>
            );
        }
        if (slaStatus === 'BREACHED' || (slaRatio && slaRatio >= 1.0)) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    <Clock size={11} /> Quá hạn (Cam)
                </span>
            );
        }
        if (slaStatus === 'WARNING' || (slaRatio && slaRatio >= 0.8)) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock size={11} /> Cảnh báo 80% (Vàng)
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={11} /> An toàn
            </span>
        );
    };

    const getRiskScoreBadge = (score?: number) => {
        if (!score && score !== 0) return null;
        if (score >= 70) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <Flame size={11} /> Rủi ro cao: {score}/100
                </span>
            );
        }
        if (score >= 40) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Rủi ro TB: {score}/100
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Rủi ro thấp: {score}/100
            </span>
        );
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                L01 • L02 • L07 • L14
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Hộp thư tổng hợp & Điều phối</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <TicketIcon className="text-blue-600 shrink-0" size={26} />
                            <span>Inbox Ticket & Phân Luồng CSKH</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Hộp thư đa kênh • Giám sát SLA thời gian thực • Tự động phân chia phòng ban & gán chuyên viên
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            onClick={handleTriggerL14}
                            disabled={routingL14}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs active:scale-95 disabled:opacity-60 cursor-pointer"
                            title="Tự động phân loại phòng ban và điều phối nhân sự theo luồng L14"
                        >
                            <Building2 size={15} className={routingL14 ? 'animate-spin text-blue-600' : 'text-blue-600'} />
                            <span>{routingL14 ? 'Đang phân ban...' : '🏢 Phân Ban Tự Động (L14)'}</span>
                        </button>
                        <button
                            onClick={handleTriggerSla}
                            disabled={triggeringSla}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-2xs active:scale-95 disabled:opacity-60 cursor-pointer"
                            title="Kích hoạt n8n L07 quét SLA và cập nhật trạng thái tự động"
                        >
                            <Zap size={15} className={triggeringSla ? 'animate-spin' : ''} />
                            <span>{triggeringSla ? 'Đang quét SLA...' : '⚡ Quét SLA (L07)'}</span>
                        </button>
                        <button
                            onClick={fetchTickets}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
                        >
                            <RotateCcw size={14} className={loading ? 'animate-spin text-blue-600' : 'text-slate-400'} />
                            <span>Làm mới</span>
                        </button>
                    </div>
                </div>

                {/* SLA NOTIFICATION BANNER */}
                {slaNotice && (
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
                        <Zap size={15} className="text-blue-600 shrink-0" />
                        <span>{slaNotice}</span>
                    </div>
                )}

                {errorMsg && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* SLA OVERVIEW STRIP (L07) */}
                {slaOverview && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Tuân thủ SLA</span>
                            <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">{slaOverview.slaComplianceRate ?? 100}%</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">An toàn (&lt;80%)</span>
                            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{slaOverview.safeCount ?? 0}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] text-amber-600 font-bold uppercase tracking-wider block">Cảnh báo (80-100%)</span>
                            <span className="text-2xl font-black text-amber-600 font-mono mt-0.5 block">{slaOverview.warning80Count ?? 0}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                            <span className="text-[11px] text-orange-600 font-bold uppercase tracking-wider block">Quá hạn (100-150%)</span>
                            <span className="text-2xl font-black text-orange-600 font-mono mt-0.5 block">{slaOverview.breached100Count ?? 0}</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
                            <span className="text-[11px] text-rose-600 font-bold uppercase tracking-wider block">Trễ nặng (&gt;150%)</span>
                            <span className="text-2xl font-black text-rose-600 font-mono mt-0.5 block">{slaOverview.critical150Count ?? 0}</span>
                        </div>
                    </div>
                )}

                {/* FILTERS TOOLBAR */}
                <div className="p-4.5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 shadow-2xs">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {/* Search input */}
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm mã ticket, tiêu đề, khách hàng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 font-medium transition"
                            />
                        </div>

                        {/* Channel filter */}
                        <div>
                            <select
                                value={channelFilter}
                                onChange={(e) => setChannelFilter(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
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
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1 text-[11px]">
                            <Filter size={13} /> Lọc nhanh:
                        </span>
                        <button
                            onClick={() => setNeedHumanReviewFilter(null)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                                needHumanReviewFilter === null 
                                    ? 'bg-blue-600 text-white shadow-2xs' 
                                    : 'bg-slate-100 text-slate-600 hover:text-blue-700'
                            }`}
                        >
                            Tất cả ({tickets.length})
                        </button>
                        <button
                            onClick={() => setNeedHumanReviewFilter(true)}
                            className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                needHumanReviewFilter === true 
                                    ? 'bg-amber-500 text-white shadow-2xs' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            <ShieldAlert size={13} />
                            Cần nhân viên can thiệp (need_human_review)
                        </button>
                    </div>
                </div>

                {/* TICKET LIST TABLE */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    {loading ? (
                        <div className="p-14 text-center text-slate-500">
                            <RotateCcw className="animate-spin inline-block mb-3 text-blue-600" size={26} />
                            <p className="text-xs font-semibold">Đang tải danh sách ticket...</p>
                        </div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-14 text-center text-slate-400">
                            <TicketIcon className="inline-block mb-3 text-slate-300" size={38} />
                            <p className="font-bold text-slate-600 text-sm">Không có ticket nào thỏa mãn bộ lọc</p>
                            <p className="text-xs text-slate-400 mt-1">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200/90 bg-slate-50/80 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                                        <th className="py-3.5 px-4">Ticket</th>
                                        <th className="py-3.5 px-4">Khách Hàng / Kênh</th>
                                        <th className="py-3.5 px-4">Ý Định / Phụ Trách</th>
                                        <th className="py-3.5 px-4">Cờ Review</th>
                                        <th className="py-3.5 px-4">SLA (L07)</th>
                                        <th className="py-3.5 px-4">Rủi Ro (L06)</th>
                                        <th className="py-3.5 px-4 text-right">Chi Tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTickets.map((t) => (
                                        <tr key={t.id} className="hover:bg-blue-50/40 transition-colors">
                                            <td className="py-3.5 px-4 font-mono">
                                                <div className="font-bold text-blue-700">
                                                    #{t.ticketCode || t.id}
                                                </div>
                                                <div className="text-xs text-slate-700 font-medium max-w-xs truncate mt-0.5" title={t.subject}>
                                                    {t.subject || 'Yêu cầu hỗ trợ'}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <div className="text-slate-800 font-bold">
                                                    {t.customerName || 'Khách vãng lai'}
                                                </div>
                                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    {t.channel}
                                                </span>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                    {t.intent || 'CHỜ PHÂN LOẠI'}
                                                </span>
                                                <div className="text-[11px] text-slate-400 mt-1">
                                                    {t.assignee ? `👤 ${t.assignee}` : '⏳ Chưa phân công'} &bull; {t.status}
                                                </div>
                                            </td>

                                            <td className="py-3.5 px-4">
                                                {t.needHumanReview ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        <ShieldAlert size={11} /> Cần duyệt
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-400">
                                                        <Bot size={12} className="text-slate-400" /> Tự động
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
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-2xs"
                                                >
                                                    <span>Mở</span>
                                                    <ArrowRight size={12} />
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
