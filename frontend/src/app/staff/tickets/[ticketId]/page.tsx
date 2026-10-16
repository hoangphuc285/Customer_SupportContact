'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
    ArrowLeft, 
    Save, 
    Sparkles, 
    Clock, 
    User, 
    Mail, 
    Phone, 
    FileText
} from 'lucide-react';
import { 
    formatStatus, 
    formatPriority, 
    formatCategory, 
    formatLogAction,
    STATUS_MAP,
    PRIORITY_MAP
} from '@/utils/formatters';

export default function ProcessTicketDetailPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;

    const [ticket, setTicket] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolutionText, setResolutionText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [generatingDraft, setGeneratingDraft] = useState(false);
    const [agentName, setAgentName] = useState('Chuyên viên CSKH');

    useEffect(() => {
        if (!ticketId) return;

        const savedInfo = localStorage.getItem('user_account') || localStorage.getItem('user_info');
        if (savedInfo) {
            try {
                const user = JSON.parse(savedInfo);
                if (user.name) setAgentName(user.name);
            } catch (e) {
                console.error(e);
            }
        }

        fetchTicketAndLogs();
    }, [ticketId]);

    const fetchTicketAndLogs = async () => {
        setLoading(true);
        try {
            const [resTicket, resLogs] = await Promise.all([
                fetch(`http://localhost:8080/api/agent/tickets/${ticketId}`),
                fetch(`http://localhost:8080/api/tickets/${ticketId}/logs`)
            ]);

            if (resTicket.ok) {
                const ticketData = await resTicket.json();
                setTicket(ticketData);
                if (ticketData.resolution) setResolutionText(ticketData.resolution);
            }

            if (resLogs.ok) {
                const logsData = await resLogs.json();
                setLogs(Array.isArray(logsData) ? logsData : []);
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu Ticket và Logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAiDraft = async () => {
        setGeneratingDraft(true);
        try {
            const res = await fetch(`http://localhost:8080/api/agent/tickets/${ticketId}/generate-ai-draft`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawAgentNote: 'Đã kiểm tra và xử lý xong sự cố cho khách hàng' }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.aiDraft) {
                    setResolutionText(data.aiDraft);
                }
            } else {
                setResolutionText(
                    `Kính gửi quý khách,\n\nBộ phận hỗ trợ đã tiếp nhận và xử lý yêu cầu #${ticket?.ticketCode || ticketId}.\nSự cố của bạn đã được kiểm tra và khắc phục hoàn tất.\n\nNếu cần hỗ trợ thêm thông tin, xin vui lòng phản hồi lại ticket này.\n\nTrân trọng,\nĐội ngũ CSKH Support Center.`
                );
            }
        } catch (err) {
            setResolutionText(
                `Kính gửi quý khách,\n\nBộ phận hỗ trợ đã tiếp nhận và xử lý yêu cầu #${ticket?.ticketCode || ticketId}.\nSự cố của bạn đã được kiểm tra và khắc phục hoàn tất.\n\nTrân trọng,\nĐội ngũ CSKH Support Center.`
            );
        } finally {
            setGeneratingDraft(false);
        }
    };

    const handleSaveAndTriggerN8n = async () => {
        if (!resolutionText.trim()) return alert('Vui lòng nhập nội dung giải pháp xử lý!');
        setSubmitting(true);

        try {
            const res = await fetch(`http://localhost:8080/api/agent/tickets/${ticketId}/send-resolution`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    finalResolution: resolutionText,
                    agentName: agentName,
                }),
            });

            if (res.ok) {
                alert('✅ Đã lưu kết quả vào CSDL, ghi log và kích hoạt n8n Luồng 3 thành công!');
                fetchTicketAndLogs();
            } else {
                alert('Lưu kết quả thất bại!');
            }
        } catch (err) {
            alert('Đã xảy ra lỗi khi kết nối Server!');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDateTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="p-16 text-center text-sm font-semibold text-slate-500">
                    Đang tải thông tin chi tiết ticket...
                </div>
            </ProtectedRoute>
        );
    }

    const statusMeta = STATUS_MAP[String(ticket?.status || '').toUpperCase()];
    const statusLabel = statusMeta?.label || formatStatus(ticket?.status);
    const statusBg = statusMeta?.bg || 'bg-slate-100';
    const statusColor = statusMeta?.color || 'text-slate-700';
    const statusBorder = statusMeta?.border || 'border-slate-200';

    const priorityMeta = PRIORITY_MAP[String(ticket?.priority || '').toUpperCase()];
    const priorityLabel = priorityMeta?.label || formatPriority(ticket?.priority);
    const priorityBg = priorityMeta?.bg || 'bg-slate-100';
    const priorityColor = priorityMeta?.color || 'text-slate-700';
    const priorityBorder = priorityMeta?.border || 'border-slate-200';

    return (
        <ProtectedRoute>
            <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <Link
                        href="/staff/tickets"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition"
                    >
                        <ArrowLeft size={16} /> Quay lại danh sách Ticket
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-slate-500 font-medium">Trạng thái:</span>
                        <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${statusBg} ${statusColor} ${statusBorder}`}>
                            {statusLabel}
                        </span>
                    </div>
                </div>

                {/* TICKET HEADER OVERVIEW */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <span className="font-mono text-xs sm:text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                {ticket?.ticketCode || `#${ticket?.id}`}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2.5">
                                {ticket?.subject}
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {ticket?.priority && (
                                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold border ${priorityBg} ${priorityColor} ${priorityBorder}`}>
                                    Ưu tiên: {priorityLabel}
                                </span>
                            )}
                            {ticket?.category && (
                                <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {formatCategory(ticket.category)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <User size={16} className="text-slate-400" />
                            <span>Khách hàng: <strong className="text-slate-800">{ticket?.customerName || 'Khách vãng lai'}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={16} className="text-slate-400" />
                            <span>{ticket?.customerEmail || 'Chưa có email'}</span>
                        </div>
                        {ticket?.customerPhone && (
                            <div className="flex items-center gap-2">
                                <Phone size={16} className="text-slate-400" />
                                <span>{ticket.customerPhone}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2-COLUMN WORKBENCH */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: REQUEST & TIMELINE */}
                    <div className="space-y-6">
                        {/* INITIAL DESCRIPTION */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} />
                                <span>Nội dung yêu cầu ban đầu</span>
                            </h3>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                                {ticket?.description || ticket?.subject}
                            </div>
                        </div>

                        {/* ACTIVITY LOGS */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>Lịch sử Log & Phản hồi</span>
                                </h3>
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                    {logs.length} bản ghi
                                </span>
                            </div>

                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                {logs.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có lịch sử ghi nhận.</p>
                                ) : (
                                    logs.map((log: any) => {
                                        const isCustomer = log.performedBy === 'CUSTOMER';
                                        const isAgent = log.performedBy === 'AGENT';

                                        return (
                                            <div
                                                key={log.id}
                                                className={`p-3.5 rounded-xl border space-y-1.5 ${
                                                    isCustomer
                                                        ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                                        : isAgent
                                                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex justify-between items-center text-xs font-bold">
                                                    <span className="flex items-center gap-1.5">
                                                        {isCustomer ? '👤 Khách hàng' : isAgent ? '👨‍💼 Nhân viên' : '🤖 Hệ thống AI (n8n)'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-normal">
                                                        {formatDateTime(log.createdAt)}
                                                    </span>
                                                </div>

                                                <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                                                    {log.note || 'Không có ghi chú thêm.'}
                                                </p>

                                                <div className="text-xs text-slate-400 pt-0.5">
                                                    Hành động: <strong className="text-slate-600 font-semibold">{formatLogAction(log.action)}</strong>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: RESOLUTION COMPOSER */}
                    <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-5 h-fit">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    Biên Soạn Phương Án Giải Quyết
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                    Kết quả này sẽ lưu vào CSDL và kích hoạt n8n Luồng 3 gửi email thông báo khách hàng.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleGenerateAiDraft}
                                disabled={generatingDraft}
                                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Sparkles size={15} className="text-indigo-600" />
                                <span>{generatingDraft ? 'AI đang soạn...' : '✨ AI Soạn bản nháp'}</span>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs sm:text-sm font-bold text-slate-700">
                                Nội dung phản hồi chính thức cho khách hàng:
                            </label>
                            <textarea
                                rows={8}
                                placeholder="Nhập chi tiết giải pháp xử lý hoặc hướng dẫn khắc phục cho khách hàng..."
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition resize-y leading-relaxed font-sans"
                            />
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <span className="text-xs sm:text-sm text-slate-500">
                                Chuyên viên xử lý: <strong className="text-slate-800 font-bold">{agentName}</strong>
                            </span>

                            <button
                                onClick={handleSaveAndTriggerN8n}
                                disabled={submitting || !resolutionText.trim()}
                                className="w-full sm:w-auto px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                            >
                                <Save size={16} />
                                <span>{submitting ? 'Đang lưu & kích hoạt n8n...' : 'Lưu Kết Quả & Kích Hoạt n8n Gửi Mail'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}