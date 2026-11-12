'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    ArrowLeft, 
    Send, 
    Bot, 
    User, 
    Languages, 
    ShieldAlert, 
    Flame, 
    Lock, 
    Unlock, 
    RotateCcw,
    CheckCircle2,
    Clock,
    Sparkles,
    AlertTriangle,
    X,
    Zap,
    Building2
} from 'lucide-react';

export default function ProcessTicketDetailPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [showTranslated, setShowTranslated] = useState(true);
    const [togglingAi, setTogglingAi] = useState(false);

    // Luồng L13: Modal phản hồi & giải quyết ticket qua AI
    const [showL13Modal, setShowL13Modal] = useState(false);
    const [l13CaseType, setL13CaseType] = useState('GENERAL');
    const [l13Status, setL13Status] = useState('RESOLVED');
    const [l13Note, setL13Note] = useState('');
    const [l13Compensation, setL13Compensation] = useState('');
    const [l13Submitting, setL13Submitting] = useState(false);
    const [l13Notice, setL13Notice] = useState<string | null>(null);

    // Luồng L14: Tự động phân chia phòng ban & điều phối nhân sự
    const [routingL14, setRoutingL14] = useState(false);

    const getAuthHeaders = (withJson = false): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (withJson) headers['Content-Type'] = 'application/json';
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('jwt_token') || localStorage.getItem('agent_token');
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    };

    useEffect(() => {
        if (!ticketId) return;
        fetchDetail();
    }, [ticketId]);

    const fetchDetail = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                const err = await res.json().catch(() => null);
                setErrorMsg(err?.error || err?.message || `Không tải được ticket #${ticketId} (HTTP ${res.status})`);
            }
        } catch (err) {
            console.error('Lỗi khi tải chi tiết ticket:', err);
            setErrorMsg('Không thể kết nối máy chủ Backend.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAi = async () => {
        if (!ticketId) return;
        setTogglingAi(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}/toggle-ai`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const updatedTicket = await res.json();
                setData((prev: any) => ({
                    ...prev,
                    ticket: updatedTicket
                }));
            }
        } catch (err) {
            console.error('Lỗi toggle AI:', err);
        } finally {
            setTogglingAi(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sendingReply) return;
        setSendingReply(true);

        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ message: replyText.trim() })
            });
            if (res.ok) {
                const newMsg = await res.json();
                setData((prev: any) => ({
                    ...prev,
                    messages: [...(prev?.messages || []), newMsg]
                }));
                setReplyText('');
            }
        } catch (err) {
            console.error('Lỗi gửi trả lời:', err);
        } finally {
            setSendingReply(false);
        }
    };

    const handleL13Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!l13Note.trim() || l13Submitting) return;
        setL13Submitting(true);
        setL13Notice(null);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}/resolve`, {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({
                    case_type: l13CaseType,
                    status: l13Status,
                    response_note: l13Note.trim(),
                    compensation: l13Compensation.trim()
                })
            });
            const resJson = await res.json();
            if (res.ok && resJson.success) {
                setL13Notice('✅ Đã kích hoạt n8n L13 biên tập AI và gửi phản hồi cho khách hàng!');
                setTimeout(() => {
                    setShowL13Modal(false);
                    setL13Note('');
                    setL13Compensation('');
                    setL13Notice(null);
                    fetchDetail();
                }, 3000);
            } else {
                setL13Notice('⚠️ ' + (resJson.message || 'Lỗi khi gửi phản hồi'));
            }
        } catch (err: any) {
            setL13Notice('❌ Lỗi kết nối: ' + err.message);
        } finally {
            setL13Submitting(false);
        }
    };

    const handleAutoRouteL14 = async () => {
        if (!ticketId || routingL14) return;
        setRoutingL14(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}/auto-route`, {
                method: 'POST',
                headers: getAuthHeaders(true)
            });
            const resJson = await res.json().catch(() => null);
            if (res.ok && resJson?.success) {
                alert(`✅ ${resJson.message || 'Đã phân phối ticket đến phòng ban qua luồng n8n L14!'}`);
                setTimeout(() => fetchDetail(), 2500);
            } else {
                alert(`⚠️ ${resJson?.message || 'Không thể tự động điều phối phòng ban'}`);
            }
        } catch (err: any) {
            alert(`❌ Lỗi kết nối n8n L14: ${err?.message || 'Unknown error'}`);
        } finally {
            setRoutingL14(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="p-8 text-center text-slate-400">
                    <RotateCcw className="animate-spin inline-block mb-3" size={24} />
                    <p>Đang tải hội thoại ticket #{ticketId}...</p>
                </div>
            </ProtectedRoute>
        );
    }

    if (errorMsg || !data?.ticket) {
        return (
            <ProtectedRoute>
                <div className="p-8 max-w-2xl mx-auto text-center space-y-4 text-slate-200">
                    <AlertTriangle className="mx-auto text-rose-400" size={32} />
                    <p className="font-bold">{errorMsg || `Không tìm thấy ticket #${ticketId}`}</p>
                    <Link href="/staff/tickets" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold">
                        <ArrowLeft size={14} /> Quay lại danh sách Ticket
                    </Link>
                </div>
            </ProtectedRoute>
        );
    }

    const ticket = data?.ticket || {};
    const messages = data?.messages || [];

    const getSentimentBadge = (sentiment?: string) => {
        switch (sentiment) {
            case 'VERY_NEGATIVE':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">😡 Rất tiêu cực</span>;
            case 'NEGATIVE':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">🙁 Tiêu cực</span>;
            case 'POSITIVE':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">😊 Tích cực</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">😐 Trung tính</span>;
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto text-slate-100">
                {/* TOP BAR */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/staff/tickets"
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                    L02, L03, L06, L13, L14
                                </span>
                                <h1 className="text-xl md:text-2xl font-black text-white">
                                    Chi tiết Ticket #{ticket.ticketCode || ticketId}
                                </h1>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Kênh: <strong className="text-slate-200">{ticket.channel}</strong> | Khách hàng: <strong className="text-slate-200">{ticket.customerName || 'Vãng lai'}</strong> | Phụ trách: <strong className="text-slate-200">{ticket.assignee || 'Chưa phân công'}</strong> | Phòng ban: <strong className="text-indigo-400">{ticket.departmentName || ticket.departmentCode || 'Chưa phân'}</strong> | SLA: <strong className={ticket.slaBreached ? 'text-rose-400' : 'text-emerald-400'}>{ticket.slaBreached ? 'Vi phạm SLA' : 'Đang theo dõi'}</strong>
                            </p>
                        </div>
                    </div>

                    {/* AI LOCK BUTTON & TRANSLATE TOGGLE & ACTIONS */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAutoRouteL14}
                            disabled={routingL14}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                            title="Tự động phân tích nội dung để định tuyến phòng ban & gán nhân viên (L14)"
                        >
                            <Building2 size={14} className={routingL14 ? 'animate-spin' : ''} />
                            <span>{routingL14 ? 'Đang phân ban...' : 'Phân Ban (L14)'}</span>
                        </button>
                        <button
                            onClick={() => setShowTranslated(!showTranslated)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                showTranslated 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            <Languages size={15} />
                            {showTranslated ? 'Đang bật bản dịch (L03)' : 'Đang xem bản gốc'}
                        </button>

                        <button
                            onClick={handleToggleAi}
                            disabled={togglingAi}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                ticket.aiLocked
                                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 hover:bg-rose-500/30'
                                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                            }`}
                        >
                            {ticket.aiLocked ? (
                                <>
                                    <Lock size={15} />
                                    AI Đã Khóa (Chỉ trả lời tay)
                                </>
                            ) : (
                                <>
                                    <Unlock size={15} />
                                    AI Đang Mở (Tự động L05)
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setL13CaseType(ticket.category || ticket.intent || 'GENERAL');
                                setShowL13Modal(true);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer"
                            title="Soạn giải pháp thô, AI Gemini trau chuốt thành lời phản hồi ân cần và gửi đa kênh"
                        >
                            <Zap size={14} />
                            <span>Phản hồi AI & Đóng Ticket (L13)</span>
                        </button>
                    </div>
                </div>

                {/* METRICS STRIP: Sentiment, Risk Score, Intent, SLA */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Cảm xúc khách (Sentiment)
                        </div>
                        {getSentimentBadge(ticket.sentiment)}
                    </div>

                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Điểm rủi ro (L06 Leo thang)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-base font-black ${
                                (ticket.riskScore || 0) >= 70 ? 'text-rose-400' : (ticket.riskScore || 0) >= 40 ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                                {ticket.riskScore || 15}/100
                            </span>
                            {(ticket.riskScore || 0) >= 70 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    <Flame size={10} /> Nguy cơ cao
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Ý định trích xuất (L02)
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-400">
                            {ticket.intent || 'CHỜ PHÂN LOẠI'}
                        </span>
                    </div>

                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Cờ kiểm duyệt (L05/L03)
                        </div>
                        {ticket.needHumanReview ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                                <ShieldAlert size={13} /> Cần nhân viên duyệt
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <CheckCircle2 size={13} className="text-emerald-400" /> Tự động đạt chuẩn
                            </span>
                        )}
                    </div>
                </div>

                {/* CONVERSATION HISTORY */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[540px] shadow-2xl overflow-hidden">
                    {/* Message scroll area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                Chưa có tin nhắn nào trong hội thoại này
                            </div>
                        ) : (
                            messages.map((m: any) => {
                                const isCustomer = m.senderType === 'CUSTOMER';
                                const isAi = m.senderType === 'AI';
                                const isStaff = m.senderType === 'STAFF';

                                return (
                                    <div
                                        key={m.id}
                                        className={`flex flex-col ${
                                            isCustomer ? 'items-start' : 'items-end'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1 px-1 text-xs text-slate-400 font-medium">
                                            {isCustomer && <><User size={13} className="text-sky-400" /> <span>Khách hàng</span></>}
                                            {isAi && <><Bot size={13} className="text-purple-400" /> <span className="text-purple-400 font-bold">AI Assistant</span></>}
                                            {isStaff && <><Sparkles size={13} className="text-emerald-400" /> <span className="text-emerald-400 font-bold">Chuyên viên CSKH</span></>}
                                            <span>•</span>
                                            <span className="text-[11px] text-slate-500">
                                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>

                                        <div
                                            className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                                                isCustomer
                                                    ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
                                                    : isAi
                                                    ? 'bg-purple-950/40 border border-purple-800/60 text-purple-100 rounded-tr-sm'
                                                    : 'bg-indigo-600 text-white rounded-tr-sm'
                                            }`}
                                        >
                                            {/* Original vs Translated */}
                                            {showTranslated && m.contentTranslated && m.contentTranslated !== m.contentOriginal ? (
                                                <div className="space-y-2">
                                                    <div>{m.contentTranslated}</div>
                                                    <div className="pt-2 border-t border-slate-700/50 text-xs text-slate-400 italic">
                                                        <span className="font-semibold text-slate-500">Bản gốc ({m.language || 'auto'}):</span> {m.contentOriginal}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>{m.contentOriginal || m.content || m.message}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* MANUAL REPLY BOX */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800">
                        {ticket.aiLocked && (
                            <div className="mb-2 text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                                <Lock size={13} /> Chế độ can thiệp thủ công: AI đã bị khóa cho ticket này. Mọi tin nhắn sẽ do bạn gửi trực tiếp.
                            </div>
                        )}
                        <form onSubmit={handleSendReply} className="flex gap-2">
                            <input
                                type="text"
                                placeholder={ticket.aiLocked ? "Nhập câu trả lời tay gửi khách hàng..." : "Nhập câu trả lời thủ công (sẽ ghi nhận dưới danh nghĩa Chuyên viên)..."}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                disabled={!replyText.trim() || sendingReply}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow"
                            >
                                <Send size={15} />
                                Gửi
                            </button>
                        </form>
                    </div>
                </div>

                {/* MODAL PHẢN HỒI NGHIỆP VỤ L13 */}
                {showL13Modal && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        <Zap size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white">
                                            Phản Hồi Nghiệp Vụ & Đóng Ticket (L13)
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            AI Gemini sẽ trau chuốt giải pháp thô thành câu trả lời ân cần gửi khách hàng
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowL13Modal(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {l13Notice && (
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
                                    <Zap size={15} className="shrink-0 text-amber-400" />
                                    <span>{l13Notice}</span>
                                </div>
                            )}

                            <form onSubmit={handleL13Submit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                                            Loại vụ việc (Case Type)
                                        </label>
                                        <select
                                            value={l13CaseType}
                                            onChange={(e) => setL13CaseType(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="GENERAL">Hỗ trợ chung (GENERAL)</option>
                                            <option value="COMPLAINT">Khiếu nại (COMPLAINT)</option>
                                            <option value="REFUND">Hoàn tiền (REFUND)</option>
                                            <option value="WARRANTY">Bảo hành (WARRANTY)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                                            Trạng thái xử lý
                                        </label>
                                        <select
                                            value={l13Status}
                                            onChange={(e) => setL13Status(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                                        >
                                            <option value="RESOLVED">RESOLVED (Đã giải quyết)</option>
                                            <option value="PAID">PAID (Đã hoàn tiền)</option>
                                            <option value="REJECTED">REJECTED (Từ chối hoàn tiền)</option>
                                            <option value="CLOSED">CLOSED (Đóng ca bảo hành)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                                        Nội dung giải pháp thực tế từ nhân viên <span className="text-rose-400">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Ví dụ: Kỹ thuật viên đã kiểm tra lại cấu hình tài khoản, xử lý xong lỗi đăng nhập và đồng bộ dữ liệu bình thường..."
                                        value={l13Note}
                                        onChange={(e) => setL13Note(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                        required
                                    />
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Chỉ cần ghi vắn tắt ý chính kỹ thuật, Gemini sẽ tự định dạng thư chào, xin lỗi và hướng dẫn khách.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                                        Quà bồi thường / Tri ân (nếu có)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: Voucher giảm 10% (mã: VKU10), Đổi mới sản phẩm..."
                                        value={l13Compensation}
                                        onChange={(e) => setL13Compensation(e.target.value)}
                                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setShowL13Modal(false)}
                                        disabled={l13Submitting}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!l13Note.trim() || l13Submitting}
                                        className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition shadow-md disabled:opacity-50"
                                    >
                                        <Zap size={14} className={l13Submitting ? 'animate-spin' : ''} />
                                        <span>{l13Submitting ? 'Đang gửi qua n8n AI...' : 'Xác nhận & Gửi phản hồi AI (L13)'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
