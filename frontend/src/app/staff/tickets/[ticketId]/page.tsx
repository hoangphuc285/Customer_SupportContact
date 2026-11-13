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
            console.error('Lỗi khi toggle AI:', err);
        } finally {
            setTogglingAi(false);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || sendingReply) return;

        setSendingReply(true);
        try {
            const savedInfo = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            let staffName = 'Chuyên viên CSKH';
            let staffId = 4;
            if (savedInfo) {
                try {
                    const u = JSON.parse(savedInfo);
                    if (u.fullName || u.name) staffName = u.fullName || u.name;
                    if (u.id) staffId = u.id;
                } catch (e) {}
            }

            const res = await fetch(`http://localhost:8080/api/staff/tickets/${ticketId}/reply`, {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({
                    message: replyText.trim(),
                    staffId: staffId,
                    staffName: staffName
                })
            });

            if (res.ok) {
                const newMsg = await res.json();
                setData((prev: any) => ({
                    ...prev,
                    messages: [...(prev?.messages || []), newMsg]
                }));
                setReplyText('');
            } else {
                alert('Không thể gửi tin nhắn.');
            }
        } catch (err) {
            console.error('Lỗi gửi reply:', err);
            alert('Lỗi kết nối khi gửi phản hồi.');
        } finally {
            setSendingReply(false);
        }
    };

    const handleAutoRouteL14 = async () => {
        if (!ticketId) return;
        setRoutingL14(true);
        try {
            const res = await fetch(`http://localhost:8080/api/portal/departments/assign/${ticketId}`, {
                method: 'POST',
                headers: getAuthHeaders(true)
            });
            const result = await res.json().catch(() => null);
            if (res.ok && result?.success) {
                alert(`✅ Đã phân công thành công:\n- Phòng ban: ${result.department_name}\n- Nhân viên: ${result.assigned_staff_name}`);
                await fetchDetail();
            } else {
                alert(`⚠️ Phân ban thất bại: ${result?.message || 'Lỗi không xác định'}`);
            }
        } catch (err: any) {
            alert(`❌ Lỗi kết nối phân ban L14: ${err?.message || 'Không thể gọi API'}`);
        } finally {
            setRoutingL14(false);
        }
    };

    const handleL13Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setL13Submitting(true);
        setL13Notice(null);

        try {
            const savedInfo = localStorage.getItem('user_account') || localStorage.getItem('user_info');
            let staffName = 'Chuyên viên CSKH';
            let staffId = 4;
            if (savedInfo) {
                try {
                    const u = JSON.parse(savedInfo);
                    if (u.fullName || u.name) staffName = u.fullName || u.name;
                    if (u.id) staffId = u.id;
                } catch (e) {}
            }

            const payload = {
                ticket_id: Number(ticketId),
                case_type: l13CaseType,
                resolution_status: l13Status,
                internal_note: l13Note || 'Đã kiểm tra và xử lý xong yêu cầu của quý khách.',
                compensation_note: l13Compensation || '',
                staff_id: staffId,
                staff_name: staffName,
                channel: ticket.channel || 'WEB'
            };

            const res = await fetch('http://localhost:8080/api/portal/staff-response/trigger', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify(payload)
            });

            const resData = await res.json().catch(() => null);

            if (res.ok) {
                setL13Notice(`✅ ${resData?.message || 'Đã kích hoạt Luồng 13 (AI Soạn thư & Đóng Ticket) thành công!'}`);
                setTimeout(() => {
                    setShowL13Modal(false);
                    setL13Notice(null);
                    fetchDetail();
                }, 2000);
            } else {
                setL13Notice(`⚠️ Thất bại: ${resData?.message || 'Không thể kích hoạt Luồng 13'}`);
            }
        } catch (err: any) {
            console.error('Lỗi Luồng 13:', err);
            setL13Notice(`❌ Lỗi kết nối máy chủ: ${err?.message || 'Không thể gửi yêu cầu'}`);
        } finally {
            setL13Submitting(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="p-16 text-center text-slate-500">
                    <RotateCcw className="animate-spin inline-block mb-3 text-blue-600" size={28} />
                    <p className="text-xs font-semibold">Đang tải chi tiết Ticket #{ticketId}...</p>
                </div>
            </ProtectedRoute>
        );
    }

    if (errorMsg || !data?.ticket) {
        return (
            <ProtectedRoute>
                <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
                    <AlertTriangle className="mx-auto text-rose-500" size={32} />
                    <p className="font-bold text-slate-800 text-sm">{errorMsg || `Không tìm thấy ticket #${ticketId}`}</p>
                    <Link href="/staff/tickets" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs">
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
                return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">😡 Rất tiêu cực</span>;
            case 'NEGATIVE':
                return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">🙁 Tiêu cực</span>;
            case 'POSITIVE':
                return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">😊 Tích cực</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">😐 Trung tính</span>;
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                {/* TOP BAR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/staff/tickets"
                            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl text-slate-600 hover:text-blue-700 transition shadow-2xs"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                                    L02 • L03 • L06 • L13 • L14
                                </span>
                                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                    Ticket #{ticket.ticketCode || ticketId}
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Kênh: <strong className="text-slate-800">{ticket.channel}</strong> | Khách: <strong className="text-slate-800">{ticket.customerName || 'Vãng lai'}</strong> | Phụ trách: <strong className="text-blue-700">{ticket.assignee || 'Chưa phân công'}</strong> | Phòng ban: <strong className="text-blue-700">{ticket.departmentName || ticket.departmentCode || 'Chưa phân'}</strong> | SLA: <strong className={ticket.slaBreached ? 'text-rose-600' : 'text-emerald-600'}>{ticket.slaBreached ? 'Vi phạm SLA' : 'Đang theo dõi'}</strong>
                            </p>
                        </div>
                    </div>

                    {/* AI LOCK BUTTON & TRANSLATE TOGGLE & ACTIONS */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleAutoRouteL14}
                            disabled={routingL14}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                            title="Tự động phân tích nội dung để định tuyến phòng ban & gán nhân viên (L14)"
                        >
                            <Building2 size={14} className={routingL14 ? 'animate-spin text-blue-600' : ''} />
                            <span>{routingL14 ? 'Đang phân ban...' : 'Phân Ban (L14)'}</span>
                        </button>

                        <button
                            onClick={() => setShowTranslated(!showTranslated)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition shadow-2xs cursor-pointer ${
                                showTranslated 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <Languages size={14} />
                            <span>{showTranslated ? 'Bản dịch (L03)' : 'Bản gốc'}</span>
                        </button>

                        <button
                            onClick={handleToggleAi}
                            disabled={togglingAi}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-2xs cursor-pointer ${
                                ticket.aiLocked
                                    ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            {ticket.aiLocked ? (
                                <>
                                    <Lock size={14} />
                                    <span>AI Đã Khóa (Trả lời tay)</span>
                                </>
                            ) : (
                                <>
                                    <Unlock size={14} />
                                    <span>AI Đang Mở (Tự động L05)</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setL13CaseType(ticket.category || ticket.intent || 'GENERAL');
                                setShowL13Modal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                            title="Soạn giải pháp thô, AI Gemini trau chuốt thành lời phản hồi ân cần và gửi đa kênh"
                        >
                            <Zap size={14} />
                            <span>Phản hồi AI & Đóng Ticket (L13)</span>
                        </button>
                    </div>
                </div>

                {/* METRICS STRIP: Sentiment, Risk Score, Intent, SLA */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Cảm xúc khách (Sentiment)
                        </div>
                        {getSentimentBadge(ticket.sentiment)}
                    </div>

                    <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Điểm rủi ro (L06 Leo thang)
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xl font-black ${
                                (ticket.riskScore || 0) >= 70 ? 'text-rose-600' : (ticket.riskScore || 0) >= 40 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                                {ticket.riskScore || 15}/100
                            </span>
                            {(ticket.riskScore || 0) >= 70 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <Flame size={10} /> Nguy cơ cao
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Ý định trích xuất (L02)
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-700">
                            {ticket.intent || 'CHỜ PHÂN LOẠI'}
                        </span>
                    </div>

                    <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Cờ kiểm duyệt (L05/L03)
                        </div>
                        {ticket.needHumanReview ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                                <ShieldAlert size={13} className="text-amber-600" /> Cần nhân viên duyệt
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                                <CheckCircle2 size={13} className="text-emerald-600" /> Tự động đạt chuẩn
                            </span>
                        )}
                    </div>
                </div>

                {/* CONVERSATION HISTORY */}
                <div className="bg-white border border-slate-200/90 rounded-2xl flex flex-col h-[540px] shadow-2xs overflow-hidden">
                    {/* Message scroll area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
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
                                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 font-medium">
                                            {isCustomer && <><User size={12} className="text-blue-600" /> <span className="font-semibold text-slate-700">Khách hàng</span></>}
                                            {isAi && <><Bot size={12} className="text-amber-600" /> <span className="text-amber-700 font-bold">AI Assistant</span></>}
                                            {isStaff && <><Sparkles size={12} className="text-blue-600" /> <span className="text-blue-700 font-bold">Chuyên viên CSKH</span></>}
                                            <span>•</span>
                                            <span className="text-[10px] text-slate-400">
                                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>

                                        <div
                                            className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                                                isCustomer
                                                    ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                                                    : isAi
                                                    ? 'bg-blue-50 border border-blue-100 text-blue-900 rounded-tr-xs font-medium'
                                                    : 'bg-blue-600 text-white rounded-tr-xs font-medium'
                                            }`}
                                        >
                                            {/* Original vs Translated */}
                                            {showTranslated && m.contentTranslated && m.contentTranslated !== m.contentOriginal ? (
                                                <div className="space-y-1.5">
                                                    <div>{m.contentTranslated}</div>
                                                    <div className="pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-500 italic">
                                                        <span className="font-semibold text-slate-600">Bản gốc ({m.language || 'auto'}):</span> {m.contentOriginal}
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
                    <div className="p-3.5 bg-white border-t border-slate-200/90">
                        {ticket.aiLocked && (
                            <div className="mb-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1.5">
                                <Lock size={12} /> Chế độ thủ công: AI đã bị khóa cho ticket này. Mọi tin nhắn sẽ do bạn gửi trực tiếp.
                            </div>
                        )}
                        <form onSubmit={handleSendReply} className="flex gap-2">
                            <input
                                type="text"
                                placeholder={ticket.aiLocked ? "Nhập câu trả lời tay gửi khách hàng..." : "Nhập câu trả lời thủ công (sẽ ghi nhận dưới danh nghĩa Chuyên viên)..."}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                            <button
                                type="submit"
                                disabled={!replyText.trim() || sendingReply}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-2xs cursor-pointer"
                            >
                                <Send size={14} />
                                <span>Gửi</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* MODAL PHẢN HỒI NGHIỆP VỤ L13 */}
                {showL13Modal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                                        <Zap size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900">
                                            Phản Hồi Nghiệp Vụ & Đóng Ticket (L13)
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            AI Gemini sẽ trau chuốt giải pháp thô thành câu trả lời ân cần gửi khách hàng
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowL13Modal(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {l13Notice && (
                                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
                                    <Zap size={15} className="shrink-0 text-blue-600" />
                                    <span>{l13Notice}</span>
                                </div>
                            )}

                            <form onSubmit={handleL13Submit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Loại vụ việc (Case Type)
                                        </label>
                                        <select
                                            value={l13CaseType}
                                            onChange={(e) => setL13CaseType(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="GENERAL">Hỗ trợ chung</option>
                                            <option value="COMPLAINT">Khiếu nại dịch vụ (L08)</option>
                                            <option value="REFUND">Hoàn tiền đổi trả (L09)</option>
                                            <option value="WARRANTY">Bảo hành kỹ thuật (L10)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">
                                            Trạng thái đóng Ticket
                                        </label>
                                        <select
                                            value={l13Status}
                                            onChange={(e) => setL13Status(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                                            <option value="CLOSED">Đóng Ticket hoàn tất (CLOSED)</option>
                                            <option value="IN_PROGRESS">Cần bổ sung thêm (IN_PROGRESS)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Ghi chú / Giải pháp xử lý từ nhân viên:
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={l13Note}
                                        onChange={(e) => setL13Note(e.target.value)}
                                        placeholder="Ví dụ: Đã kiểm tra serial máy hợp lệ, đã thay pin mới và tặng phiếu bảo dưỡng..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Bồi thường / Đền bù bổ sung (nếu có):
                                    </label>
                                    <input
                                        type="text"
                                        value={l13Compensation}
                                        onChange={(e) => setL13Compensation(e.target.value)}
                                        placeholder="Ví dụ: Tặng voucher giảm giá 50.000đ mã VC50K..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="flex justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowL13Modal(false)}
                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={l13Submitting}
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                                    >
                                        <Zap size={14} className={l13Submitting ? 'animate-spin' : ''} />
                                        <span>{l13Submitting ? 'Đang kích hoạt...' : 'Kích hoạt Luồng 13 & Gửi'}</span>
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
