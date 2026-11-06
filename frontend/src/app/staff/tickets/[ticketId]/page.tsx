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
    AlertTriangle
} from 'lucide-react';

export default function ProcessTicketDetailPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [showTranslated, setShowTranslated] = useState(true);
    const [togglingAi, setTogglingAi] = useState(false);

    useEffect(() => {
        if (!ticketId) return;
        fetchDetail();
    }, [ticketId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Lỗi khi tải chi tiết ticket:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAi = async () => {
        if (!ticketId) return;
        setTogglingAi(true);
        try {
            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}/toggle-ai`, {
                method: 'PATCH'
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
                headers: { 'Content-Type': 'application/json' },
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
                                    L02, L03, L06
                                </span>
                                <h1 className="text-xl md:text-2xl font-black text-white">
                                    Chi tiết Ticket #{ticket.ticketCode || ticketId}
                                </h1>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Kênh: <strong className="text-slate-200">{ticket.channel}</strong> | Khách hàng: <strong className="text-slate-200">{ticket.customerName || 'Vãng lai'}</strong>
                            </p>
                        </div>
                    </div>

                    {/* AI LOCK BUTTON & TRANSLATE TOGGLE */}
                    <div className="flex items-center gap-2">
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
            </div>
        </ProtectedRoute>
    );
}
