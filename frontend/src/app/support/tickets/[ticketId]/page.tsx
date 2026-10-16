'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SupportHeader from '@/components/SupportHeader';
import { TicketDetail, TicketLog, TICKET_STATUS_MAP } from '@/types/support';
import { 
    ArrowLeft, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    ThumbsUp, 
    ThumbsDown, 
    Copy, 
    Check, 
    Sparkles, 
    Calendar
} from 'lucide-react';
import { formatCategory, formatPriority, formatLogAction } from '@/utils/formatters';

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketCodeParam = params.ticketId as string;

    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [feedbackText, setFeedbackText] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchTicketAndLogs = useCallback(async () => {
        try {
            setLoading(true);
            let ticketRes = await fetch(`http://localhost:8080/api/tickets/code/${ticketCodeParam}`);
            if (!ticketRes.ok) {
                ticketRes = await fetch(`http://localhost:8080/api/tickets/${ticketCodeParam}`);
            }

            if (!ticketRes.ok) {
                setTicket(null);
                return;
            }

            const ticketData: TicketDetail = await ticketRes.json();
            const logsRes = await fetch(`http://localhost:8080/api/tickets/${ticketData.id}/logs`);
            let logsData: TicketLog[] = [];
            if (logsRes.ok) {
                logsData = await logsRes.json();
            }

            setTicket({
                ...ticketData,
                logs: logsData,
            });
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu ticket:', err);
        } finally {
            setLoading(false);
        }
    }, [ticketCodeParam]);

    useEffect(() => {
        if (ticketCodeParam) {
            fetchTicketAndLogs();
        }
    }, [ticketCodeParam, fetchTicketAndLogs]);

    const handleSendFeedback = async (isSatisfied: boolean) => {
        if (!ticket) return;
        setSubmittingFeedback(true);

        try {
            // 1. Ghi log lịch sử phản hồi
            await fetch(`http://localhost:8080/api/tickets/${ticket.id}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CUSTOMER_FEEDBACK',
                    note: feedbackText || (isSatisfied ? 'Khách hàng hài lòng với giải pháp' : 'Khách hàng chưa hài lòng với giải pháp và yêu cầu xử lý lại'),
                    performedBy: 'CUSTOMER',
                }),
            });

            // 2. Cập nhật trạng thái và kích hoạt quy trình tự động
            if (isSatisfied) {
                await fetch(`http://localhost:8080/api/tickets/${ticket.id}/close`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'CLOSED',
                        satisfaction: 'SATISFIED',
                        result: 'RESOLVED',
                    }),
                });
            } else {
                await fetch(`http://localhost:8080/api/tickets/${ticket.id}/customer-feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: feedbackText || 'Khách hàng chưa hài lòng với giải pháp và yêu cầu xử lý lại',
                        customerId: ticket.customerId,
                    }),
                });
            }

            alert(isSatisfied ? '🎉 Cảm ơn bạn đã xác nhận và đánh giá hài lòng! Phiếu hỗ trợ đã được đóng hoàn tất.' : 'Hệ thống đã nhận phản hồi chưa hài lòng và chuyển chuyên viên hỗ trợ lại.');
            setFeedbackText('');
            fetchTicketAndLogs();
        } catch (err) {
            console.error('Lỗi gửi feedback:', err);
            alert('Gửi phản hồi thất bại, vui lòng thử lại sau.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const copyTicketCode = () => {
        if (ticket?.ticketCode) {
            navigator.clipboard.writeText(ticket.ticketCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <SupportHeader />
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm font-semibold text-slate-500">Đang tra cứu dữ liệu phiếu hỗ trợ...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <SupportHeader />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl text-center max-w-md w-full border border-slate-200/80 space-y-4">
                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertCircle size={28} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy phiếu hỗ trợ</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Mã phiếu hỗ trợ <strong>"{ticketCodeParam}"</strong> không tồn tại trong hệ thống. Vui lòng kiểm tra lại mã đã nhận qua email.
                        </p>
                        <div className="pt-2 flex flex-col gap-2">
                            <Link
                                href="/support/tickets"
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
                            >
                                Thử tra cứu lại
                            </Link>
                            <Link
                                href="/support"
                                className="w-full py-2.5 text-slate-600 text-sm font-semibold hover:text-slate-900"
                            >
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const statusInfo = TICKET_STATUS_MAP[ticket.status] || TICKET_STATUS_MAP.NEW;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <SupportHeader />

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
                <div className="flex items-center justify-between">
                    <Link
                        href="/support"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition"
                    >
                        <ArrowLeft size={16} /> Quay lại trang chủ
                    </Link>

                    <button
                        onClick={copyTicketCode}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 shadow-2xs transition cursor-pointer"
                    >
                        {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        <span>Sao chép mã phiếu hỗ trợ</span>
                    </button>
                </div>

                {/* TICKET MAIN CARD */}
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
                    {/* TOP STATUS BAR */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                                Mã định danh yêu cầu
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight mt-0.5">
                                {ticket.ticketCode || `#${ticket.id}`}
                            </h1>
                        </div>

                        <div className={`px-3.5 py-1.5 rounded-2xl border text-sm font-semibold flex items-center gap-2 ${statusInfo.colorClass}`}>
                            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                            <span>{statusInfo.label}</span>
                        </div>
                    </div>

                    {/* SUBJECT & METADATA */}
                    <div className="space-y-3">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                            {ticket.subject}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={15} className="text-slate-400" />
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('vi-VN') : '—'}
                            </span>
                            {ticket.category && (
                                <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                                    {formatCategory(ticket.category)}
                                </span>
                            )}
                            {ticket.priority && (
                                <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200">
                                    Ưu tiên: {formatPriority(ticket.priority)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* RESOLUTION CALLOUT (NẾU CÓ) */}
                    {ticket.resolution && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-bold uppercase tracking-wider">
                                    <CheckCircle2 size={18} className="text-emerald-600" />
                                    <span>Kết quả xử lý từ Chuyên viên chăm sóc khách hàng</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 px-3 py-0.5 rounded-full">
                                    Đã giải quyết
                                </span>
                            </div>

                            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-white/70 p-4 rounded-xl border border-emerald-100 font-medium">
                                {ticket.resolution}
                            </p>
                        </div>
                    )}

                    {/* FEEDBACK SECTION KHI TICKET RESOLVED */}
                    {ticket.status === 'RESOLVED' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Sparkles size={16} className="text-indigo-600" />
                                    <span>Đánh giá mức độ hài lòng của bạn</span>
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                    Giải pháp trên đã giải quyết được vấn đề của bạn chưa? Phản hồi của bạn giúp chúng tôi nâng cao chất lượng dịch vụ.
                                </p>
                            </div>

                            <textarea
                                rows={3}
                                placeholder="Nhập thêm nhận xét hoặc phản hồi của bạn (không bắt buộc)..."
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-y font-sans"
                            />

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => handleSendFeedback(true)}
                                    disabled={submittingFeedback}
                                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                                >
                                    <ThumbsUp size={16} />
                                    <span>Hài lòng (Xác nhận đóng phiếu hỗ trợ)</span>
                                </button>
                                <button
                                    onClick={() => handleSendFeedback(false)}
                                    disabled={submittingFeedback}
                                    className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50"
                                >
                                    <ThumbsDown size={16} />
                                    <span>Chưa hài lòng (Yêu cầu xử lý lại)</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TIMELINE LOGS */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                <Clock size={16} className="text-slate-400" />
                                <span>Lịch sử xử lý phiếu hỗ trợ</span>
                            </h3>
                            <span className="text-xs text-slate-400">
                                {ticket.logs?.length || 0} mốc ghi nhận
                            </span>
                        </div>

                        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100">
                            {ticket.logs && ticket.logs.length > 0 ? (
                                ticket.logs.map((log: TicketLog) => (
                                    <div key={log.id} className="relative group">
                                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-indigo-50" />
                                        <div className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-2xl border border-slate-200/60 transition space-y-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-semibold">
                                                <span>{log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}</span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                                    {log.performedBy === 'CUSTOMER' ? 'Khách hàng' : log.performedBy === 'AGENT' ? 'Chuyên viên' : 'Hệ thống AI'}
                                                </span>
                                            </div>
                                            <div className="text-xs sm:text-sm font-bold text-slate-900">{formatLogAction(log.action)}</div>
                                            {log.note && (
                                                <p className="text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60 mt-1 leading-relaxed">
                                                    {log.note}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 py-2">Chưa có ghi nhận tiến trình mới.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}